---
name: Railway production installs
description: Deployment constraint for projects whose build and schema sync run during Railway install/start.
---

Railway builds can run with production dependencies only when the environment sets production install behavior; anything required by the production build or deploy-time database synchronization must therefore be available outside devDependencies.

**Why:** The imported project reported an npm production install failure and its start command depended on Drizzle tooling that had originally been development-only.

**How to apply:** Keep the Railway build toolchain and schema-sync CLI in production dependencies, pin the Node/npm major with engines, and make the start command perform the schema sync before serving the compiled app.

Unused native optional dependencies can make npm installs less reliable in constrained builders; remove them when the application does not import them.