# Server and configuration

The app runs as a Cloudflare Worker with the Vinext build pipeline.

- `worker/index.ts` — Worker entry point.
- `scripts/` and root configuration files — build, local runtime, and deployment setup.
- `server/GEMINI_CONFIG.example` — variable names and model placeholder for local configuration.

For local development, copy the example values to an ignored `.dev.vars` file and replace the key locally. For hosted deployment, add `GEMINI_API_KEY` as a secret and `GEMINI_MODEL=gemini-2.5-flash` as a runtime variable in the hosting provider, then redeploy. Never commit the actual API key or paste it into frontend code. The analysis endpoint uses Gemini only for emergency photos; it does not determine whether a scene is safe or contact emergency responders.
