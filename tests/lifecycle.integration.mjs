import assert from 'node:assert/strict';
const base=process.env.INSPECTION_TEST_URL||'http://127.0.0.1:5173';
if(!base||new URL(base).hostname!=='127.0.0.1'||new URL(base).protocol!=='http:')throw new Error('Use INSPECTION_TEST_URL with a local HTTP server only.');
const cookies={},checks=[];
async function call(path,portal,body){
 const r=await fetch(base+'/api/'+path,{method:body===undefined?'GET':'POST',headers:{'x-portal':portal,cookie:cookies[portal]||'',...(body===undefined?{}:{'content-type':'application/json',origin:base})},body:body===undefined?undefined:JSON.stringify(body)});
 const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={error:text}}
 return {status:r.status,data,headers:r.headers};
}
for(const portal of ['owner','designer','visitor']){const r=await call('session',portal,{});assert.equal(r.status,200);cookies[portal]=r.headers.get('set-cookie').split(';')[0]}
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a20cAAAAASUVORK5CYII=','base64');
const uploaded=await fetch(base+'/api/upload?purpose=photo',{method:'POST',headers:{'x-portal':'owner',cookie:cookies.owner,origin:base,'content-type':'image/png'},body:png});assert.equal(uploaded.status,201);const photo=(await uploaded.json()).id;
const payload={requestId:crypto.randomUUID(),room:'測試區域',location:'虛構位置',description:'本機撤銷與回收測試',planId:null,x:null,y:null,photos:[photo]};
const created=await call('issues','owner',payload);assert.equal(created.status,201);let issue=created.data;
const original=structuredClone(issue);
async function action(portal,action,note='',revision=issue.revision){return call('issues/'+issue.id,portal,{action,note,photos:[],revision})}
async function accept(portal,kind,note=''){const r=await action(portal,kind,note);assert.equal(r.status,200,JSON.stringify(r.data));issue=r.data;return issue}
await accept('owner','pass');
assert.equal((await action('owner','undo','',original.revision)).status,409);
assert.equal((await action('designer','undo')).status,403);
assert.equal((await action('visitor','undo')).status,403);
await accept('owner','undo');
assert.equal(issue.status,'pending');assert.deepEqual(issue.rounds,original.rounds);assert.equal(issue.changes[0].previousRound.verdict,'pass');
checks.push('Direct acceptance can be undone without losing photos; roles and revision conflicts enforced');

await accept('designer','report','虛構修復');const repair=structuredClone(issue.rounds);
await accept('owner','pass');await accept('owner','undo');assert.equal(issue.status,'ready');assert.deepEqual(issue.rounds,repair);
checks.push('Undo returns reported repairs to ready while preserving repair evidence');

await accept('owner','fail','虛構不通過原因');const rejected=structuredClone(issue.rounds);
await accept('owner','undo');assert.equal(issue.status,'ready');assert.deepEqual(issue.rounds,repair);assert.deepEqual(issue.changes.at(-1).removedRound,rejected[1]);
await accept('owner','fail','第二次虛構原因');await accept('designer','update','已安排下一輪');
assert.equal((await action('owner','undo')).status,409);
checks.push('Rejection can be undone only before next-round work; removed round retained in audit');

const beforeDelete=structuredClone(issue);
assert.equal((await action('designer','delete')).status,403);
assert.equal((await action('visitor','delete')).status,403);
await accept('owner','delete');assert.ok(issue.deletedAt);assert.deepEqual(issue.rounds,beforeDelete.rounds);
for(const portal of ['designer','visitor']){const state=await call('state',portal);assert.equal(state.status,200);assert.ok(!state.data.issues.some(i=>i.id===issue.id))}
const owner=await call('state','owner');assert.deepEqual(owner.data.issues.find(i=>i.id===issue.id),issue);
checks.push('Soft-deleted items are retained for the owner and hidden from designer/visitor lists');

for(const kind of ['delete','undo','pass','fail','locate'])assert.equal((await action('owner',kind,'Test')).status,409);
assert.equal((await action('designer','update','Test')).status,409);
assert.equal((await action('designer','restore')).status,403);
assert.equal((await action('visitor','restore')).status,403);
const deletedRevision=issue.revision;
await accept('owner','restore');assert.equal(issue.deletedAt,null);assert.equal(issue.status,beforeDelete.status);assert.deepEqual(issue.rounds,beforeDelete.rounds);
assert.equal((await action('owner','delete','',deletedRevision)).status,409);
assert.equal((await action('owner','restore')).status,409);
for(const portal of ['owner','designer','visitor'])assert.deepEqual((await call('state',portal)).data.issues.find(i=>i.id===issue.id),issue);
const image=await fetch(base+'/api/assets/'+photo+'?portal=owner',{headers:{cookie:cookies.owner}});assert.equal(image.status,200);assert.deepEqual(Buffer.from(await image.arrayBuffer()),png);
assert.deepEqual(issue.changes.slice(-2).map(c=>c.action),['delete','restore']);
checks.push('Restore retains all state and image bytes; deleted edits and stale requests rejected');
console.log(JSON.stringify({passed:checks.length,checks,localTestIssueId:issue.id},null,2));
