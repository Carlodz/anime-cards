# Wayanime – anime watch version

- Login / look unchanged. Cards pages (Library, Store, Trade, Packs) removed from the menu.
- New: Home rows, Anime (browse + genres), Schedule, My list, Search (Enter in top bar), anime page, player.
- Metadata: AniList (no key needed). Server: `anime-routes.js` (mounted in server.js).
- Videos: fetched automatically from anime4up (see below). No admin link panel.
  .m3u8 and .mp4/.webm play in the built-in player (hls.js), other links open as an embed.
- Data is saved in the same store as users (Postgres kv or data/users.json) under `anime`.

## Auto episodes (anime4up)
Each anime page now also fetches episodes (sub + dubbed) from anime4up on the server (`a4u-source.js`), matched by title. Matches are cached in the store (`anime.map`).
- Domain changed? Set env `A4U_HOSTS="https://new-domain/,https://other/"` (comma separated) or edit `DEFAULT_HOSTS`.
- Disable: env `AUTO_EPS=off`.
- Sources open as embeds (Uqload, Mixdrop, …) inside the player.
