export const formatTime = (dur) => {
    const m = String(Math.floor(dur /60));
    const s = String(Math.floor(dur % 60)).padStart(2, '0');
    return `${m}:${s}`;
}
export const formatPlays = (plays) => {
    return Number.isFinite(plays) && plays > 0 ? (plays / 1000000).toFixed(1) + 'M' : '—';
}
export const markPlaying = (chartList) => {
    chartList.querySelectorAll(".chart-row").forEach((row, i) => {
        row.querySelector(".rank").textContent = String(i + 1).padStart(2, '0');
    });
    const playing = chartList.querySelector(".chart-row.is-playing");
    if (!playing) return;
    playing.querySelector(".rank").innerHTML =
        `<span class="chart-bar"><span class="bar"></span><span class="bar"></span><span class="bar"></span></span>`;
};
export const setFav = (btn, on) => {
    btn.setAttribute("aria-pressed", on);
    btn.setAttribute("aria-label", on ? "Remove from favorites" : "Add to favorites");
};
 
