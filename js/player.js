import {getTrack} from './data.js';

let hooks = {getIds: () => [], onChange: () => {}, onState: () => {}};

export const initPlayer = (h) => {
    hooks = {...hooks, ...h};
};

const chartList = document.getElementById("chart-list");
const playerTitle = document.querySelector("#player .song-title");
const playerArtist = document.querySelector("#player .song-artist");
const playBtn = document.getElementById("play-btn");
const nextBtn = document.getElementById("next-btn");
const previousBtn = document.getElementById("previous-btn");
const progress = document.getElementById("progress");
const progressBar = progress.querySelector("span");
const playerCover = document.querySelector("#player .cover");

export let currentId = null;
export let isPlaying = false;
let currentTime = 0;
let timer = null;
let canPersistState = true;
let audio = null;
let activeTrack = null;
let lastStateSave = 0;

const saveState = (force = false) => {
    if (!canPersistState) return;
    if (!force && Date.now() - lastStateSave < 1000) return;
    try {
        localStorage.setItem("player-state", JSON.stringify({currentId, currentTime, isPlaying, track: activeTrack}));
        lastStateSave = Date.now();
    } catch (error) {
        canPersistState = false;
        console.warn("Could not save player state to local storage.", error);
    }
};

const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 48 48" fill="currentColor">
    <polygon points="16,12 36,24 16,36" /></svg>`;
const pauseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 48 48" fill="currentColor">
    <rect x="14" y="12" width="7" height="24" />
    <rect x="27" y="12" width="7" height="24" /></svg>`;

export const playTrack = (trackOrId) => {
    const track = typeof trackOrId === "object" ? trackOrId : getTrack(trackOrId);
    if(!track) return;
    if (!track.previewUrl && !String(track.id).startsWith("local-")) return;
    activeTrack = track;
    currentId = track.id;
    currentTime = 0;
    if (track.previewUrl) {
        if (!audio) {
            audio = new Audio();
            const playerAudio = audio;
            playerAudio.addEventListener("timeupdate", () => {
                if (audio !== playerAudio) return;
                currentTime = playerAudio.currentTime;
                updateProgress();
                saveState();
            });
            playerAudio.addEventListener("ended", () => { if (audio === playerAudio) setPlaying(false); });
            playerAudio.addEventListener("error", () => { if (audio === playerAudio) setPlaying(false); });
        }
        audio.src = track.previewUrl;
        audio.currentTime = 0;
    } else {
        audio?.pause();
        audio = null;
    }
    saveState(true);
    updateProgress();
    playerTitle.textContent = track.title;
    playerArtist.textContent = track.previewUrl ? track.artist : `${track.artist} · Demo (no audio)`;
    if (playerCover) playerCover.style.backgroundImage = track.artwork ? `url("${track.artwork}")` : "";
    hooks.onChange(currentId);
    setPlaying(true);
}
// Toggle pause or play button
export const setPlaying = (state) => {
    isPlaying = state;
    playBtn.innerHTML = state ? pauseIcon : playIcon;
    playBtn.setAttribute("aria-label", state ? "Pause" : "Play");
    chartList?.classList.toggle("is-paused", !state);
    hooks.onState(isPlaying, currentId);
    saveState(true);
    if (audio) {
        stopTimer();
        if (state) audio.play().catch(() => setPlaying(false));
        else audio.pause();
    } else {
        state ? startTimer() : stopTimer();
    }
};
export const restorePlayer = () => {
    try {
        const saved = JSON.parse(localStorage.getItem("player-state") || "null");
        if (!saved) return;
        if ((typeof saved.currentId !== "string" && !Number.isInteger(saved.currentId)) || !Number.isFinite(saved.currentTime)) {
            console.warn("Ignoring invalid saved player state.");
            return;
        }
        const track = getTrack(saved.currentId) || saved.track;
        if (!track) {
            console.warn("Ignoring saved player state for an unknown track.");
            return;
        }
        currentId = track.id;
        activeTrack = track;
        currentTime = Math.max(0, Math.min(track.duration, saved.currentTime));
        if (track.previewUrl) {
            audio = new Audio(track.previewUrl);
            audio.currentTime = currentTime;
            const playerAudio = audio;
            playerAudio.addEventListener("timeupdate", () => {
                if (audio !== playerAudio) return;
                currentTime = playerAudio.currentTime;
                updateProgress();
                saveState();
            });
            playerAudio.addEventListener("ended", () => { if (audio === playerAudio) setPlaying(false); });
            playerAudio.addEventListener("error", () => { if (audio === playerAudio) setPlaying(false); });
        }
        playerTitle.textContent = track.title;
        playerArtist.textContent = track.previewUrl ? track.artist : `${track.artist} · Demo (no audio)`;
        if (playerCover) playerCover.style.backgroundImage = track.artwork ? `url("${track.artwork}")` : "";
        updateProgress();
        hooks.onChange(currentId);
        setPlaying(saved.isPlaying === true);
    } catch (error) {
        console.warn("Could not restore player state from local storage.", error);
    }
};
const skip = (step) => {
    const ids = hooks.getIds();
    if(!ids.length) return;
    const i = ids.findIndex(item => (typeof item === "object" ? item.id : item) === currentId);
    const next = i === -1 ? (step > 0 ? 0 : ids.length - 1) : (i + step + ids.length) % ids.length;
    playTrack(ids[next]);
};
const updateProgress = () => {
    const track = activeTrack || getTrack(currentId);
    const duration = audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : (track?.duration || 0);
    const percentage = duration ? Math.min(100, (currentTime / duration) * 100) : 0;
    progressBar.style.width = percentage + '%';
    progress.setAttribute('aria-valuenow', Math.round(percentage));
    progress.setAttribute('aria-valuetext', duration ? `${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')} / ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}` : '0:00');
};
const stopTimer = () => {
    clearInterval(timer);
    timer = null;
};
const startTimer = () => {
    stopTimer();
    timer = setInterval(() => {
        const track = activeTrack || getTrack(currentId);
        if(!track) return stopTimer();
        currentTime++;
        const duration = audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : track.duration;
        if(currentTime >= duration) {
            skip(1);
            return;
        }
        updateProgress();
        saveState();
    }, 1000);
};

nextBtn.addEventListener("click", () => skip(1));
previousBtn.addEventListener("click", () => skip(-1));
playBtn.addEventListener("click", () => {
    if(currentId === null) {
        const ids = hooks.getIds();
        if(ids.length) playTrack(ids[0]);
        return;
    }
    setPlaying(!isPlaying);
});
progress.addEventListener("click", (e) => {
    const track = activeTrack || getTrack(currentId);
    if(!track) return;
    const rect = progress.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const duration = audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : track.duration;
    currentTime = Math.floor(ratio * duration);
    if (audio) audio.currentTime = currentTime;
    updateProgress();
    saveState();
});
progress.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const track = activeTrack || getTrack(currentId);
    if (!track) return;
    e.preventDefault();
    const duration = audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : track.duration;
    currentTime = Math.max(0, Math.min(duration, currentTime + (e.key === "ArrowRight" ? 5 : -5)));
    if (audio) audio.currentTime = currentTime;
    updateProgress();
    saveState();
});
updateProgress();
 
