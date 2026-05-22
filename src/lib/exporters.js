import JSZip from "jszip";
import { getProjectTitle, getSelectionStats } from "./project.js";
import { formatDuration, sanitizeFilename } from "./utils.js";

export function buildSceneBreakdown(project) {
  return {
    project: {
      id: project.id,
      title: getProjectTitle(project),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      targetDuration: `${project.settings.targetDuration} min`,
      niche: project.settings.niche === "Custom" ? project.settings.customNiche : project.settings.niche,
      tone: project.settings.tone,
      hookStyle: project.settings.hookStyle
    },
    metadata: {
      title: project.title,
      description: project.description,
      tags: project.tags,
      chapters: project.chapters
    },
    scenes: project.script.map((scene) => ({
      scene: scene.scene,
      section: scene.section,
      narration: scene.narration,
      duration_seconds: scene.duration_seconds,
      visual_direction: scene.visual_direction,
      stock_search_query: scene.stock_search_query,
      search_query_override: scene.search_query_override,
      b_roll_notes: scene.b_roll_notes,
      text_overlay: scene.text_overlay,
      selected_footage: scene.selectedFootage
        ? {
            provider: scene.selectedFootage.provider,
            page_url: scene.selectedFootage.pageUrl,
            download_url: scene.selectedFootage.downloadUrl,
            thumbnail: scene.selectedFootage.thumbnail,
            duration: scene.selectedFootage.duration,
            author: scene.selectedFootage.author,
            search_query: scene.selectedFootage.searchQuery
          }
        : null
    }))
  };
}

export function buildNarrationScript(project) {
  return project.script
    .map((scene) => {
      const header = `Scene ${scene.scene} - ${scene.section}`;
      return `${header}\n${scene.narration || "[Add narration]"}`;
    })
    .join("\n\n");
}

export function buildYoutubeMetadata(project) {
  const chapters = project.chapters?.length
    ? project.chapters.map((chapter) => `${chapter.timestamp} ${chapter.label}`).join("\n")
    : "0:00 Intro";

  return [
    "TITLE",
    project.title || getProjectTitle(project),
    "",
    "DESCRIPTION",
    project.description || "",
    "",
    "TAGS",
    (project.tags || []).join(", "),
    "",
    "CHAPTERS",
    chapters
  ].join("\n");
}

export function buildEditingGuide(project) {
  const stats = getSelectionStats(project);
  const sceneLines = project.script
    .map((scene) => {
      const footage = scene.selectedFootage?.downloadUrl || "Missing footage";
      return `Scene ${scene.scene} (${formatDuration(scene.duration_seconds)}) - ${scene.section}
Narration: ${scene.narration || "[Add narration]"}
Footage: ${footage}
Overlay: ${scene.text_overlay || "None"}
Notes: ${scene.b_roll_notes || scene.visual_direction}`;
    })
    .join("\n\n");

  return `FacelessForge Editing Guide
Project: ${getProjectTitle(project)}
Scenes: ${stats.total}
Estimated runtime: ${formatDuration(stats.totalSeconds)}

CapCut / DaVinci Resolve workflow
1. Create a 16:9 timeline at 1080p or 4K, 30 fps, using the estimated runtime above as the target.
2. Import the voiceover recording, selected stock clips, music bed, sound effects, and any on-screen graphics.
3. Place the full voiceover on track one and add markers for each scene boundary from the scene list below.
4. Put each selected stock clip above the matching narration section. Trim every clip to the scene duration, then use speed ramps or secondary b-roll if a clip runs short.
5. Add text overlays exactly where listed. Keep overlays large, high-contrast, and on screen for at least 2 seconds.
6. Use hard cuts for news-style pacing, 8-12 frame dissolves for documentary pacing, and subtle zoom keyframes on static-looking clips.
7. Mix narration around -6 dB, music around -24 dB, and duck music under important facts or hooks.
8. Export H.264 MP4. For YouTube, use 15-25 Mbps at 1080p or 45-60 Mbps at 4K.

Scene assembly
${sceneLines}

Final check
- Every scene has selected footage.
- Captions and overlays do not cover important subjects.
- The first 10 seconds show the hook clearly.
- Metadata from youtube_metadata.txt is pasted into YouTube Studio.`;
}

export async function downloadProjectZip(project) {
  const zip = new JSZip();
  zip.file("scene_breakdown.json", JSON.stringify(buildSceneBreakdown(project), null, 2));
  zip.file("script.txt", buildNarrationScript(project));
  zip.file("youtube_metadata.txt", buildYoutubeMetadata(project));
  zip.file("editing_guide.txt", buildEditingGuide(project));

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(getProjectTitle(project)) || "facelessforge"}-export.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
