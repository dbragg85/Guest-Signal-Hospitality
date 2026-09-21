import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {dashboard,clean} from '../dashboard.mjs';
import {configuration,createServer,database} from '../server.mjs';
const token='a'.repeat(48);
const config={url:'https://example.supabase.co',key:'test-secret',tokenHash:createHash('sha256').update(token).digest('hex')};
const db={count:async()=>0,rows:async()=>[]};
async function start(t,source=db){const s=createServer(config,{db:source});await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{s.closeAllConnections();s.close(resolve);}));return `http://127.0.0.1:${s.address().port}`;}
test('dashboard uses exact counts, excludes test opportunities and has nine bounded pages',async()=>{
 const seen=[];const result=await dashboard({count:async(table,filters)=>{seen.push([table,filters]);return 0;},rows:async()=>[]});
 assert.equal(result.pages.length,9);assert.equal(result.pages[1].rows[0].value,'0');
 for(const [table,filters] of seen)if(table==='sales_opportunities')assert.equal(filters.is_test,'eq.false');
 assert.equal(result.pages[4].status,'unavailable');assert.equal(result.status,'ok');
 assert.ok(JSON.stringify(result).length<12288);
});
test('missing sources never become zero; complete outage is unavailable',async()=>{
 const result=await dashboard({count:async()=>{throw Error('secret');},rows:async()=>{throw Error('secret');}});
 assert.equal(result.status,'unavailable');assert.equal(result.pages[1].rows[0].value,'--');assert.ok(!JSON.stringify(result).includes('secret'));
});
test('text strips controls and non-ASCII and bounds length',()=>{assert.equal(clean('\nhello🎉',5),'hello');});
test('authentication, HTTP method, health, caching and throttling',async(t)=>{
 let queries=0;const base=await start(t,{...db,count:async()=>{queries++;return 12;}});
 assert.equal((await fetch(base+'/healthz')).status,200);
 assert.equal((await fetch(base+'/v1/device/dashboard')).status,401);
 const opts={headers:{Authorization:`Bearer ${token}`}};
 assert.equal((await fetch(base+'/v1/device/dashboard',{...opts,method:'POST'})).status,405);
 const r=await fetch(base+'/v1/device/dashboard',opts);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');
 assert.equal((await r.json()).pages[1].rows[0].value,'12');
 for(let i=0;i<11;i++)assert.equal((await fetch(base+'/v1/device/dashboard',opts)).status,200);
 assert.equal(queries,4);assert.equal((await fetch(base+'/v1/device/dashboard',opts)).status,429);
});
test('upstream outage returns 503 without credentials',async(t)=>{const base=await start(t,{count:async()=>{throw Error(config.key);},rows:async()=>{throw Error(config.key);}});const r=await fetch(base+'/v1/device/dashboard',{headers:{Authorization:`Bearer ${token}`}});assert.equal(r.status,503);assert.ok(!(await r.text()).includes(config.key));});
test('database requires exact count and sends new secret key only as apikey',async()=>{
 let options;const d=database(config,async(url,opts)=>{options=opts;assert.equal(url.searchParams.get('is_test'),'eq.false');return new Response(null,{headers:{'content-range':'*/1200'}});});
 assert.equal(await d.count('sales_opportunities',{is_test:'eq.false'}),1200);assert.equal(options.method,'HEAD');assert.equal(options.headers.apikey,config.key);assert.equal(options.headers.Authorization,undefined);
 const bad=database(config,async()=>new Response(null));await assert.rejects(bad.count('restaurants',{}));
});
test('configuration fails closed',()=>{assert.throws(()=>configuration({}));assert.throws(()=>configuration({SUPABASE_URL:'http://example.supabase.co',SUPABASE_SECRET_KEY:'x',DEVICE_TOKEN_SHA256:config.tokenHash}));});
test('populated contract sanitizes every row and preserves source dates',async()=>{
 const d={count:async()=>25,rows:async(table)=>table==='retained_revenue_metrics'?[{active_mrr_cents:9900,churned_mrr_cents:0,payment_failures:0,refunds:0}]:table==='review_observations'?[{restaurants:{name:'A'.repeat(80)},rating:4,review_date:'2026-09-20',review_text:'B'.repeat(200)}]:[]};
 const result=await dashboard(d);assert.equal(result.pages[7].rows[0].value,'$99.00');assert.ok(result.pages[3].rows[0].value.includes('2026-09-20'));
 for(const p of result.pages){assert.ok(p.title.length<=24);assert.ok(p.rows.length<=4);for(const r of p.rows){assert.ok(r.label.length<=24);assert.ok(r.value.length<=24);assert.ok(r.detail.length<=36);}}
 assert.ok(JSON.stringify(result).length<=12288);
});
test('optional source error preserves readable data as partial',async()=>{
 const result=await dashboard({count:async()=>3,rows:async(table)=>{if(table==='retained_revenue_metrics')throw Error('missing relation');return [];}});
 assert.equal(result.status,'partial');assert.equal(result.pages[7].status,'unavailable');assert.equal(result.pages[1].rows[0].value,'3');
});
