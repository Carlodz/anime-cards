# WAYANIME

Node + Express site (desktop and mobile) with username/password login.

## Run locally
    npm install
    npm start        # http://localhost:3000

## Deploy (GitHub + Render)
1. Push this folder to a GitHub repo.
2. On render.com: New > Blueprint (or Web Service) > pick the repo.
3. Set DATABASE_URL (free Postgres from Neon or Supabase) so accounts and cards survive redeploys.
4. SESSION_SECRET is generated automatically by render.yaml.

GitHub Pages cannot run this project: it needs a Node server.

## Discord webhook (optional)
Set `DISCORD_WEBHOOK_URL` (Channel settings > Integrations > Webhooks) and every notification, DM, points gift, Aura card and announcement sent from the admin panel is also posted to that channel. The owner can also paste/remove the URL in the admin panel (Notifications tab).

## Steam on profiles (optional)
Players link Steam from Settings > Games > Link Steam (Steam OpenID, so nobody can claim someone else's account). Their most played games then show on their profile automatically, with a "Playing on Steam" badge while they play.
Needs: `BASE_URL` (your site address, e.g. https://yoursite.onrender.com) and `STEAM_API_KEY` (https://steamcommunity.com/dev/apikey) in your host's environment variables, never in the code. The player's Steam privacy must have Game details set to Public.
