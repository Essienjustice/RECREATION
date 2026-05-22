import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  ExternalLink,
  Film,
  Loader2,
  Play,
  RefreshCw,
  Search
} from "lucide-react";
import { useProjects } from "../context/ProjectContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { searchStockFootage } from "../lib/footage.js";
import { advanceStage, getProjectTitle, getSelectionStats } from "../lib/project.js";
import { cn, formatDuration } from "../lib/utils.js";
import { Badge, Button, Card, Input, ProgressBar, SkeletonBlock } from "../components/ui.jsx";

export function FootagePage() {
  const navigate = useNavigate();
  const { currentProject, updateProject } = useProjects();
  const { toast } = useToast();
  const { config } = useAuth();
  const [searchState, setSearchState] = useState({});
  const missingKeyToastShown = useRef(false);

  const stats = getSelectionStats(currentProject);
  const apiKeysReady = config?.services?.footage ?? true;

  useEffect(() => {
    const initial = {};
    currentProject.script.forEach((scene) => {
      initial[scene.id] = {
        query: getSceneQuery(scene, currentProject),
        page: 1,
        results: [],
        loading: false,
        error: "",
        message: ""
      };
    });
    setSearchState(initial);
  }, [currentProject.id, currentProject.script.length]);

  useEffect(() => {
    if (!currentProject.script.length || !apiKeysReady) {
      if (!apiKeysReady && currentProject.script.length && !missingKeyToastShown.current) {
        missingKeyToastShown.current = true;
        toast({
          title: "Stock API keys missing",
          description: "Add Pexels or Pixabay keys to load live footage results.",
          tone: "warning"
        });
      }
      return;
    }

    currentProject.script.forEach((scene) => {
      const state = searchState[scene.id];
      if (state && !state.loading && !state.results.length && !state.error && !state.message) {
        loadResults(scene.id, state.query, 1);
      }
    });
  }, [currentProject.script, apiKeysReady, searchState]);

  async function loadResults(sceneId, query, page = 1) {
    setSearchState((state) => ({
      ...state,
      [sceneId]: {
        ...(state[sceneId] || {}),
        query,
        page,
        loading: true,
        error: "",
        message: ""
      }
    }));

    try {
      const response = await searchStockFootage(query, page);
      setSearchState((state) => ({
        ...state,
        [sceneId]: {
          ...(state[sceneId] || {}),
          query: response.queryUsed || query,
          page,
          results: response.results,
          loading: false,
          error: "",
          message: response.message || ""
        }
      }));

      if (response.simplified) {
        toast({
          title: "Search simplified",
          description: `Loaded results for "${response.queryUsed}".`,
          tone: "info"
        });
      }
    } catch (error) {
      setSearchState((state) => ({
        ...state,
        [sceneId]: {
          ...(state[sceneId] || {}),
          loading: false,
          error: error.message || "Footage search failed.",
          results: []
        }
      }));
      toast({
        title: "Footage search failed",
        description: error.message || "Try a custom search term.",
        tone: "warning"
      });
    }
  }

  function updateQuery(sceneId, query) {
    setSearchState((state) => ({
      ...state,
      [sceneId]: {
        ...(state[sceneId] || {}),
        query
      }
    }));
  }

  function runCustomSearch(scene) {
    const query = searchState[scene.id]?.query || getSceneQuery(scene, currentProject);
    updateProject((project) => ({
      script: project.script.map((item) =>
        item.id === scene.id ? { ...item, search_query_override: query } : item
      ),
      stageReached: advanceStage(project, "footage")
    }));
    loadResults(scene.id, query, 1);
  }

  function swapResults(scene) {
    const state = searchState[scene.id];
    const nextPage = (state?.page || 1) + 1;
    loadResults(scene.id, state?.query || getSceneQuery(scene, currentProject), nextPage);
  }

  function selectFootage(scene, footage) {
    updateProject((project) => {
      const nextScript = project.script.map((item) =>
        item.id === scene.id
          ? {
              ...item,
              selectedFootage: {
                ...footage,
                selectedAt: new Date().toISOString(),
                searchQuery: searchState[scene.id]?.query || footage.searchQuery
              }
            }
          : item
      );
      const allSelected = nextScript.length > 0 && nextScript.every((item) => item.selectedFootage?.downloadUrl);
      return {
        script: nextScript,
        stageReached: allSelected ? "export" : advanceStage(project, "footage")
      };
    });
  }

  function handleExport() {
    if (!stats.allSelected) return;
    updateProject({ stageReached: "export" });
    navigate("/export");
  }

  if (!currentProject.script.length) {
    return (
      <Card className="p-8">
        <Badge tone="blue">Stage 2</Badge>
        <h1 className="mt-4 text-2xl font-extrabold text-white">No script scenes yet</h1>
        <p className="mt-2 text-sm text-slate-400">Generate or manually write a script before searching stock footage.</p>
        <Button type="button" className="mt-6" onClick={() => navigate("/write")}>
          Go to Script Writer
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Badge tone="violet">Stage 2</Badge>
            <h1 className="mt-4 text-2xl font-extrabold text-white">Footage Finder</h1>
            <p className="mt-2 text-sm text-slate-400">
              Match every scene with horizontal stock footage from Pexels or Pixabay.
            </p>
          </div>
          {!apiKeysReady ? (
            <Badge tone="amber">Add API keys to search live footage</Badge>
          ) : null}
        </div>

        {currentProject.script.map((scene) => (
          <FootageSceneCard
            key={scene.id}
            scene={scene}
            state={searchState[scene.id]}
            apiKeysReady={apiKeysReady}
            onQueryChange={(query) => updateQuery(scene.id, query)}
            onSearch={() => runCustomSearch(scene)}
            onSwap={() => swapResults(scene)}
            onSelect={(footage) => selectFootage(scene, footage)}
          />
        ))}
      </div>

      <aside className="h-fit lg:sticky lg:top-32">
        <Card className="p-5">
          <Badge tone="green">Project progress</Badge>
          <h2 className="mt-3 text-lg font-extrabold text-white">{getProjectTitle(currentProject)}</h2>
          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-400">Footage selected</span>
                <span className="font-semibold text-white">
                  {stats.selected} of {stats.total}
                </span>
              </div>
              <ProgressBar value={stats.total ? (stats.selected / stats.total) * 100 : 0} />
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock3 className="h-4 w-4" />
                Total estimated duration
              </div>
              <p className="mt-2 text-2xl font-extrabold text-white">{formatDuration(stats.totalSeconds)}</p>
            </div>
            <Button type="button" className="w-full" size="lg" onClick={handleExport} disabled={!stats.allSelected}>
              Export Project
              <ArrowRight className="h-4 w-4" />
            </Button>
            {!stats.allSelected ? (
              <p className="text-xs leading-5 text-slate-500">Select footage for every scene to unlock the export package.</p>
            ) : null}
          </div>
        </Card>
      </aside>
    </div>
  );
}

function FootageSceneCard({ scene, state, apiKeysReady, onQueryChange, onSearch, onSwap, onSelect }) {
  const [narrationOpen, setNarrationOpen] = useState(false);
  const query = state?.query || scene.search_query_override || scene.stock_search_query;
  const selectedId = scene.selectedFootage?.id;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-white/[0.08] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="violet">Scene {scene.scene}</Badge>
              <Badge tone="blue">{scene.section}</Badge>
              <Badge>{scene.duration_seconds}s</Badge>
              {scene.selectedFootage ? <Badge tone="green">Selected</Badge> : null}
            </div>
            <p className="mt-3 text-sm text-slate-400">{scene.visual_direction}</p>
          </div>
          {scene.text_overlay ? <Badge tone="amber">{scene.text_overlay}</Badge> : null}
        </div>

        <button
          type="button"
          onClick={() => setNarrationOpen((value) => !value)}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
        >
          {narrationOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Narration
        </button>
        {narrationOpen ? (
          <p className="mt-3 rounded-lg border border-white/[0.08] bg-white/[0.035] p-4 text-sm leading-6 text-slate-300">
            {scene.narration || "No narration entered yet."}
          </p>
        ) : null}
      </div>

      <div className="p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="pl-10"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSearch();
              }}
              placeholder="Custom footage search"
            />
          </div>
          <Button type="button" variant="secondary" onClick={onSearch} disabled={!apiKeysReady || state?.loading}>
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button type="button" variant="secondary" onClick={onSwap} disabled={!apiKeysReady || state?.loading}>
            <RefreshCw className={cn("h-4 w-4", state?.loading && "animate-spin")} />
            Swap
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {state?.loading ? (
            Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
                <SkeletonBlock className="aspect-video w-full" />
                <SkeletonBlock className="mt-3 h-4 w-2/3" />
                <SkeletonBlock className="mt-2 h-9 w-full" />
              </div>
            ))
          ) : state?.results?.length ? (
            state.results.map((footage) => (
              <FootageResult
                key={footage.id}
                footage={footage}
                selected={selectedId === footage.id || scene.selectedFootage?.downloadUrl === footage.downloadUrl}
                onSelect={() => onSelect(footage)}
              />
            ))
          ) : (
            <div className="sm:col-span-2 rounded-lg border border-white/[0.08] bg-white/[0.035] p-5 text-sm text-slate-400">
              {state?.error || state?.message || (apiKeysReady ? "Loading stock results..." : "No API keys configured yet.")}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function FootageResult({ footage, selected, onSelect }) {
  return (
    <div
      className={cn(
        "group overflow-hidden rounded-lg border bg-[#0F0F18] transition",
        selected ? "border-emerald-400/70 shadow-glow" : "border-white/[0.08] hover:-translate-y-0.5 hover:border-white/20"
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-white/[0.04]">
        {footage.thumbnail ? (
          <img src={footage.thumbnail} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-slate-600">
            <Film className="h-10 w-10" />
          </div>
        )}
        <div className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/35">
          <Play className="h-9 w-9 rounded-full bg-black/60 p-2 text-white opacity-0 transition group-hover:opacity-100" />
        </div>
        <div className="absolute left-3 top-3">
          <Badge tone={footage.provider === "Pexels" ? "blue" : "green"}>{footage.provider}</Badge>
        </div>
        <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
          {footage.duration ? `${footage.duration}s` : "Video"}
        </div>
      </div>
      <div className="space-y-3 p-3">
        <p className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-200">{footage.title}</p>
        <div className="flex items-center justify-between gap-2">
          <a
            href={footage.pageUrl || footage.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-200"
          >
            Source
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <Button type="button" variant={selected ? "success" : "secondary"} size="sm" onClick={onSelect}>
            {selected ? <CheckCircle2 className="h-4 w-4" /> : null}
            {selected ? "Selected" : "Select"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getSceneQuery(scene, project) {
  return scene.search_query_override || scene.stock_search_query || project.settings.topic || "stock footage";
}
