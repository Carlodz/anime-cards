# Wayanime – anime watch version

- Login / look unchanged. Cards pages (Library, Store, Trade, Packs) removed from the menu.
- New: Home rows, Anime (browse + genres), Schedule, My list, Search (Enter in top bar), anime page, player.
- Metadata: AniList (no key needed). Server: `anime-routes.js` (mounted in server.js).
- Videos: owner/admin adds episode links on each anime page ("Staff · episode links"). Only https links.
  .m3u8 and .mp4/.webm play in the built-in player (hls.js), other links open as an embed.
- Data is saved in the same store as users (Postgres kv or data/users.json) under `anime`.
