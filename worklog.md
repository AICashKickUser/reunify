---
Task ID: 1
Agent: Main
Task: Fix dev server stability and app not creating case plans

Work Log:
- Investigated dev server crash/refresh loop reported by user
- Found that the dev server keeps dying after serving the page due to memory pressure
- The Next.js server uses ~1.5GB of memory during page compilation on a 3.9GB system
- Added `allowedDevOrigins: ["*.space-z.ai"]` to next.config.ts to allow cross-origin requests from preview panel
- Note: The `.space-z.ai` pattern does NOT work (empty string in split), must use `*.space-z.ai`
- Verified that both API endpoints work correctly:
  - POST /api/cases - creates new case successfully
  - POST /api/seed - generates demo data successfully
- The server is stable when accessed directly via curl, but dies when agent-browser's Chrome process is running
- The Caddy proxy works when the server is running (returns 200)
- The server dies after serving 3-7 requests due to memory pressure

Stage Summary:
- Added `allowedDevOrigins: ["*.space-z.ai"]` to next.config.ts
- Confirmed API endpoints work correctly
- Server stability issue is due to memory pressure (1.5GB+ usage on 3.9GB system)
- The agent-browser's Chrome process consumes additional memory, causing the server to die faster
- The code itself is correct - the issue is the dev server memory usage
