const PER_PAGE = 4;

export function hasFootageApiKeys() {
  return Boolean(getPexelsKey() || getPixabayKey());
}

export async function searchStockFootage(query, page = 1) {
  const cleaned = cleanQuery(query);
  if (!cleaned) {
    return { results: [], queryUsed: cleaned, message: "No results - try a custom search" };
  }

  const pexelsKey = getPexelsKey();
  const pixabayKey = getPixabayKey();
  const simplified = simplifyKeyword(cleaned);
  let lastError = null;

  if (!pexelsKey && !pixabayKey) {
    throw Object.assign(new Error("Add PEXELS_API_KEY or PIXABAY_API_KEY on the server."), { status: 500 });
  }

  if (pexelsKey) {
    try {
      const pexelsResults = await fetchPexelsVideos(cleaned, page, pexelsKey);
      if (pexelsResults.length) {
        return { results: pexelsResults, queryUsed: cleaned, provider: "Pexels" };
      }

      if (simplified !== cleaned) {
        const retryResults = await fetchPexelsVideos(simplified, page, pexelsKey);
        if (retryResults.length) {
          return { results: retryResults, queryUsed: simplified, provider: "Pexels", simplified: true };
        }
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (pixabayKey) {
    try {
      const pixabayResults = await fetchPixabayVideos(cleaned, page, pixabayKey);
      if (pixabayResults.length) {
        return { results: pixabayResults, queryUsed: cleaned, provider: "Pixabay", fallback: true };
      }

      if (simplified !== cleaned) {
        const retryResults = await fetchPixabayVideos(simplified, page, pixabayKey);
        if (retryResults.length) {
          return {
            results: retryResults,
            queryUsed: simplified,
            provider: "Pixabay",
            fallback: true,
            simplified: true
          };
        }
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError && !pixabayKey) {
    throw lastError;
  }

  return { results: [], queryUsed: cleaned, message: "No results - try a custom search" };
}

async function fetchPexelsVideos(query, page, apiKey) {
  const url = new URL("https://api.pexels.com/videos/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(PER_PAGE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("orientation", "landscape");

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Pexels failed with status ${response.status}.`);
  }

  const payload = await response.json();
  return (payload.videos || []).map((video) => normalizePexelsVideo(video, query)).filter(Boolean);
}

async function fetchPixabayVideos(query, page, apiKey) {
  const url = new URL("https://pixabay.com/api/videos/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("per_page", String(PER_PAGE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("video_type", "film");
  url.searchParams.set("safesearch", "true");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Pixabay failed with status ${response.status}.`);
  }

  const payload = await response.json();
  return (payload.hits || []).map((video) => normalizePixabayVideo(video, query)).filter(Boolean);
}

function normalizePexelsVideo(video, query) {
  const file = (video.video_files || [])
    .filter((item) => item.file_type === "video/mp4" && item.link)
    .sort((a, b) => (b.width || 0) - (a.width || 0))[0];

  if (!file?.link) return null;

  return {
    id: `pexels-${video.id}-${file.id || file.width || "file"}`,
    provider: "Pexels",
    title: video.user?.name ? `${query} by ${video.user.name}` : query,
    duration: Number(video.duration) || 0,
    thumbnail: video.image || video.video_pictures?.[0]?.picture || "",
    pageUrl: video.url,
    downloadUrl: file.link,
    author: video.user?.name || "Pexels contributor",
    width: file.width || video.width,
    height: file.height || video.height,
    searchQuery: query
  };
}

function normalizePixabayVideo(video, query) {
  const rendition =
    video.videos?.large || video.videos?.medium || video.videos?.small || video.videos?.tiny;

  if (!rendition?.url) return null;

  return {
    id: `pixabay-${video.id}-${rendition.width || "file"}`,
    provider: "Pixabay",
    title: video.tags || query,
    duration: Number(video.duration) || 0,
    thumbnail:
      rendition.thumbnail ||
      video.videos?.medium?.thumbnail ||
      video.videos?.small?.thumbnail ||
      video.videos?.tiny?.thumbnail ||
      "",
    pageUrl: video.pageURL,
    downloadUrl: rendition.url,
    author: video.user || "Pixabay contributor",
    width: rendition.width,
    height: rendition.height,
    searchQuery: query
  };
}

function cleanQuery(query) {
  return String(query || "")
    .replace(/\s+/g, " ")
    .trim();
}

function simplifyKeyword(query) {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "about",
    "into",
    "from",
    "your",
    "video",
    "youtube",
    "scene",
    "footage",
    "stock"
  ]);

  const simplified = cleanQuery(query)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 4)
    .join(" ");

  return simplified || query;
}

function getPexelsKey() {
  return process.env.PEXELS_API_KEY;
}

function getPixabayKey() {
  return process.env.PIXABAY_API_KEY;
}
