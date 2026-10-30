# Backend setup for WayAnime

The `backend/` directory is a separate Node.js service for Render. Follow `backend/README.md` to deploy it.

The static frontend can stay on GitHub Pages. Once Render gives you a service URL, use that URL as `BACKEND_URL` in any frontend feature that calls the backend. Do not put private API keys or secrets in the GitHub Pages frontend.
