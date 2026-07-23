# nx-line-poc

The smallest thing that proves the whole loop: automate the endpoint, push a rule to the
camera, catch the POST, store it. One Worker, one D1 table, ~130 lines in `src/index.js`.

## What it proves

1. **Automated endpoint** - the Worker serves `/ingest` and `/setup` with no manual config.
2. **Rule pushed to the camera** - `/setup` logs into NX (via the Nx Cloud relay), grabs the
   first camera, and creates an event rule on it that fires a "Do HTTP request" at `/ingest`.
3. **Catch + store** - `/ingest` writes the event to D1; `/events` shows it.

## Setup

```bash
npm install
npx wrangler d1 create nx-line-poc     # paste the id into wrangler.jsonc
cp .dev.vars.example .dev.vars         # fill NX_USERNAME / NX_PASSWORD / NX_SYSTEM_ID
```

`NX_SYSTEM_ID` is the Cloud System ID (the UUID in your NX cloud URL).

## Run it

NX has to be able to reach the endpoint, so **deploy** before hitting `/setup` (a local
`wrangler dev` URL isn't reachable from NX):

```bash
npm run deploy
# then, for production, store the secrets:
npx wrangler secret put NX_USERNAME
npx wrangler secret put NX_PASSWORD
npx wrangler secret put NX_SYSTEM_ID
```

Then:

1. Open `https://<your-worker>.workers.dev/setup` - it returns the camera and rule id.
2. In NX, press the **"Test Event"** button that now appears on that camera.
3. Open `https://<your-worker>.workers.dev/events` - the event is there.

That's the entire proof. To fire on a real analytic instead of the test button, change
`eventType` to `"analyticsSdkEvent"` and use the analytic's event id.
