import http from 'node:http';
import {createHash,timingSafeEqual} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {dashboard} from './dashboard.mjs';

export function configuration(env=process.env) {
  const url=new URL(env.SUPABASE_URL || 'https://invalid.invalid');
  if(url.protocol!=='https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)||url.username||url.password||url.search||url.hash||url.pathname!=='/') throw Error('SUPABASE_URL must be your https://PROJECT.supabase.co URL');
  if(!env.SUPABASE_SECRET_KEY)throw Error('SUPABASE_SECRET_KEY required');
  if(!/^[a-f0-9]{64}$/.test(env.DEVICE_TOKEN_SHA256||''))throw Error('DEVICE_TOKEN_SHA256 must be a 64-character SHA-256 hex digest');
  return {url:url.origin,key:env.SUPABASE_SECRET_KEY,tokenHash:env.DEVICE_TOKEN_SHA256};
}
export function database(config,fetcher=fetch) {
  async function request(table,params,method='GET'){
    const url=new URL(`${config.url}/rest/v1/${table}`);url.search=new URLSearchParams(params).toString();
    const headers={apikey:config.key,Accept:'application/json',Prefer:'count=exact'};
    // Legacy service-role JWTs also require Authorization; new secret keys use apikey.
    if(config.key.startsWith('eyJ'))headers.Authorization=`Bearer ${config.key}`;
    const response=await fetcher(url,{method,headers,redirect:'error',signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw Error('Database source unavailable');
    if(method==='HEAD'){
      const total=response.headers.get('content-range')?.split('/')[1];
      if(!/^\d+$/.test(total||''))throw Error('Exact count missing');
      const n=Number(total);if(!Number.isSafeInteger(n))throw Error('Count out of range');return n;
    }
    const data=await response.json();if(!Array.isArray(data))throw Error('Invalid database response');return data;
  }
  return {count:(table,filters)=>request(table,{select:'id',...filters},'HEAD'), rows:(table,params)=>request(table,params)};
}
export function createServer(config,{db=database(config),clock=()=>Date.now()}={}){
  let cached=null,expires=0,inflight=null;const windows=new Map();
  return http.createServer(async(req,res)=>{
    const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
    if(req.url==='/healthz'&&req.method==='GET')return send(200,{status:'ok'});
    if(req.url!=='/v1/device/dashboard')return send(404,{error:'not_found'});
    if(req.method!=='GET')return send(405,{error:'method_not_allowed'});
    const token=/^Bearer ([A-Za-z0-9_-]{32,128})$/.exec(req.headers.authorization||'')?.[1];
    const digest=createHash('sha256').update(token||'').digest();
    if(!token||!timingSafeEqual(digest,Buffer.from(config.tokenHash,'hex')))return send(401,{error:'unauthorized'});
    const now=clock(); // Limit authenticated device requests; never log the token.
    const key=config.tokenHash;let window=windows.get(key);
    if(!window||now-window.at>=60000){window={at:now,count:0};windows.set(key,window);}
    if(++window.count>12)return send(429,{error:'rate_limited'});
    try {
      if(!cached||now>=expires){
        if(!inflight)inflight=dashboard(db,new Date(now)).then(v=>{cached=v;expires=clock()+30000;return v;}).finally(()=>{inflight=null;});
        await inflight;
      }
      if(cached.status==='unavailable')return send(503,{error:'sources_unavailable'});
      return send(200,cached);
    } catch {return send(503,{error:'temporarily_unavailable'});}
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const server=createServer(configuration());server.requestTimeout=15000;server.headersTimeout=10000;
  server.listen(Number(process.env.PORT||10000),'0.0.0.0',()=>console.log('Guest Signal device API ready'));
  process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
}
