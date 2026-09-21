import {readFileSync} from 'node:fs';
const origin=new URL(process.argv[2]||'https://invalid.invalid');
if(origin.protocol!=='https:'||!origin.hostname.endsWith('.onrender.com')||origin.username||origin.password)throw Error('Supply your HTTPS onrender.com service URL');
const {device_token}=JSON.parse(readFileSync(process.argv[3]||'.device-credentials.json','utf8'));
const health=await fetch(new URL('/healthz',origin),{redirect:'error',signal:AbortSignal.timeout(90000)});
console.log('Process health:',health.status);
const r=await fetch(new URL('/v1/device/dashboard',origin),{headers:{Authorization:`Bearer ${device_token}`},redirect:'error',signal:AbortSignal.timeout(30000)});
console.log('Authenticated data:',r.status);
if(!r.ok){console.log('Check service variables, device-token hash, and Supabase schema.');process.exitCode=1;}
else {const data=await r.json();console.log('Sources:',data.status,'Checked:',data.generated_at);for(const p of data.pages)console.log(p.title,p.status);}
