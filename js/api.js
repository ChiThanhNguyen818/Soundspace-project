const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";
 
export async function searchTracks(term, { signal, country = "VN", limit = 25 } = {}) {
  const url = new URL(ITUNES_SEARCH_URL);
  url.searchParams.set("term", term);
  url.searchParams.set("entity", "song");
  url.searchParams.set("country", country);
  url.searchParams.set("limit", String(limit));
 
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Music search is temporarily unavailable.");
 
  const data = await response.json();
  return (Array.isArray(data.results) ? data.results : [])
    .filter((item) => item.trackId && item.trackName && item.artistName)
    .map((item) => ({
      id: `itunes-${item.trackId}`,
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName || "Single",
      artwork: item.artworkUrl100?.replace("100x100", "300x300") || "",
      previewUrl: item.previewUrl || "",
      storeUrl: item.trackViewUrl || "",
      duration: Number.isFinite(item.trackTimeMillis) ? Math.round(item.trackTimeMillis / 1000) : 0,
      genre: item.primaryGenreName || "Music",
      plays: 0,
    }));
}
 

