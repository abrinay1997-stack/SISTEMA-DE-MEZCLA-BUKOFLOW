import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import type { Project, SubStepFeedback } from '../types';

function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);

        if (key === 'resourceFavorites') {
          return new Set(parsed) as T;
        }
        
        if (key === 'mixingProjects') {
          const projects = parsed as any[];

          return projects.map(p => {
            let feedbackMap: Map<string, SubStepFeedback>;

            // Migration from old format (Set saved as an array)
            if (p.completedSubSteps && !p.subStepFeedback) {
              feedbackMap = new Map();
              if (Array.isArray(p.completedSubSteps)) {
                p.completedSubSteps.forEach((id: string) => {
                  feedbackMap.set(id, { completed: true });
                });
              }
            } 
            // Hydration from new format (Map saved as an array of [key, value] pairs)
            else if (p.subStepFeedback && Array.isArray(p.subStepFeedback)) {
              feedbackMap = new Map(p.subStepFeedback);
            } 
            // Default for new or malformed projects
            else {
              feedbackMap = new Map();
            }

            return {
              id: p.id || crypto.randomUUID(),
              name: p.name || 'Proyecto Sin Nombre',
              subStepFeedback: feedbackMap,
              isPriority: !!p.isPriority,
              createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
              icon: p.icon || 'default',
              lastStepIndex: typeof p.lastStepIndex === 'number' ? p.lastStepIndex : 0,
            };
          }) as T;
        }

        return parsed;
      }
      return initialValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      let valueToStore = storedValue;

      if (key === 'resourceFavorites' && storedValue instanceof Set) {
        valueToStore = Array.from(storedValue) as any;
      } else if (key === 'mixingProjects' && Array.isArray(storedValue)) {
        valueToStore = storedValue.map((p: any) => ({
          ...p,
          // Convert Map to array of [key, value] pairs for JSON serialization
          subStepFeedback: Array.from((p.subStepFeedback as Map<string, SubStepFeedback>).entries()),
        })) as any;
      }

      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export { useLocalStorage };
