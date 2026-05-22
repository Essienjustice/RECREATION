import { makeId } from "./utils.js";

export const TARGET_DURATIONS = [
  { label: "3 min", value: "3" },
  { label: "5 min", value: "5" },
  { label: "8 min", value: "8" },
  { label: "10 min", value: "10" }
];

export const NICHES = [
  "Finance",
  "Tech",
  "Health",
  "History",
  "True Crime",
  "Motivation",
  "Business",
  "Science",
  "Travel",
  "Custom"
];

export const TONES = ["Educational", "Storytelling", "News-style", "Conversational", "Documentary"];

export const HOOK_STYLES = ["Question", "Shocking Fact", "Story opener", "Bold Statement"];

export const DEFAULT_SETTINGS = {
  topic: "",
  targetDuration: "5",
  niche: "Business",
  customNiche: "",
  tone: "Educational",
  hookStyle: "Question"
};

const STAGE_RANK = {
  write: 0,
  footage: 1,
  export: 2
};

export function createEmptyProject(seed = {}) {
  const now = new Date().toISOString();
  return hydrateProject({
    id: makeId("project"),
    createdAt: now,
    updatedAt: now,
    stageReached: "write",
    title: "Untitled project",
    description: "",
    tags: [],
    chapters: [],
    script: [],
    manualMode: false,
    errorBanner: "",
    settings: {
      ...DEFAULT_SETTINGS,
      ...(seed.settings || {})
    },
    ...seed
  });
}

export function hydrateProject(project) {
  const settings = { ...DEFAULT_SETTINGS, ...(project?.settings || {}) };
  return {
    id: project?.id || makeId("project"),
    createdAt: project?.createdAt || new Date().toISOString(),
    updatedAt: project?.updatedAt || new Date().toISOString(),
    stageReached: project?.stageReached || "write",
    title: project?.title || settings.topic || "Untitled project",
    description: project?.description || "",
    tags: Array.isArray(project?.tags) ? project.tags : [],
    chapters: normalizeChapters(project?.chapters || []),
    script: normalizeScenes(project?.script || [], settings),
    manualMode: Boolean(project?.manualMode),
    errorBanner: project?.errorBanner || "",
    settings
  };
}

export function upsertProject(projects, project) {
  const hydrated = hydrateProject(project);
  const next = [hydrated, ...projects.filter((item) => item.id !== hydrated.id)];
  return next
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);
}

export function advanceStage(project, nextStage) {
  const currentRank = STAGE_RANK[project.stageReached || "write"] ?? 0;
  const nextRank = STAGE_RANK[nextStage] ?? 0;
  return currentRank >= nextRank ? project.stageReached : nextStage;
}

export function getNicheLabel(settings) {
  if (settings.niche === "Custom") {
    return settings.customNiche?.trim() || "Custom";
  }
  return settings.niche;
}

export function getProjectTitle(project) {
  return project?.title?.trim() || project?.settings?.topic?.trim() || "Untitled project";
}

export function getSelectionStats(project) {
  const total = project?.script?.length || 0;
  const selected = project?.script?.filter((scene) => scene.selectedFootage?.downloadUrl).length || 0;
  return {
    total,
    selected,
    allSelected: total > 0 && selected === total,
    totalSeconds: project?.script?.reduce((sum, scene) => sum + (Number(scene.duration_seconds) || 0), 0) || 0
  };
}

export function getStageLabel(project) {
  const stats = getSelectionStats(project);
  if (!project?.script?.length) return "Draft";
  if (stats.allSelected || project.stageReached === "export") return "Export ready";
  if (project.stageReached === "footage" || stats.selected > 0) return "Footage";
  return "Script written";
}

export function getResumeRoute(project) {
  const stats = getSelectionStats(project);
  if (!project?.script?.length) return "/write";
  if (stats.allSelected || project.stageReached === "export") return "/export";
  if (project.stageReached === "footage" || stats.selected > 0) return "/footage";
  return "/write";
}

export function normalizeGeneratedScript(payload, settings) {
  const script = Array.isArray(payload?.script) ? payload.script : [];
  if (!script.length) {
    throw new Error("Claude returned JSON without script scenes.");
  }

  return {
    title: cleanText(payload.title) || titleFromSettings(settings),
    description: cleanText(payload.description),
    tags: normalizeTags(payload.tags, settings),
    chapters: normalizeChapters(payload.chapters),
    script: normalizeScenes(script, settings)
  };
}

export function createManualDraft(settings) {
  const sceneCount = getManualSceneCount(settings.targetDuration);
  const totalSeconds = Number(settings.targetDuration || 5) * 60;
  const sceneDuration = Math.max(15, Math.round(totalSeconds / sceneCount));
  const sections = ["Hook", "Intro", "Setup", "Point 1", "Point 2", "Point 3", "Proof", "Takeaway", "CTA"];
  const topic = settings.topic?.trim() || "your video topic";
  const query = simplifyQuery(`${getNicheLabel(settings)} ${topic}`);

  const script = Array.from({ length: sceneCount }, (_, index) => {
    const section = sections[index] || `Scene ${index + 1}`;
    return {
      id: makeId("scene"),
      scene: index + 1,
      section,
      narration: "",
      duration_seconds: sceneDuration,
      visual_direction: `Use clean stock footage that supports ${section.toLowerCase()} in a ${getNicheLabel(settings)} video.`,
      stock_search_query: query,
      b_roll_notes: "Prioritize crisp, high-contrast horizontal footage with room for captions.",
      text_overlay: index === 0 ? topic : "",
      search_query_override: "",
      selectedFootage: null
    };
  });

  return {
    title: titleFromSettings(settings),
    description: `A faceless YouTube video draft about ${topic}. Add the final SEO description after writing the narration.`,
    tags: normalizeTags([], settings),
    chapters: buildChapters(script),
    script
  };
}

export function buildChapters(script) {
  let elapsed = 0;
  return script.map((scene, index) => {
    const chapter = {
      label: scene.section || `Scene ${index + 1}`,
      timestamp: toTimestamp(elapsed)
    };
    elapsed += Number(scene.duration_seconds) || 0;
    return chapter;
  });
}

function normalizeScenes(scenes, settings) {
  const fallbackDuration = Math.max(15, Math.round((Number(settings.targetDuration || 5) * 60) / Math.max(1, scenes.length || 1)));
  return scenes.map((scene, index) => ({
    id: scene.id || makeId("scene"),
    scene: Number(scene.scene) || index + 1,
    section: cleanText(scene.section) || (index === 0 ? "Hook" : `Scene ${index + 1}`),
    narration: cleanText(scene.narration),
    duration_seconds: Number(scene.duration_seconds) || fallbackDuration,
    visual_direction: cleanText(scene.visual_direction) || "Show relevant stock footage with clear visual context.",
    stock_search_query: cleanText(scene.stock_search_query) || simplifyQuery(`${getNicheLabel(settings)} ${settings.topic}`),
    b_roll_notes: cleanText(scene.b_roll_notes) || "Use steady, modern horizontal b-roll.",
    text_overlay: cleanText(scene.text_overlay),
    search_query_override: cleanText(scene.search_query_override),
    selectedFootage: scene.selectedFootage || null
  }));
}

function normalizeTags(tags, settings) {
  const base = Array.isArray(tags) ? tags : String(tags || "").split(",");
  const cleaned = base.map((tag) => cleanText(tag)).filter(Boolean);
  const fallback = [
    settings.topic,
    getNicheLabel(settings),
    "faceless youtube",
    "stock footage",
    "youtube automation",
    "documentary video",
    "educational video",
    "video essay",
    "b roll",
    "creator studio"
  ].filter(Boolean);
  return [...cleaned, ...fallback].filter((tag, index, all) => all.indexOf(tag) === index).slice(0, 10);
}

function normalizeChapters(chapters) {
  if (!Array.isArray(chapters)) return [];
  return chapters
    .map((chapter, index) => ({
      label: cleanText(chapter?.label) || `Chapter ${index + 1}`,
      timestamp: cleanText(chapter?.timestamp) || "0:00"
    }))
    .filter((chapter) => chapter.label);
}

function getManualSceneCount(duration) {
  const minutes = Number(duration || 5);
  if (minutes <= 3) return 6;
  if (minutes <= 5) return 8;
  if (minutes <= 8) return 10;
  return 12;
}

function titleFromSettings(settings) {
  const topic = settings.topic?.trim() || "Untitled Video";
  return topic.length > 72 ? topic.slice(0, 69).trim() + "..." : topic;
}

function simplifyQuery(value) {
  const stopWords = new Set(["the", "and", "for", "with", "about", "into", "from", "your", "video", "youtube"]);
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 4)
    .join(" ");
}

function toTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function cleanText(value) {
  return String(value ?? "").trim();
}
