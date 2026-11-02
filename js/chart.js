import "./layout.js";
import {tracks, favorites, saveFavorites} from './data.js';
import {formatTime, formatPlays, markPlaying, setFav} from './utils.js';
import {currentId, playTrack, isPlaying, setPlaying, initPlayer, restorePlayer} from './player.js';

const topics = document.getElementById("songs-topic");
export const chartList = document.getElementById("chart-list");
const rowTemplate = chartList.querySelector(".chart-row").cloneNode(true);
const searchBar = document.getElementById("search-bar");
const recommendList = document.getElementById("recommend-songs");
const cardTemplate = recommendList.querySelector(".song-card").cloneNode(true);

let activeGenre = 'All';
let currentList = null;

const selectActive = (el) => {
    el.addEventListener("click", (e) => {
        const button = e.target.closest("button")
        if(!button) return;
        el.querySelectorAll("button").forEach(btn => btn.classList.remove("is-active"));
        button.classList.add("is-active");
        if(el === topics) {
            activeGenre = button.textContent.trim();
            renderChart();
        }
    });
};
//Get ids for tracks in the chart
const getIds = () => {
    const [list, selector] = currentList === "recommendList" ? [recommendList, ".song-card"] : [chartList, ".chart-row"];
    return [...list.querySelectorAll(selector)].map(item => item.dataset.id);
};
const renderRecommend = () => {
    recommendList.innerHTML = "";
    const shuffle = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };
    shuffle(tracks).slice(0, 6).forEach(track => {
        const card = cardTemplate.cloneNode(true);
        card.dataset.id = track.id;
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.style.cursor = "pointer";
        card.querySelector(".song-title").textContent = track.title;
        card.querySelector(".song-artist").textContent = track.artist;
        recommendList.appendChild(card);
    });
};
const renderChart = () => {
    chartList.innerHTML = '';
    const searchValue = searchBar.value.trim().toLowerCase();
    const list = tracks.filter(t =>
        (activeGenre === 'All' || activeGenre === t.genre) && 
        (!searchValue || 
        [t.title, t.artist, t.genre].some(s => s.toLowerCase().includes(searchValue)))

    );
    if(!list.length) {
        const empty = document.createElement("li");
        empty.classList.add("empty");
        empty.textContent = "No tracks found";
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
        row.querySelector(".genre").textContent = track.genre;
        row.querySelector(".plays").textContent = formatPlays(track.plays);
        row.querySelector(".time").textContent = formatTime(track.duration);
        setFav(row.querySelector(".fav-btn"), favorites.has(track.id));
        chartList.appendChild(row);
    });
    markPlaying(chartList);
};
// Animation for favorite button
chartList.addEventListener("click", (e) => {
    const favBtn = e.target.closest(".fav-btn");
    if(!favBtn) return;
    const id = favBtn.closest(".chart-row").dataset.id;
    if(favorites.has(id)) {
        favorites.delete(id);
    }
    else {
        favorites.add(id);
    }
    saveFavorites();
    setFav(favBtn, favorites.has(id));
});
// Animation for chart row
chartList.addEventListener("click", (e) => {
    if(e.target.closest(".fav-btn")) return;
    const row = e.target.closest(".chart-row");
    if(!row) return;
    const id = row.dataset.id;
    currentList = "chartList";
    if(id === currentId) {
        setPlaying(!isPlaying);
    }
    else {
        playTrack(id);
    }
});
chartList.addEventListener("keydown", (e) => {
    const row = e.target.closest(".chart-row");
    if (!row || e.target !== row || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    row.click();
});
searchBar.addEventListener("input", renderChart);
recommendList.addEventListener("click", (e) => {
    const card = e.target.closest(".song-card");
    if(card) {
        currentList = "recommendList";
        playTrack(card.dataset.id);
    }
});
recommendList.addEventListener("keydown", (e) => {
    const card = e.target.closest(".song-card");
    if (!card || e.target !== card || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    card.click();
});
selectActive(topics);
renderChart();
renderRecommend();

initPlayer({ getIds, onChange: (id) => {
        chartList.querySelectorAll(".chart-row").forEach(row => {
            row.classList.toggle("is-playing", id === row.dataset.id);
        });
        markPlaying(chartList);
    }
});
restorePlayer();