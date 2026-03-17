export const getDisplayName = (user: any): string => {
    if (!user) return 'Guest';
    if (user.alias) return user.alias;
    
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (fullName) return fullName;

    return user.email.split('@')[0];
};
