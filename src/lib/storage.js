import { createEmptyProject, hydrateProject } from "./project.js";

const PROJECTS_KEY = "facelessforge.projects";
const CURRENT_PROJECT_KEY = "facelessforge.currentProjectId";

export function getInitialProjectState() {
  const projects = loadProjects();
  const savedCurrentId = loadCurrentProjectId();

  if (!projects.length) {
    const project = createEmptyProject();
    return {
      projects: [project],
      currentProjectId: project.id
    };
  }

  const currentProjectId = projects.some((project) => project.id === savedCurrentId)
    ? savedCurrentId
    : projects[0].id;

  return {
    projects,
    currentProjectId
  };
}

export function loadProjects() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROJECTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(hydrateProject).slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects.slice(0, 10)));
}

export function loadCurrentProjectId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(CURRENT_PROJECT_KEY) || "";
}

export function saveCurrentProjectId(id) {
  if (typeof window === "undefined") return;
  if (id) {
    window.localStorage.setItem(CURRENT_PROJECT_KEY, id);
  }
}
