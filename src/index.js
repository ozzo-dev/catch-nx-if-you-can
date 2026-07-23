// Minimal NX -> HTTPS -> D1 proof of concept. Three routes, one file.
//
//   GET  /setup    log into NX, grab a camera, create a rule that POSTs to /ingest
//   POST /ingest   catch the event and store it
//   GET  /events   show what we stored
//
// Put NX_USERNAME / NX_PASSWORD / NX_SYSTEM_ID in .dev.vars (see .dev.vars.example).

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/setup") return setup(env, url.origin);
    if (url.pathname === "/cameras") return cameras(env);
    if (url.pathname === "/ingest") return ingest(env);
    if (url.pathname === "/events") return events(env);
    return json({ ok: true, routes: ["/setup", "/ingest", "/events"] });
  },
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data, null, 2), { status, headers: { "content-type": "application/json" } });

// ---- 3. catch the HTTPS post and store it ----
async function ingest(env) {
  await env.DB.prepare(`INSERT INTO events DEFAULT VALUES`).run();
  return new Response();
}

async function events(env) {
  const { results } = await env.DB.prepare(`SELECT id, at FROM events ORDER BY id DESC LIMIT 20`).all();
  return json({ count: results.length, events: results });
}

// log in to NX -> { relay, token }
async function login(env) {
  const relay = `https://${env.NX_SYSTEM_ID}.relay.vmsproxy.com`;
  const tok = await (
    await fetch("https://nxvms.com/cdb/oauth2/token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        grant_type: "password",
        response_type: "token",
        client_id: "3rdParty",
        username: env.NX_USERNAME,
        password: env.NX_PASSWORD,
        scope: `cloudSystemId=${env.NX_SYSTEM_ID}`,
      }),
    })
  ).json();
  return { relay, token: tok.access_token };
}

// list every camera on the system
async function cameras(env) {
  const { relay, token } = await login(env);
  const cams = await nx(relay, token, "/ec2/getCamerasEx");
  return json(cams.map((c) => ({ id: c.id, name: c.name })));
}

// ---- 1 + 2. create the table + the rule on the camera ----
async function setup(env, origin) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT DEFAULT (datetime('now')))`,
  ).run();

  const { NX_USERNAME, NX_PASSWORD, NX_SYSTEM_ID } = env;
  if (!NX_USERNAME || !NX_PASSWORD || !NX_SYSTEM_ID)
    return json({ error: "Set NX_USERNAME, NX_PASSWORD and NX_SYSTEM_ID in .dev.vars" }, 400);

  const { relay, token } = await login(env);
  if (!token) return json({ error: "NX login failed" }, 502);

  // pick the first camera on the system
  const cams = await nx(relay, token, "/ec2/getCamerasEx");
  const cam = Array.isArray(cams) && cams[0];
  if (!cam) return json({ error: "No cameras on this system" }, 404);

  // soft-trigger rule → POST /ingest. Shows as "Test Event" on the camera.
  // For a real analytic: eventType "analyticsSdkEvent" + the analytic's id.
  const ingestUrl = `${origin}/ingest`;
  const rule = {
    id: "{22222222-2222-2222-2222-222222222222}",
    eventType: "softwareTriggerEvent",
    eventState: "Undefined",
    eventCondition: JSON.stringify({
      caption: "Test Event",
      description: "_simple_plus",
      inputPortId: "11111111-1111-1111-1111-111111111111",
      metadata: { allUsers: true },
    }),
    eventResourceIds: [cam.id],
    actionType: "execHttpRequestAction",
    actionParams: JSON.stringify({
      httpMethod: "POST",
      url: ingestUrl,
    }),
    actionResourceIds: [],
    disabled: false,
  };
  const saved = await nx(relay, token, "/ec2/saveEventRule", rule);

  return json({ camera: cam.name, ruleId: saved.id });
}

// Call NX through the relay. The relay 307-redirects to a regional node on a different
// subdomain, and fetch drops the auth header across that hop, so follow it by hand.
async function nx(base, token, path, body) {
  let target = base + path;
  for (let i = 0; i < 4; i++) {
    const res = await fetch(target, {
      method: body ? "POST" : "GET",
      redirect: "manual",
      headers: {
        authorization: `Bearer ${token}`,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      target = new URL(loc, target).toString();
      continue;
    }
    return res.json();
  }
  throw new Error("too many redirects");
}
