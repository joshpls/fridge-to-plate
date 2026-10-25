// server/src/scripts/auditUploads.ts
import { prisma } from '../config/db.js';
import fs from 'fs/promises';
import path from 'path';

// Resolve uploads directory safely regardless of execution current working directory
const getUploadsDir = () => {
    const primaryPath = path.join(process.cwd(), 'public', 'uploads');
    const serverPath = path.join(process.cwd(), 'server', 'public', 'uploads');
    
    return fs.stat(primaryPath).then(() => primaryPath).catch(() => serverPath);
};

// Recursive function to get all files in a directory
async function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): Promise<string[]> {
    let files;
    try {
        files = await fs.readdir(dirPath, { withFileTypes: true });
    } catch (err) {
        return arrayOfFiles;
    }

    for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
            await getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    }

    return arrayOfFiles;
}

async function auditUploads() {
    try {
        console.log("🔍 Starting upload directory audit...");

        const uploadsDir = await getUploadsDir();
        console.log(`📁 Target uploads directory: ${uploadsDir}`);

        // 1. Get all file paths from disk
        const localFiles = await getAllFiles(uploadsDir);
        
        const fileMap = new Map<string, string>(); // Web URL -> Absolute Path
        localFiles.forEach(absolutePath => {
            const uploadsIndex = absolutePath.indexOf('uploads');
            if (uploadsIndex !== -1) {
                const dbFormatUrl = '/' + absolutePath.substring(uploadsIndex).replace(/\\/g, '/');
                fileMap.set(dbFormatUrl, absolutePath);
            }
        });

        console.log(`📊 Found ${fileMap.size} files on disk.`);

        // 2. Fetch all image URLs from the database using your shared prisma instance
        console.log("📦 Fetching image references from database...");
        const [recipes, recipeImages] = await Promise.all([
            prisma.recipe.findMany({ select: { imageUrl: true } }),
            prisma.recipeImage.findMany({ select: { url: true } })
        ]);

        const dbImageUrls = new Set<string>();
        recipes.forEach(r => {
            if (r.imageUrl) dbImageUrls.add(r.imageUrl);
        });
        recipeImages.forEach(img => {
            if (img.url) dbImageUrls.add(img.url);
        });

        console.log(`🗄️ Found ${dbImageUrls.size} unique image references active in the database.`);

        // 3. Compare disk files against database entries
        let matchedCount = 0;
        const orphanedFiles: string[] = [];

        fileMap.forEach((absolutePath, webUrl) => {
            if (dbImageUrls.has(webUrl)) {
                matchedCount++;
            } else {
                orphanedFiles.push(absolutePath);
            }
        });

        console.log("\n================ REPORT ================");
        console.log(`✅ Actively Used Files : ${matchedCount}`);
        console.log(`❌ Orphaned Files      : ${orphanedFiles.length}`);
        console.log("========================================\n");

        if (orphanedFiles.length > 0) {
            console.log("Orphaned files found:");
            orphanedFiles.forEach(file => console.log(`  - ${file}`));

            // Check if --delete flag was passed
            const shouldDelete = process.argv.includes('--delete');
            if (shouldDelete) {
                console.log("\n🗑️ Deleting orphaned files as requested (--delete flag detected)...");
                for (const filePath of orphanedFiles) {
                    try {
                        await fs.unlink(filePath);
                        console.log(`   Deleted: ${filePath}`);
                    } catch (err) {
                        console.error(`   Failed to delete ${filePath}:`, err);
                    }
                }
                console.log("✨ Cleanup complete!");
            } else {
                console.log("\n💡 Tip: Run this script with the `--delete` flag to automatically remove these orphaned files:");
                console.log("   npm run audit:uploads -- --delete");
            }
        } else {
            console.log("✨ All files on disk are actively referenced in the database! No orphans found.");
        }

    } catch (error) {
        console.error("❌ Error running upload audit:", error);
    } finally {
        await prisma.$disconnect();
    }
}

auditUploads();
