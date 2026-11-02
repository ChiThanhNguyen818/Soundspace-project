import "./layout.js";
import {askName, askConfirm} from "./dialog.js";
import {tracks, favorites, saveFavorites, playlists, customPlaylists, savedTracks, savePlaylists} from './data.js';
import {formatTime, formatPlays, markPlaying, setFav} from './utils.js';
import {currentId, playTrack, isPlaying, setPlaying, initPlayer, restorePlayer} from './player.js';

const topics = document.getElementById("songs-topic");
const chartList = document.getElementById("chart-list");
const charts = document.getElementById("charts");
const grid = document.getElementById("library-grid");
const searchBar = document.getElementById("search-bar");
const rowTemplate = chartList.querySelector(".chart-row").cloneNode(true);
const allPlaylists = [...playlists, ...customPlaylists];
const catalogTracks = [...tracks, ...savedTracks.values()];
const newPlaylistBtn = document.getElementById("new-playlist-btn");
const getLibraryTracks = () => {
    const playlistTrackIds = new Set(allPlaylists.flatMap(playlist => playlist.ids));
    return [...new Map(catalogTracks.filter(track => favorites.has(track.id) || playlistTrackIds.has(track.id))
        .map(track => [track.id, track])).values()];
};

const ALL = 'all', FAVORITES = 'favorites', PLAYLISTS = 'playlists';
let view = ALL;
let activePlaylist = null;
const playlistHint = document.getElementById("playlist-hint");

const isTaken = (exceptId, name) => {
    return allPlaylists.some(pl => pl.id !== exceptId && pl.name.toLowerCase() === name.toLowerCase());
};
const nameError = (exceptId) => (name) => isTaken(exceptId, name) ? "A playlist with that name has already existed" : "";
const getIds = () => [...chartList.querySelectorAll(".chart-row")]
    .map(row => row.dataset.id)
    .filter(id => {
        const track = getLibraryTracks().find(item => item.id === id);
        return track && (track.previewUrl || id.startsWith("local-"));
    });
const getList = () => {
    const q = searchBar.value.trim().toLowerCase();
    let base = getLibraryTracks();
    if (view === PLAYLISTS) {
        const pl = allPlaylists.find(p => p.id === activePlaylist);
        const libraryTracks = getLibraryTracks();
        base = pl ? pl.ids.map(id => libraryTracks.find(t => t.id === id)).filter(Boolean) : [];
    }
    return base.filter(t =>
        (view !== FAVORITES || favorites.has(t.id)) &&
        (!q || [t.title, t.artist, t.genre || ""].some(s => s.toLowerCase().includes(q)))
    );
};
const formatTotal = (sec) => {
    const min = Math.round(sec / 60);
    return min >= 60 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m` : `${min} min`;
};
const renderStats = () => {
    const visibleTracks = getLibraryTracks();
    document.getElementById("stat-tracks").textContent = visibleTracks.length;
    document.getElementById("stat-favorites").textContent = visibleTracks.filter(track => favorites.has(track.id)).length;
    document.getElementById("stat-time").textContent =
        formatTotal(visibleTracks.reduce((sum, t) => sum + (t.duration || 0), 0));

    const source = visibleTracks.filter(t => favorites.has(t.id)).length ? visibleTracks.filter(t => favorites.has(t.id)) : visibleTracks;
    const counts = {};
    source.forEach(t => {
        counts[t.genre] = (counts[t.genre] || 0) + 1;
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    document.getElementById("stat-genre").textContent = top ? top[0] : "—";
};
const renderGrid = () => {
    grid.innerHTML = '';
    allPlaylists.forEach(pl => {
        const card = document.createElement("article");
        card.className = "song-card";
        card.dataset.playlist = pl.id;
        card.classList.toggle("is-active", pl.id === activePlaylist);
        const cover = document.createElement("div");
        cover.className = "cover";
        cover.setAttribute("aria-hidden", "true");
        const title = document.createElement("p");
        title.className = "song-title";
        title.textContent = pl.name;
        const description = document.createElement("p");
        description.className = "song-artist";
        description.textContent = `${pl.ids.length} tracks · ${pl.desc}`;
        const actions = document.createElement("div");
        actions.className = "playlist-card-actions";
        const open = document.createElement("button");
        open.type = "button";
        open.className = "playlist-open-btn";
        open.textContent = pl.id === activePlaylist ? "Close" : "Open";
        open.setAttribute("aria-label", `${pl.id === activePlaylist ? "Close" : "Open"} playlist ${pl.name}`);
        open.addEventListener("click", () => {
            activePlaylist = activePlaylist === pl.id ? null : pl.id;
            render();
        });
        actions.append(open);
        if (customPlaylists.includes(pl)) {
            const rename = document.createElement("button");
            rename.type = "button";
            rename.textContent = "Rename";
            rename.addEventListener("click", async() => {
                const name = await askName({title: "Rename playlist", submitLabel: "Save", value: pl.name, validate: nameError(pl.id)})
                if (name) { pl.name = name; savePlaylists(); renderGrid(); }
            });
            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "Delete";
            remove.setAttribute("aria-label", `Delete playlist ${pl.name}`);
            remove.addEventListener("click", async() => {
                const confirm = await askConfirm({title: "Delete playlist", message: `Delete ${pl.name}? This cannot be undone.`, confirmLabel: "Delete"});
                if(!confirm) return;
                customPlaylists.splice(customPlaylists.indexOf(pl), 1);
                allPlaylists.splice(allPlaylists.indexOf(pl), 1);
                if (activePlaylist === pl.id) activePlaylist = null;
                savePlaylists();
                render();
            });
            actions.append(rename, remove);
        }
        card.append(cover, title, description, actions);
        grid.appendChild(card);
    });
};
const render = () => {
    const isPlaylists = view === PLAYLISTS;
    const isCustomPlaylist = isPlaylists && customPlaylists.some(pl => pl.id === activePlaylist);
    document.getElementById("new-playlist-btn").hidden = !isPlaylists;
    grid.hidden = !isPlaylists;
    charts.hidden = isPlaylists && !activePlaylist;
    charts.classList.toggle("is-playlist-view", isCustomPlaylist);
    document.querySelector(".playlist-action-heading").hidden = !isCustomPlaylist;
    playlistHint.hidden = !(isPlaylists && !activePlaylist);
    if (isPlaylists) renderGrid();

    chartList.innerHTML = '';
    const list = getList();
    if (!list.length) {
        const empty = document.createElement("li");
        empty.classList.add("empty");
        empty.tabIndex = -1;
        empty.textContent = view === FAVORITES && !favorites.size
            ? "No favorites yet"
            : view === PLAYLISTS && activePlaylist
                ? "This playlist is empty. Add tracks from Explore."
                : "No tracks found";
        chartList.appendChild(empty);
        return;
    }
    list.forEach((track, index) => {
        const row = rowTemplate.cloneNode(true);
        row.dataset.id = track.id;
        row.setAttribute("tabindex", "0");
        row.setAttribute("aria-label", `Play ${track.title} by ${track.artist}`);
        row.classList.toggle("is-playing", track.id === currentId);
        row.querySelector(".rank").textContent = String(index + 1).padStart(2, '0');
        row.querySelector(".song-title").textContent = track.title;
        row.querySelector(".song-artist").textContent = track.artist;
        const cover = row.querySelector(".cover");
        if (track.artwork) cover.style.backgroundImage = `url("${track.artwork}")`;
        row.querySelector(".genre").textContent = track.genre;
        row.querySelector(".plays").textContent = formatPlays(track.plays);
        row.querySelector(".time").textContent = formatTime(track.duration || 0);
        setFav(row.querySelector(".fav-btn"), favorites.has(track.id));
        if (isPlaylists && customPlaylists.some(pl => pl.id === activePlaylist && pl.ids.includes(track.id))) {
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "remove-from-playlist-btn";
            remove.textContent = "−";
            remove.setAttribute("aria-label", `Remove ${track.title} from playlist`);
            row.append(remove);
        }
        chartList.appendChild(row);
    });
    markPlaying(chartList);
};
topics.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button?.dataset.view) return;
    topics.querySelectorAll("button").forEach(btn => btn.classList.remove("is-active"));
    button.classList.add("is-active");
    view = button.dataset.view;
    activePlaylist = null;
    render();
});
newPlaylistBtn.addEventListener("click", async() => {
    const name = await askName({title: "New playlist", submitLabel: "Create", vanlidate: nameError()});
    if(!name) return;
    const playlist = { id: `custom-${Date.now()}`, name, desc: "Your playlist", ids: [] };
    customPlaylists.push(playlist);
    allPlaylists.push(playlist);
    savePlaylists();
    activePlaylist = playlist.id;
    render();
});
chartList.addEventListener("click", (e) => {
    const removeBtn = e.target.closest(".remove-from-playlist-btn");
    if (removeBtn) {
        const playlist = customPlaylists.find(pl => pl.id === activePlaylist);
        const id = removeBtn.closest(".chart-row").dataset.id;
        if (playlist) {
            playlist.ids = playlist.ids.filter(trackId => trackId !== id);
            savePlaylists();
            render();
        }
        return;
    }
    const favBtn = e.target.closest(".fav-btn");
    if (favBtn) {
        const row = favBtn.closest(".chart-row");
        const previousRows = [...chartList.querySelectorAll(".chart-row")];
        const previousIndex = previousRows.indexOf(row);
        const id = favBtn.closest(".chart-row").dataset.id;
        if (favorites.has(id)) favorites.delete(id);
        else favorites.add(id);
        saveFavorites();
        renderStats();
        if (view === FAVORITES) {
            render();
            const nextRows = [...chartList.querySelectorAll(".chart-row")];
            (nextRows[previousIndex] || nextRows[nextRows.length - 1] || chartList.querySelector(".empty"))?.focus();
        } else {
            setFav(favBtn, favorites.has(id));
        }
        return;
    }
    const row = e.target.closest(".chart-row");
    if (!row) return;
    const id = row.dataset.id;
    if (id === currentId) setPlaying(!isPlaying);
    else playTrack(id);
});
chartList.addEventListener("keydown", (e) => {
    const row = e.target.closest(".chart-row");
    if (!row || e.target !== row || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    row.click();
});

searchBar.addEventListener("input", render);
renderStats();
render();

initPlayer({
    getIds,
    onChange: (id) => {
        chartList.querySelectorAll(".chart-row").forEach(row => {
            row.classList.toggle("is-playing", String(id) === row.dataset.id);
        });
        markPlaying(chartList);
    }
});
restorePlayer();
 
