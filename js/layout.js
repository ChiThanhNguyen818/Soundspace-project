const currentPage = document.body.dataset.page || "home";
const searchPlaceholder = document.body.dataset.searchPlaceholder || "Search tracks, artists, moods";
 
const homeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>`;
const libraryIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="16" rx="1"/><path d="m16.5 5.5 3.5-1 3 14.5-3.5 1z" transform="translate(-2 0)"/></svg>`;
const chartsIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><rect x="5.5" y="12" width="3" height="8" rx="0.5"/><rect x="10.5" y="6" width="3" height="14" rx="0.5"/><rect x="15.5" y="9" width="3" height="11" rx="0.5"/></svg>`;
const exploreIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>`;
 
const navItems = [
  ["home", "index.html", "home-btn", "Home", homeIcon],
  ["library", "library.html", "library-btn", "Library", libraryIcon],
  ["explore", "explore.html", "explore-btn", "Explore", exploreIcon],
];
 
const sidebar = document.getElementById("sidebar");
sidebar.innerHTML = `
  <div id="soundspace-logo" aria-label="Soundspace"><span></span><span></span></div>
  <nav id="menu" aria-label="Main navigation">
    ${navItems.map(([key, href, id, label, icon]) => `<a href="${href}" id="${id}" aria-label="${label}"${currentPage === key ? ' class="is-active" aria-current="page"' : ""}><span>${icon}</span><span>${label}</span></a>`).join("")}
  </nav>
  <section id="player" aria-label="Now playing">
    <div class="cover"></div>
    <p class="song-title">Nothing playing</p>
    <p class="song-artist">Pick a track</p>
    <div id="progress" role="slider" tabindex="0" aria-label="Playback position" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"><span></span></div>
    <div id="controls">
      <button type="button" id="previous-btn" aria-label="Previous"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 48 48" fill="currentColor"><polygon points="34,12 22,24 34,36"/><polygon points="22,12 10,24 22,36"/></svg></button>
      <button type="button" id="play-btn" aria-label="Play"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="currentColor"><polygon points="16,12 36,24 16,36"/></svg></button>
      <button type="button" id="next-btn" aria-label="Next"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 48 48" fill="currentColor"><polygon points="14,12 26,24 14,36"/><polygon points="26,12 38,24 26,36"/></svg></button>
    </div>
  </section>`;
 
const header = document.querySelector("#content > header");
header.innerHTML = `
  <div id="search">
    <label for="search-bar"><span id="search-logo" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span></label>
    <input type="search" id="search-bar" aria-label="Search" placeholder="${searchPlaceholder}" autocomplete="off" />
  </div>
  <a id="profile-btn" href="login.html" aria-label="Profile — sign in"><svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="3" fill="none"/><circle cx="24" cy="18" r="7" stroke="currentColor" stroke-width="3" fill="none"/><path d="M14 36c0-6 5-11 10-11s10 5 10 11" stroke="currentColor" stroke-width="3" fill="none"/></svg></a>`;
 
