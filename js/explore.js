import "./layout.js";
import { askName } from "./dialog.js";
import { searchTracks } from "./api.js";
import { favorites, saveFavorites, saveTrack, playlists as featuredPlaylists, customPlaylists, savePlaylists } from "./data.js";
import { playTrack, initPlayer, restorePlayer, currentId, setPlaying, isPlaying } from "./player.js";
 
const searchInput = document.getElementById("search-bar");
const resultsList = document.getElementById("search-results");
const status = document.getElementById("search-status");
const allPlaylists = [...featuredPlaylists, ...customPlaylists];

const favoriteIcon =
  `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z" />
  </svg>`;

let visibleTracks = [];
let debounceTimer;
let activeRequest;
const searchCacheKey = "explore-search";
 
const formatDuration = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
 
function showStatus(message, state = "") {
  status.textContent = message;
  status.dataset.state = state;
  status.hidden = false;
}
 
function updatePreviewControls() {
  resultsList.querySelectorAll(".search-result").forEach((row) => {
    const track = visibleTracks.find((item) => item.id === row.dataset.id);
    const button = row.querySelector(".preview-btn");
    if (!track || !button) return;
    const active = track.id === currentId && isPlaying;
    button.textContent = active ? "❚❚ Pause" : "▶ Preview";
    button.setAttribute("aria-label", `${active ? "Pause" : "Play"} preview of ${track.title} by ${track.artist}`);
  });
}
 
function renderResults(tracks) {
  visibleTracks = tracks;
  resultsList.replaceChildren();
  if (!tracks.length) {
    showStatus("No tracks found. Try another song or artist.", "empty");
    return;
  }
 
  tracks.forEach((track, index) => {
    const row = document.createElement("li");
    row.className = "search-result";
    row.dataset.id = track.id;
    const cover = document.createElement("img");
    cover.className = "cover";
    cover.alt = "";
    cover.loading = "lazy";
    if (track.artwork) cover.src = track.artwork;
 
    const details = document.createElement("div");
    details.className = "search-result-info";
    const title = document.createElement("p");
    title.className = "song-title";
    title.textContent = track.title;
    const artist = document.createElement("p");
    artist.className = "song-artist";
    artist.textContent = `${track.artist} · ${track.album}`;
    details.append(title, artist);
 
    const duration = document.createElement("span");
    duration.className = "time";
    duration.textContent = track.duration ? formatDuration(track.duration) : "—";
    const actions = document.createElement("div");
    actions.className = "search-result-actions";
 
    if (track.previewUrl) {
      const play = document.createElement("button");
      play.type = "button";
      play.className = "preview-btn";
      play.textContent = "▶ Preview";
      play.setAttribute("aria-label", `Play preview of ${track.title} by ${track.artist}`);
      play.addEventListener("click", () => playPreview(track.previewUrl));
      actions.append(play);
    } else {
      const unavailable = document.createElement("span");
      unavailable.className = "preview-unavailable";
      unavailable.textContent = "No preview";
      actions.append(unavailable);
    }
 
    if (track.storeUrl) {
      const store = document.createElement("a");
      store.href = track.storeUrl;
      store.target = "_blank";
      store.rel = "noreferrer";
      store.textContent = "Open ↗";
      store.setAttribute("aria-label", `Open ${track.title} in Apple Music`);
      actions.append(store);
    }
 
    const favorite = document.createElement("button");
    favorite.type = "button";
    favorite.className = "fav-btn";
    favorite.setAttribute("aria-pressed", String(favorites.has(track.id)));
    favorite.setAttribute("aria-label", favorites.has(track.id) ? "Remove from favorites" : "Add to favorites");
    favorite.innerHTML = favoriteIcon;
    favorite.addEventListener("click", () => {
      if (favorites.has(track.id)) favorites.delete(track.id);
      else { favorites.add(track.id); saveTrack(track); }
      saveFavorites();
      const active = favorites.has(track.id);
      favorite.setAttribute("aria-pressed", String(active));
      favorite.setAttribute("aria-label", active ? "Remove from favorites" : "Add to favorites");
    });
    actions.append(favorite);
 
    const playlistSelect = document.createElement("select");
    playlistSelect.className = "playlist-select";
    playlistSelect.setAttribute("aria-label", `Add ${track.title} to a playlist`);
    const prompt = document.createElement("option");
    prompt.value = "";
    prompt.textContent = "+ Playlist";
    playlistSelect.append(prompt);
    allPlaylists.forEach((playlist) => {
      const option = document.createElement("option");
      option.value = playlist.id;
      option.textContent = playlist.name;
      playlistSelect.append(option);
    });
    const createOption = document.createElement("option");
    createOption.value = "__create__";
    createOption.textContent = "Create playlist…";
    playlistSelect.append(createOption);
    playlistSelect.addEventListener("change", async() => {
      let playlist = allPlaylists.find((item) => item.id === playlistSelect.value);
      if (playlistSelect.value === "__create__") {
        const name = await askName({title: "Create playlist", submitLabel: "Create", validate: (n) => allPlaylists.some(p => p.name.toLowerCase() === n.toLowerCase()) ? "A playlist with that name already exists." : ""});
        if (name) {
          playlist = { id: `custom-${Date.now()}`, name, desc: "Your playlist", ids: [] };
          customPlaylists.push(playlist);
          allPlaylists.push(playlist);
          savePlaylists();
        }
      }
      if (playlist && !playlist.ids.includes(track.id)) {
        saveTrack(track);
        playlist.ids.push(track.id);
        savePlaylists();
        showStatus(`Added ${track.title} to ${playlist.name}.`, "success");
      } else if (playlist) {
        showStatus(`${track.title} is already in ${playlist.name}.`, "empty");
      }
      playlistSelect.value = "";
      if (playlist) renderResults(visibleTracks);
    });
    actions.append(playlistSelect);
 
    row.setAttribute("aria-posinset", String(index + 1));
    row.append(cover, details, duration, actions);
    resultsList.append(row);
  });
  if (!status.dataset.state || status.dataset.state === "loading") status.hidden = true;
  updatePreviewControls();
}
 
function playPreview(url) {
  const track = visibleTracks.find((item) => item.previewUrl === url);
  if (!track) return;
  if (track.id === currentId) setPlaying(!isPlaying);
  else playTrack(track);
  updatePreviewControls();
}
 
async function runSearch(query) {
  activeRequest?.abort();
  const controller = new AbortController();
  activeRequest = controller;
  showStatus("Searching the music catalog…", "loading");
  resultsList.replaceChildren();
  try {
    const tracks = await searchTracks(query, { signal: controller.signal });
    if (activeRequest === controller) {
      sessionStorage.setItem(searchCacheKey, JSON.stringify({query, tracks}));
      renderResults(tracks);
    }
  } catch (error) {
    if (error.name === "AbortError") return;
    showStatus("Could not search the music catalog. Check your connection and try again.", "error");
  }
}
 
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const query = searchInput.value.trim();
  activeRequest?.abort();
  if (query.length < 2) {
    resultsList.replaceChildren();
    showStatus("Enter at least 2 characters to search.");
    return;
  }
  debounceTimer = setTimeout(() => runSearch(query), 350);
});
 
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();
    if (query.length >= 2) runSearch(query);
  }
});
 
initPlayer({
  getIds: () => visibleTracks.filter((track) => track.previewUrl),
  onChange: (id) => {
    resultsList.querySelectorAll(".search-result").forEach((row) => {
      const isCurrent = row.dataset.id === String(id);
      row.classList.toggle("is-playing", isCurrent);
    });
    updatePreviewControls();
  },
  onState: (playing, id) => {
    updatePreviewControls();
  },
});
resultsList.addEventListener("click", (event) => {
  const row = event.target.closest(".search-result");
  if (!row || event.target.closest("button, a, select")) return;
  const track = visibleTracks.find((item) => item.id === row.dataset.id);
  if (!track) return;
  if (!track.previewUrl) {
    showStatus("This track has no preview. Open it in Apple Music to listen.", "empty");
    return;
  }
  if (track.id === currentId) setPlaying(!isPlaying);
  else playTrack(track);
});
try {
  const cached = JSON.parse(sessionStorage.getItem(searchCacheKey) || "null");
  if (cached?.query && Array.isArray(cached.tracks)) {
    searchInput.value = cached.query;
    renderResults(cached.tracks);
  }
} catch {
  // Ignore unavailable or malformed search cache.
}
restorePlayer();
 
