import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LastVisitedLesson {
  id: string;
  slug?: string | null;
  moduleId?: string | null;
}

interface LearningPathStore {
  expandedModuleIds: Record<string, boolean>;
  lastVisitedLesson: LastVisitedLesson | null;
  toggleModule: (moduleId: string, defaultExpanded?: boolean) => void;
  setModuleExpanded: (moduleId: string, expanded: boolean) => void;
  setLastVisitedLesson: (lesson: LastVisitedLesson) => void;
  clearLastVisitedLesson: () => void;
  expandAll: (moduleIds: string[]) => void;
  collapseAll: () => void;
}

export const useLearningPathStore = create<LearningPathStore>()(
  persist(
    (set, get) => ({
      expandedModuleIds: {},
      lastVisitedLesson: null,

      toggleModule: (moduleId: string, defaultExpanded: boolean = false) => {
        const current = get().expandedModuleIds[moduleId];
        const isCurrentlyExpanded = current !== undefined ? current : defaultExpanded;
        set((state) => ({
          expandedModuleIds: {
            ...state.expandedModuleIds,
            [moduleId]: !isCurrentlyExpanded,
          },
        }));
      },

      setModuleExpanded: (moduleId: string, expanded: boolean) => {
        set((state) => ({
          expandedModuleIds: {
            ...state.expandedModuleIds,
            [moduleId]: expanded,
          },
        }));
      },

      setLastVisitedLesson: (lesson: LastVisitedLesson) => {
        set((state) => ({
          lastVisitedLesson: lesson,
          expandedModuleIds: lesson.moduleId
            ? { ...state.expandedModuleIds, [lesson.moduleId]: true }
            : state.expandedModuleIds,
        }));
      },

      clearLastVisitedLesson: () => {
        set({ lastVisitedLesson: null });
      },

      expandAll: (moduleIds: string[]) => {
        const newMap: Record<string, boolean> = {};
        moduleIds.forEach((id) => {
          newMap[id] = true;
        });
        set({ expandedModuleIds: newMap });
      },

      collapseAll: () => {
        set({ expandedModuleIds: {} });
      },
    }),
    {
      name: "learning_path_expanded_modules",
    }
  )
);
