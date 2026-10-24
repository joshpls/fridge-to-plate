import React, { useState, useRef, useEffect } from 'react';

interface ImageEditorModalProps {
    file: File | string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (processedFile: File) => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ file, isOpen, onClose, onSave }) => {
    const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
    const [zoom, setZoom] = useState<number>(1); // 1 to 4
    const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [imageSrc, setImageSrc] = useState<string>('');
    const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [originalFileName, setOriginalFileName] = useState<string>('recipe-image.jpg');
    const [fileSize, setFileSize] = useState<number>(0);
    const [loadingImage, setLoadingImage] = useState<boolean>(true);
    const [processing, setProcessing] = useState<boolean>(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const isDraggingRef = useRef<boolean>(false);
    const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const initialPinchDistRef = useRef<number | null>(null);
    const initialZoomRef = useRef<number>(1);

    useEffect(() => {
        if (!file) return;
        setLoadingImage(true);
        setRotation(0);
        setZoom(1);
        setPan({ x: 0, y: 0 });

        let objectUrl = '';
        const loadImg = async () => {
            try {
                if (file instanceof File) {
                    objectUrl = URL.createObjectURL(file);
                    setOriginalFileName(file.name || 'recipe-image.jpg');
                    setFileSize(file.size);
                } else {
                    // It's a URL string (existing uploaded photo)
                    const res = await fetch(file);
                    const blob = await res.blob();
                    objectUrl = URL.createObjectURL(blob);
                    const nameMatch = file.split('/').pop() || 'recipe-image.jpg';
                    setOriginalFileName(nameMatch);
                    setFileSize(blob.size);
                }

                setImageSrc(objectUrl);

                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = objectUrl;
                img.onload = () => {
                    setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                    setLoadingImage(false);
                };
                img.onerror = () => {
                    setLoadingImage(false);
                };
            } catch (err) {
                console.error("Failed to load image for editing", err);
                setLoadingImage(false);
            }
        };

        loadImg();

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    if (!isOpen) return null;

    const handleRotateLeft = () => {
        setRotation(prev => (prev - 90 + 360) % 360);
        setPan({ x: 0, y: 0 });
    };

    const handleRotateRight = () => {
        setRotation(prev => (prev + 90) % 360);
        setPan({ x: 0, y: 0 });
    };

    const handleReset = () => {
        setRotation(0);
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        
        if (pointersRef.current.size === 1) {
            isDraggingRef.current = true;
            dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        } else if (pointersRef.current.size === 2) {
            isDraggingRef.current = false;
            const pts = Array.from(pointersRef.current.values());
            const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            initialPinchDistRef.current = dist;
            initialZoomRef.current = zoom;
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!pointersRef.current.has(e.pointerId)) return;
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointersRef.current.size === 2 && initialPinchDistRef.current !== null) {
            const pts = Array.from(pointersRef.current.values());
            const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            const scale = dist / initialPinchDistRef.current;
            const newZoom = Math.min(Math.max(initialZoomRef.current * scale, 1), 4);
            setZoom(newZoom);
        } else if (pointersRef.current.size === 1 && isDraggingRef.current) {
            setPan({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y
            });
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        pointersRef.current.delete(e.pointerId);
        if (pointersRef.current.size < 2) {
            initialPinchDistRef.current = null;
        }
        if (pointersRef.current.size === 0) {
            isDraggingRef.current = false;
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        setZoom(prev => Math.min(Math.max(prev + delta, 1), 4));
    };

    const handleApply = async () => {
        setProcessing(true);
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = imageSrc;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            // Set max target export size (1200x1200px max for recipe images)
            const MAX_DIM = 1200;
            let targetW = imageNaturalSize.width || img.naturalWidth;
            let targetH = imageNaturalSize.height || img.naturalHeight;

            if (targetW > MAX_DIM || targetH > MAX_DIM) {
                if (targetW > targetH) {
                    targetH = Math.round((targetH * MAX_DIM) / targetW);
                    targetW = MAX_DIM;
                } else {
                    targetW = Math.round((targetW * MAX_DIM) / targetH);
                    targetH = MAX_DIM;
                }
            }

            canvas.width = targetW;
            canvas.height = targetH;

            ctx.clearRect(0, 0, targetW, targetH);
            ctx.save();

            ctx.translate(targetW / 2, targetH / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(zoom, zoom);
            
            const containerEl = containerRef.current;
            const containerWidth = containerEl ? containerEl.clientWidth || 300 : 300;
            const panScaleX = (targetW / containerWidth) * pan.x;
            const panScaleY = (targetH / containerWidth) * pan.y;

            ctx.translate(panScaleX, panScaleY);

            const drawW = rotation === 90 || rotation === 270 ? targetH : targetW;
            const drawH = rotation === 90 || rotation === 270 ? targetW : targetH;

            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();

            canvas.toBlob((blob) => {
                if (!blob) {
                    setProcessing(false);
                    return;
                }
                const processedFile = new File([blob], originalFileName, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                });
                onSave(processedFile);
                setProcessing(false);
                onClose();
            }, 'image/jpeg', 0.92);

        } catch (err) {
            console.error('Failed to process image', err);
            setProcessing(false);
        }
    };

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in select-none">
            <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Crop & Adjust Image</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                            {loadingImage ? 'Loading image...' : `${imageNaturalSize.width} × ${imageNaturalSize.height} px (${formatBytes(fileSize)}) • Max Target: 1200px`}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold"
                    >
                        ✕
                    </button>
                </div>

                {/* Interactive Crop / Pan / Zoom Viewport */}
                <div 
                    ref={containerRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onWheel={handleWheel}
                    className="touch-none flex flex-col items-center justify-center bg-gray-900 rounded-2xl h-[320px] overflow-hidden relative border-2 border-dashed border-gray-700 cursor-grab active:cursor-grabbing shadow-inner"
                >
                    {loadingImage ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 text-white space-y-2">
                            <span className="animate-spin text-3xl">⏳</span>
                            <span className="text-xs font-bold text-gray-400">Loading high-res photo...</span>
                        </div>
                    ) : (
                        <>
                            {/* Crop guide frame overlay */}
                            <div className="absolute inset-6 border-2 border-orange-400/80 rounded-xl pointer-events-none z-10 flex items-center justify-center">
                                <div className="absolute inset-0 bg-black/25 pointer-events-none rounded-xl" />
                                <span className="text-[10px] uppercase font-black tracking-widest text-white/75 bg-black/50 px-2.5 py-1 rounded-md z-20 backdrop-blur-sm">
                                    Recipe Frame Preview
                                </span>
                            </div>

                            {imageSrc && (
                                <img 
                                    src={imageSrc} 
                                    alt="Crop Preview" 
                                    style={{ 
                                        transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                                        touchAction: 'none'
                                    }}
                                    className="max-h-[240px] max-w-full object-contain transition-transform duration-75 select-none pointer-events-none"
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Controls: Rotate, Zoom Slider & Reset */}
                <div className="space-y-4 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-gray-950 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleRotateLeft}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-gray-900 font-bold text-xs text-gray-700 dark:text-gray-300 hover:border-orange-400 border border-gray-200 dark:border-gray-800 transition-all shadow-sm active:scale-95"
                                title="Rotate Left 90°"
                            >
                                <span>↺ Left 90°</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleRotateRight}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-gray-900 font-bold text-xs text-gray-700 dark:text-gray-300 hover:border-orange-400 border border-gray-200 dark:border-gray-800 transition-all shadow-sm active:scale-95"
                                title="Rotate Right 90°"
                            >
                                <span>↻ Right 90°</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-3 py-2 rounded-xl bg-white dark:bg-gray-900 font-bold text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 hover:border-red-400 border border-gray-200 dark:border-gray-800 transition-all shadow-sm active:scale-95"
                                title="Reset adjustments"
                            >
                                Reset
                            </button>
                        </div>

                        <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Zoom</span>
                            <input 
                                type="range" 
                                min="1" 
                                max="4" 
                                step="0.05" 
                                value={zoom} 
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-full accent-orange-500 cursor-pointer"
                            />
                            <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 w-8 text-right">
                                {zoom.toFixed(1)}x
                            </span>
                        </div>
                    </div>

                    <p className="text-[11px] text-gray-400 text-center font-medium">
                        💡 Tip: Pinch-to-zoom on mobile or drag/scroll to pan & zoom.
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={processing || loadingImage}
                        onClick={handleApply}
                        className="px-6 py-2.5 rounded-xl font-black bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50"
                    >
                        {processing ? 'Processing...' : 'Crop & Save Photo'}
                    </button>
                </div>
            </div>
        </div>
    );
};
