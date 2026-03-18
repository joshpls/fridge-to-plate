export const getDisplayName = (user: any): string => {
    // 1. If no user object exists at all
    if (!user) return 'Guest';
    
    // 2. If they set an Alias (Highest Priority)
    if (user.alias) return user.alias;
    
    // 3. If they set a First/Last Name
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (fullName) return fullName;

    // 4. Fallback to Email prefix
    if (user.email) return user.email.split('@')[0];

    return 'Guest';
};
