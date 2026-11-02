# SoundSpace

SoundSpace is a front-end music discovery demo built with HTML, CSS and browser ES modules. It provides a local chart, iTunes catalog search, preview playback, favorites and playlists.

## Run locally

ES modules require a web server; opening the HTML files through `file://` will not work. Serve this directory with any static server, then open `index.html`.

For example, with Node.js installed:

```powershell
npx serve .
```

## Data and limitations

- Chart positions and play counts are demo data.
- Local chart tracks have no audio file; the player labels them as demos.
- Explore uses the iTunes Search API. Availability and previews vary by result and region.
- Favorites, playlists, profile display name and player state are stored in the browser's `localStorage`; Explore results are retained for the current tab session.
- Login stores only a display name locally. It is not account authentication and has no backend.

## Main files

- `index.html`, `explore.html`, `library.html`, `login.html`: pages
- `js/data.js`: catalog and local storage data
- `js/player.js`: shared player state and preview audio
- `js/explore.js`: catalog search and playlist actions
- `css/style.css`: design system and responsive layout
