// Define the structure of a saved app
export interface SavedApp {
  id: string;
  prompt: string;
  code: string;
  createdAt: number;
}

const STORAGE_KEY = 'prompt2app_gallery';

// Get all saved apps from localStorage
export const getSavedApps = (): SavedApp[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading saved apps:', error);
    return [];
  }
};

// Save a new app to localStorage
export const saveApp = (prompt: string, code: string): SavedApp => {
  const newApp: SavedApp = {
    id: Date.now().toString(),
    prompt,
    code,
    createdAt: Date.now()
  };
  
  try {
    const existingApps = getSavedApps();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newApp, ...existingApps]));
    return newApp;
  } catch (error) {
    console.error('Error saving app:', error);
    throw error;
  }
};

// Get a single app by ID
export const getAppById = (id: string): SavedApp | undefined => {
  const apps = getSavedApps();
  return apps.find(app => app.id === id);
};

// Delete an app by ID
export const deleteApp = (id: string): void => {
  const apps = getSavedApps();
  const filtered = apps.filter(app => app.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}; 