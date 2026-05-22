import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Wand2
} from "lucide-react";
import { useProjects } from "../context/ProjectContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { generateClaudeScript } from "../lib/anthropic.js";
import {
  HOOK_STYLES,
  NICHES,
  TARGET_DURATIONS,
  TONES,
  advanceStage,
  buildChapters,
  createManualDraft,
  getNicheLabel,
  normalizeGeneratedScript
} from "../lib/project.js";
import { cn, parseCsv } from "../lib/utils.js";
import { Badge, Button, Card, Field, Input, Select, SkeletonBlock, Textarea } from "../components/ui.jsx";

export function WritePage() {
  const navigate = useNavigate();
  const { currentProject, updateProject, updateScene } = useProjects();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const settings = currentProject.settings;
  const hasScript = currentProject.script.length > 0;

  function updateSettings(field, value) {
    updateProject((project) => ({
      settings: {
        ...project.settings,
        [field]: value
      },
      title: project.script.length ? project.title : field === "topic" && value.trim() ? value : project.title
    }));
  }

  async function handleGenerate() {
    if (!settings.topic.trim()) {
      toast({
        title: "Add a video topic first",
        description: "The script writer needs a clear topic before calling Claude.",
        tone: "warning"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await generateClaudeScript(settings);
      const normalized = normalizeGeneratedScript(response, settings);
      updateProject((project) => ({
        ...normalized,
        settings: project.settings,
        stageReached: "write",
        manualMode: false,
        errorBanner: ""
      }));
      toast({ title: "Script generated", description: "Scenes, metadata, and stock queries are ready.", tone: "success" });
    } catch (error) {
      const manual = createManualDraft(settings);
      updateProject((project) => ({
        ...manual,
        settings: project.settings,
        stageReached: "write",
        manualMode: true,
        errorBanner: "API limit reached - edit script manually"
      }));
      toast({
        title: "API limit reached - edit script manually",
        description: error.message || "The manual editor is unlocked with a structured draft.",
        tone: "warning"
      });
    } finally {
      setLoading(false);
    }
  }

  function handleFindFootage() {
    if (!currentProject.script.length) {
      toast({ title: "Generate or write a script first", tone: "warning" });
      return;
    }
    updateProject((project) => ({
      stageReached: advanceStage(project, "footage"),
      chapters: project.chapters.length ? project.chapters : buildChapters(project.script)
    }));
    navigate("/footage");
  }

  function setManualMode(value) {
    updateProject({ manualMode: value, errorBanner: value ? currentProject.errorBanner : "" });
  }

  const tagText = useMemo(() => currentProject.tags.join(", "), [currentProject.tags]);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="h-fit p-5 lg:sticky lg:top-32">
        <div className="mb-5">
          <Badge tone="violet">Stage 1</Badge>
          <h1 className="mt-4 text-2xl font-extrabold text-white">Script Writer</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Build the script, metadata, scene plan, and stock-search keywords in one pass.
          </p>
        </div>

        <div className="space-y-4">
          <Field label="Video Topic">
            <Input
              value={settings.topic}
              onChange={(event) => updateSettings("topic", event.target.value)}
              placeholder="The hidden cost of credit card debt"
            />
          </Field>

          <Field label="Target Duration">
            <Select value={settings.targetDuration} onChange={(event) => updateSettings("targetDuration", event.target.value)}>
              {TARGET_DURATIONS.map((duration) => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Channel Niche">
            <Select value={settings.niche} onChange={(event) => updateSettings("niche", event.target.value)}>
              {NICHES.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
                </option>
              ))}
            </Select>
          </Field>

          {settings.niche === "Custom" ? (
            <Field label="Custom Niche">
              <Input
                value={settings.customNiche}
                onChange={(event) => updateSettings("customNiche", event.target.value)}
                placeholder="Luxury real estate"
              />
            </Field>
          ) : null}

          <Field label="Tone">
            <Select value={settings.tone} onChange={(event) => updateSettings("tone", event.target.value)}>
              {TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Hook Style">
            <Select value={settings.hookStyle} onChange={(event) => updateSettings("hookStyle", event.target.value)}>
              {HOOK_STYLES.map((hook) => (
                <option key={hook} value={hook}>
                  {hook}
                </option>
              ))}
            </Select>
          </Field>

          <Button type="button" className="w-full" size="lg" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {hasScript ? "Regenerate Script" : "Generate Script"}
          </Button>

          {loading ? (
            <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-4 text-sm text-blue-100">
              <div className="flex items-center gap-3 font-semibold">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI is writing your script...
              </div>
              <div className="mt-4 space-y-2">
                <SkeletonBlock className="h-3 w-5/6" />
                <SkeletonBlock className="h-3 w-3/5" />
                <SkeletonBlock className="h-20 w-full" />
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="space-y-6">
        {currentProject.errorBanner ? (
          <Card className="border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
            {currentProject.errorBanner}
          </Card>
        ) : null}

        {!hasScript && !loading ? (
          <Card className="p-8">
            <div className="max-w-2xl">
              <Badge tone="blue">Ready when you are</Badge>
              <h2 className="mt-4 text-2xl font-extrabold text-white">Start with a structured script brief.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Fill the inputs, generate a script, then tune narration and scene notes before moving into footage search.
              </p>
            </div>
          </Card>
        ) : null}

        {hasScript ? (
          <>
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge tone="green">{getNicheLabel(settings)}</Badge>
                  <h2 className="mt-3 text-xl font-extrabold text-white">Metadata</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={handleGenerate} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    Regenerate
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setManualMode(!currentProject.manualMode)}>
                    <Edit3 className="h-4 w-4" />
                    {currentProject.manualMode ? "Preview mode" : "Edit manually"}
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <Field label="Title">
                  <Input value={currentProject.title} onChange={(event) => updateProject({ title: event.target.value })} />
                </Field>
                <Field label="Description">
                  <Textarea
                    className="min-h-[150px]"
                    value={currentProject.description}
                    onChange={(event) => updateProject({ description: event.target.value })}
                  />
                </Field>
                <Field label="Tags" hint="Comma-separated, max 10 stored in the export package.">
                  <Textarea
                    className="min-h-[82px]"
                    value={tagText}
                    onChange={(event) => updateProject({ tags: parseCsv(event.target.value).slice(0, 10) })}
                  />
                </Field>
                <ChapterEditor project={currentProject} updateProject={updateProject} />
              </div>
            </Card>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold text-white">Scene Breakdown</h2>
                <Button type="button" variant="secondary" size="sm" onClick={() => addScene(currentProject, updateProject)}>
                  <Plus className="h-4 w-4" />
                  Add scene
                </Button>
              </div>

              {currentProject.script.map((scene) => (
                <SceneEditor
                  key={scene.id}
                  scene={scene}
                  manualMode={currentProject.manualMode}
                  updateScene={updateScene}
                  updateProject={updateProject}
                  sceneCount={currentProject.script.length}
                />
              ))}
            </div>

            <div className="flex justify-end">
              <Button type="button" size="lg" onClick={handleFindFootage}>
                Looks good
                <ArrowRight className="h-4 w-4" />
                Find Footage
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ChapterEditor({ project, updateProject }) {
  function updateChapter(index, field, value) {
    updateProject((current) => ({
      chapters: current.chapters.map((chapter, itemIndex) =>
        itemIndex === index ? { ...chapter, [field]: value } : chapter
      )
    }));
  }

  function addChapter() {
    updateProject((current) => ({
      chapters: [...current.chapters, { label: "New chapter", timestamp: "0:00" }]
    }));
  }

  function removeChapter(index) {
    updateProject((current) => ({
      chapters: current.chapters.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase text-slate-400">Chapters</span>
        <Button type="button" variant="ghost" size="sm" onClick={addChapter}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {project.chapters.map((chapter, index) => (
          <div key={`${chapter.timestamp}-${index}`} className="grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)_40px]">
            <Input value={chapter.timestamp} onChange={(event) => updateChapter(index, "timestamp", event.target.value)} />
            <Input value={chapter.label} onChange={(event) => updateChapter(index, "label", event.target.value)} />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeChapter(index)} aria-label="Remove chapter">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneEditor({ scene, manualMode, updateScene, updateProject, sceneCount }) {
  function removeScene() {
    updateProject((project) => ({
      script: project.script
        .filter((item) => item.id !== scene.id)
        .map((item, index) => ({ ...item, scene: index + 1 }))
    }));
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="violet">Scene {scene.scene}</Badge>
            <Badge tone="blue">{scene.section}</Badge>
            <Badge>{scene.duration_seconds}s</Badge>
          </div>
          <p className="mt-3 text-sm text-slate-500">{scene.visual_direction}</p>
        </div>
        {sceneCount > 1 ? (
          <Button type="button" variant="ghost" size="sm" onClick={removeScene}>
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        ) : null}
      </div>

      <div className="mt-5">
        <Field label="Narration">
          <Textarea
            className="min-h-[160px]"
            value={scene.narration}
            placeholder="Write or refine the voiceover narration for this scene."
            onChange={(event) => updateScene(scene.id, { narration: event.target.value })}
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {manualMode ? (
          <>
            <Field label="Section">
              <Input value={scene.section} onChange={(event) => updateScene(scene.id, { section: event.target.value })} />
            </Field>
            <Field label="Duration seconds">
              <Input
                type="number"
                min="5"
                value={scene.duration_seconds}
                onChange={(event) => updateScene(scene.id, { duration_seconds: Number(event.target.value) || 0 })}
              />
            </Field>
            <Field label="Visual direction" className="md:col-span-2">
              <Textarea
                value={scene.visual_direction}
                onChange={(event) => updateScene(scene.id, { visual_direction: event.target.value })}
              />
            </Field>
            <Field label="Stock search query">
              <Input
                value={scene.stock_search_query}
                onChange={(event) => updateScene(scene.id, { stock_search_query: event.target.value })}
              />
            </Field>
            <Field label="Text overlay">
              <Input value={scene.text_overlay} onChange={(event) => updateScene(scene.id, { text_overlay: event.target.value })} />
            </Field>
            <Field label="B-roll notes" className="md:col-span-2">
              <Textarea value={scene.b_roll_notes} onChange={(event) => updateScene(scene.id, { b_roll_notes: event.target.value })} />
            </Field>
          </>
        ) : (
          <>
            <ReadonlyNote label="Stock query" value={scene.stock_search_query} />
            <ReadonlyNote label="Text overlay" value={scene.text_overlay || "None"} />
            <ReadonlyNote label="B-roll notes" value={scene.b_roll_notes} className="md:col-span-2" />
          </>
        )}
      </div>
    </Card>
  );
}

function ReadonlyNote({ label, value, className }) {
  return (
    <div className={cn("rounded-lg border border-white/[0.08] bg-white/[0.035] p-4", className)}>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{value}</p>
    </div>
  );
}

function addScene(project, updateProject) {
  const last = project.script[project.script.length - 1];
  const scene = {
    id: `scene_${Date.now()}`,
    scene: project.script.length + 1,
    section: "New scene",
    narration: "",
    duration_seconds: last?.duration_seconds || 20,
    visual_direction: "Add visual direction for this scene.",
    stock_search_query: project.settings.topic || "stock footage",
    b_roll_notes: "Add shot type, pacing, and mood notes.",
    text_overlay: "",
    search_query_override: "",
    selectedFootage: null
  };
  updateProject((current) => ({ script: [...current.script, scene] }));
}
