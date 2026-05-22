import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createEmptyProject, hydrateProject, upsertProject } from "../lib/project.js";
import {
  getInitialProjectState,
  saveCurrentProjectId,
  saveProjects
} from "../lib/storage.js";

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [initialState] = useState(getInitialProjectState);
  const [projects, setProjects] = useState(initialState.projects);
  const [currentProjectId, setCurrentProjectId] = useState(initialState.currentProjectId);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveCurrentProjectId(currentProjectId);
  }, [currentProjectId]);

  const currentProject = useMemo(
    () => projects.find((project) => project.id === currentProjectId) || projects[0] || null,
    [projects, currentProjectId]
  );

  const createProject = useCallback((seed = {}) => {
    const project = createEmptyProject(seed);
    setProjects((items) => upsertProject(items, project));
    setCurrentProjectId(project.id);
    return project;
  }, []);

  const setActiveProject = useCallback((id) => {
    setCurrentProjectId(id);
  }, []);

  const updateProject = useCallback(
    (updater) => {
      setProjects((items) => {
        const current = items.find((project) => project.id === currentProjectId) || items[0];
        if (!current) return items;

        const patch = typeof updater === "function" ? updater(current) : updater;
        const next = hydrateProject({
          ...current,
          ...patch,
          updatedAt: new Date().toISOString()
        });

        return upsertProject(items, next);
      });
    },
    [currentProjectId]
  );

  const updateScene = useCallback(
    (sceneId, updater) => {
      updateProject((project) => ({
        script: project.script.map((scene) => {
          if (scene.id !== sceneId) return scene;
          const patch = typeof updater === "function" ? updater(scene) : updater;
          return { ...scene, ...patch };
        })
      }));
    },
    [updateProject]
  );

  const value = useMemo(
    () => ({
      projects,
      currentProject,
      currentProjectId,
      createProject,
      setActiveProject,
      updateProject,
      updateScene
    }),
    [projects, currentProject, currentProjectId, createProject, setActiveProject, updateProject, updateScene]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjects must be used inside ProjectProvider.");
  }
  return context;
}
