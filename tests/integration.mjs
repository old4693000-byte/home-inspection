import assert from 'node:assert/strict';

// Writes synthetic records only to a loopback server. No cloud credentials needed.
const base = process.env.INSPECTION_TEST_URL || 'http://127.0.0.1:5173';
const target = new URL(base);
if (target.hostname !== '127.0.0.1' || target.protocol !== 'http:' || target.pathname !== '/') {
  throw new Error('Integration tests require a local http://127.0.0.1 server.');
}
const cookies = {};
const checks = [];
async function call(path, portal, body, extra = {}) {
  const response = await fetch(base + '/api/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      ...(portal ? { 'x-portal': portal, cookie: cookies[portal] || '' } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json', origin: base }),
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // Framework-level rejections may return plain text rather than application JSON.
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: text }; }
  return { status: response.status, data, headers: response.headers };
}
assert.equal((await call('state')).status, 401);
for (const role of ['owner', 'designer', 'visitor']) {
  const response = await call('session', role, {});
  assert.equal(response.status, 200);
  cookies[role] = response.headers.get('set-cookie').split(';')[0];
  assert.equal((await call('state', role)).status, 200);
}
assert.equal((await call('session', 'owner', {}, { origin: 'https://invalid.example' })).status, 403);
checks.push('Role sessions work; cross-origin writes rejected');

// A generated one-pixel PNG, with no camera metadata or real photograph.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a20cAAAAASUVORK5CYII=', 'base64');
async function upload(role, purpose) {
  const response = await fetch(base + '/api/upload?purpose=' + purpose, {
    method: 'POST',
    headers: { 'x-portal': role, cookie: cookies[role], origin: base, 'content-type': 'image/png', 'x-filename': 'synthetic-test.png' },
    body: png,
  });
  return { status: response.status, data: await response.json() };
}
assert.equal((await upload('visitor', 'photo')).status, 403);
const uploadedPlan = await upload('owner', 'plan');
assert.equal(uploadedPlan.status, 201);
const photo = await upload('owner', 'photo');
assert.equal(photo.status, 201);
const asset = await fetch(base + '/api/assets/' + uploadedPlan.data.id + '?portal=visitor', { headers: { cookie: cookies.visitor } });
assert.equal(asset.status, 200);
assert.deepEqual(Buffer.from(await asset.arrayBuffer()), png);
checks.push('Synthetic plan/photo upload, R2 readback, visitor upload rejection');

const payload = { requestId: crypto.randomUUID(), room: '測試區域', location: '虛構位置', description: '虛構測試資料', planId: uploadedPlan.data.id, x: 0.25, y: 0.5, photos: [photo.data.id] };
assert.equal((await call('issues', 'visitor', payload)).status, 403);
assert.equal((await call('issues', 'designer', payload)).status, 403);
const created = await call('issues', 'owner', payload);
assert.equal(created.status, 201);
let issue = created.data;
assert.equal((await call('issues', 'owner', payload)).data.id, issue.id);
checks.push('Owner creates a located issue; duplicate request does not duplicate it');

async function action(role, kind, note = '') {
  return call('issues/' + issue.id, role, { action: kind, note, revision: issue.revision, photos: [] });
}
assert.equal((await action('visitor', 'pass')).status, 403);
assert.equal((await action('designer', 'pass')).status, 403);
assert.equal((await action('owner', 'update', 'Test')).status, 403);
assert.equal((await action('designer', 'update', ' ')).status, 400);
const progress = await action('designer', 'update', '虛構範例：已排工，預計下週處理');
assert.equal(progress.status, 200);
issue = progress.data;
assert.equal(issue.status, 'pending');
assert.equal(issue.rounds[0].reportedAt, undefined);
assert.equal(issue.rounds[0].updates.length, 1);
checks.push('Progress appends without marking repair complete');

const race = await Promise.all(['訊息 A', '訊息 B'].map(note => action('designer', 'update', note)));
assert.deepEqual(race.map(r => r.status).sort(), [200, 409]);
issue = race.find(r => r.status === 200).data;
checks.push('Revision conflict protects concurrent progress writes');

const failed = await action('owner', 'fail', '虛構範例：仍需調整');
assert.equal(failed.status, 200);
issue = failed.data;
assert.equal(issue.rounds.length, 2);
assert.equal(issue.rounds[0].verdict, 'fail');
assert.equal(issue.rounds[0].reportedAt, undefined);
assert.equal(issue.rounds[1].updates, undefined);
assert.equal(issue.x, 0.25);
const closedRound = structuredClone(issue.rounds[0]);
issue = (await action('designer', 'report', '虛構範例：調整完成')).data;
assert.equal(issue.status, 'ready');
const reportedAt = issue.rounds[1].reportedAt;
issue = (await action('designer', 'update', '虛構範例：可安排驗收')).data;
assert.equal(issue.status, 'ready');
assert.equal(issue.rounds[1].reportedAt, reportedAt);
issue = (await action('owner', 'pass')).data;
assert.equal(issue.status, 'passed');
assert.deepEqual(issue.rounds[0], closedRound);
assert.equal((await action('designer', 'update', 'closed')).status, 409);
checks.push('Direct rejection, subsequent repair and acceptance preserve round history');

for (const role of ['owner', 'designer', 'visitor']) {
  assert.deepEqual((await call('state', role)).data.issues.find(i => i.id === issue.id), issue);
  assert.deepEqual((await call('share', role)).data, { path: '/' });
}
const direct = await call('issues', 'owner', { ...payload, requestId: crypto.randomUUID() });
issue = direct.data;
issue = (await action('owner', 'pass')).data;
assert.equal(issue.status, 'passed');
assert.equal(issue.rounds[0].reportedAt, undefined);
checks.push('Shared readback and owner acceptance before designer completion');
console.log(JSON.stringify({ passed: checks.length, checks, note: 'Synthetic local records remain in .wrangler/state; never include that directory in a shared archive.' }, null, 2));
