const toTrackId = (id) => Number.isInteger(id) ? `local-${id}` : String(id || "");
let saved = [];
try {
    saved = JSON.parse(localStorage.getItem("favorites") || "[]");
} catch (error) {
    console.warn("Could not load favorites from local storage.", error);
}
export const favorites = new Set(Array.isArray(saved) ? saved.map(toTrackId).filter(Boolean) : []);
export const saveFavorites = () => {
    try {
        localStorage.setItem("favorites", JSON.stringify([...favorites]));
    } catch (error) {
        console.warn("Could not save favorites to local storage.", error);
    }
};
let storedTracks = [];
try {
    storedTracks = JSON.parse(localStorage.getItem("saved-tracks") || "[]");
} catch (error) {
    console.warn("Could not load saved track details.", error);
}
export const savedTracks = new Map(Array.isArray(storedTracks)
    ? storedTracks.filter(t => t && t.id && typeof t.title === "string" && typeof t.artist === "string").map(t => {
        const normalized = {...t, id: toTrackId(t.id)};
        return [normalized.id, normalized];
    })
    : []);
export const saveTrack = (track) => {
    if (!track?.id) return;
    const normalized = {...track, id: toTrackId(track.id)};
    savedTracks.set(normalized.id, normalized);
    try {
        localStorage.setItem("saved-tracks", JSON.stringify([...savedTracks.values()]));
    } catch (error) {
        console.warn("Could not save track details.", error);
    }
};
export const getTrack = (id) => tracks.find(t => t.id === toTrackId(id)) || savedTracks.get(toTrackId(id));
export const tracks = [
    { id: 'local-1',  title: 'Glass Hours',      artist: 'Nova Lane',       genre: 'Electronic', plays: 4800000, duration: 215 },
    { id: 'local-2',  title: 'Night Ledger',     artist: 'Marcus Vale',     genre: 'Hip Hop',    plays: 4300000, duration: 192 },
    { id: 'local-3',  title: 'Blue Static',      artist: 'The Hollow Keys', genre: 'Jazz',       plays: 3900000, duration: 248 },
    { id: 'local-4',  title: 'Paper Lanterns',   artist: 'Wren & Willow',   genre: 'Indie',      plays: 3500000, duration: 201 },
    { id: 'local-5',  title: 'Dust Road',        artist: 'Clay Harmon',     genre: 'Country',    plays: 3100000, duration: 224 },
    { id: 'local-6',  title: 'Low Tide Drift',   artist: 'Aero Bloom',      genre: 'Ambient',    plays: 2800000, duration: 305 },
    { id: 'local-7',  title: 'Golden Hour Talk', artist: 'Ivy Monroe',      genre: 'Soul',       plays: 2500000, duration: 233 },
    { id: 'local-8',  title: 'Neon Pulse',       artist: 'Kite Circuit',    genre: 'Electronic', plays: 2200000, duration: 187 },
    { id: 'local-9',  title: 'Concrete Poems',   artist: 'Dre Alvarez',     genre: 'Hip Hop',    plays: 1900000, duration: 176 },
    { id: 'local-10', title: 'Slow Orbit',       artist: 'Luna Marsh',      genre: 'Ambient',    plays: 1600000, duration: 290 }
];
export const playlists = [
    { id: 'late-night',     name: 'Late Night',     desc: 'Jazz, ambient and soul for after dark', ids: ['local-3', 'local-6', 'local-10', 'local-7'] },
    { id: 'morning-drive',  name: 'Morning Drive',  desc: 'Indie, country and soul on the road',    ids: ['local-4', 'local-5', 'local-7'] },
    { id: 'focus',          name: 'Focus',          desc: 'Ambient and electronic, no distractions', ids: ['local-6', 'local-10', 'local-1', 'local-8'] },
    { id: 'heavy-rotation', name: 'Heavy Rotation', desc: 'The most played tracks right now',        ids: ['local-1', 'local-2', 'local-3', 'local-4'] }
];
let userPlaylists = [];
try {
    userPlaylists = JSON.parse(localStorage.getItem("user-playlists") || "[]");
} catch (error) {
    console.warn("Could not load playlists.", error);
}
export const customPlaylists = Array.isArray(userPlaylists) ? userPlaylists.filter(p => p && p.id && p.name && Array.isArray(p.ids)).map(p => ({...p, ids: p.ids.map(toTrackId).filter(Boolean)})) : [];
let savedPlaylistTracks = {};
try {
    savedPlaylistTracks = JSON.parse(localStorage.getItem("playlist-tracks") || "{}");
} catch (error) {
    console.warn("Could not load playlist tracks.", error);
}
if (!savedPlaylistTracks || typeof savedPlaylistTracks !== "object" || Array.isArray(savedPlaylistTracks)) savedPlaylistTracks = {};
for (const playlist of [...playlists, ...customPlaylists]) {
    if (Array.isArray(savedPlaylistTracks[playlist.id])) playlist.ids = savedPlaylistTracks[playlist.id].map(toTrackId).filter(Boolean);
}
export const savePlaylists = () => {
    try {
        localStorage.setItem("user-playlists", JSON.stringify(customPlaylists));
        localStorage.setItem("playlist-tracks", JSON.stringify(Object.fromEntries([...playlists, ...customPlaylists].map(p => [p.id, p.ids]))));
    } catch (error) {
        console.warn("Could not save playlists.", error);
    }
};

// Persist normalized string IDs after reading data created by earlier releases.
saveFavorites();
savePlaylists();
 
