export const refreshPantryCount = () => {
  // Use a small timeout to ensure DB transactions have finished
  setTimeout(() => {
    window.dispatchEvent(new Event('pantryUpdated'));
  }, 100);
};
