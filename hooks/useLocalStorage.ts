import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import type { Project } from '../types';

// FIX: Imported Dispatch and SetStateAction from 'react' to resolve missing namespace error.
function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        if (key === 'resourceFavorites') {
          return new Set(JSON.parse(item)) as T;
        }
        
        // Special hydration for Sets within Project objects
        if (key === 'mixingProjects') {
          const parsedProjects = JSON.parse(item) as any[];
          
          // Robust sanitization and hydration
          const sanitizedProjects = parsedProjects
            .filter(p => p && typeof p === 'object' && typeof p.id === 'string') // Ensure p is a valid object with an id
            .map(p => {
              const subSteps = Array.isArray(p.completedSubSteps) ? p.completedSubSteps : [];
              return {
                id: p.id,
                name: p.name || 'Proyecto Sin Nombre',
                completedSubSteps: new Set(subSteps),
                isPriority: !!p.isPriority,
                createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
                icon: p.icon || 'default',
                lastStepIndex: typeof p.lastStepIndex === 'number' ? p.lastStepIndex : 0,
              };
            });

          return sanitizedProjects as T;
        }
        return JSON.parse(item);
      }
      return initialValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (key === 'resourceFavorites' && storedValue instanceof Set) {
        window.localStorage.setItem(key, JSON.stringify(Array.from(storedValue)));
      } else if (key === 'mixingProjects' && Array.isArray(storedValue)) {
        const valueToStore = storedValue.map((p: any) => ({
          ...p,
          completedSubSteps: Array.from(p.completedSubSteps || []),
          icon: p.icon || 'default'
        }));
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } else {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export { useLocalStorage };