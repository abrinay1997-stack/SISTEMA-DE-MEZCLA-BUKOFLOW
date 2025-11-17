import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import type { Project, SubStepFeedback } from '../types';
import { RELEASE_STEPS } from '../constants';


function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);

        if (key === 'resourceFavorites') {
          return new Set(parsed) as T;
        }
        
        if (key === 'releaseProjects') {
          const projects = parsed as any[];

          return projects.map(p => {
            let feedbackMap: Map<string, SubStepFeedback>;

            if (p.completedSubSteps && !p.subStepFeedback) {
              feedbackMap = new Map();
              if (Array.isArray(p.completedSubSteps)) {
                p.completedSubSteps.forEach((id: string) => {
                  feedbackMap.set(id, { completed: true });
                });
              }
            } 
            else if (p.subStepFeedback && Array.isArray(p.subStepFeedback)) {
              feedbackMap = new Map(p.subStepFeedback);
            } 
            else {
              feedbackMap = new Map();
            }

            // Hydrate new fields for backward compatibility
            const steps = p.steps && p.steps.length > 0 
                ? p.steps 
                : JSON.parse(JSON.stringify(RELEASE_STEPS));
            const budget = p.budget || [];
            const income = p.income || [];
            const activityLog = p.activityLog || [];
            const performanceSummary = p.performanceSummary || { spotifyStreams: 12450, instagramFollowersGained: 250, presaveCost: 0.25, tiktokViews: 250000 };
            const advances = p.advances || 0;
            const royaltySplits = p.royaltySplits || '';

            return {
              id: p.id || crypto.randomUUID(),
              name: p.name || 'Proyecto Sin Nombre',
              subStepFeedback: feedbackMap,
              isPriority: !!p.isPriority,
              createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
              icon: p.icon || 'default',
              lastStepIndex: typeof p.lastStepIndex === 'number' ? p.lastStepIndex : 0,
              releaseDate: p.releaseDate,
              steps: steps,
              budget: budget,
              income: income,
              advances: advances,
              royaltySplits: royaltySplits,
              activityLog: activityLog,
              performanceSummary: performanceSummary
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
      } else if (key === 'releaseProjects' && Array.isArray(storedValue)) {
        valueToStore = storedValue.map((p: any) => ({
          ...p,
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