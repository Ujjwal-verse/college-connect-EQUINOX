# Frontend

The user interface is implemented in the root Next.js App Router project. Main files:

- `app/page.tsx` — login, role dashboards, report feed, status views, and navigation.
- `app/components/` — student landing, emergency camera, report form, community and official committee views, event details, profile, and shared UI.
- `app/globals.css` and `app/campus-redesign.css` — responsive visual system and role-specific layouts.
- `public/` — campus photos, illustrations, and static assets.

Run the frontend from the repository root with `npm run dev` (or the package-manager command documented in the root README). UI calls same-origin `/api/*` routes; no Gemini key belongs in browser code.
