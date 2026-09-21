import {randomBytes,createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const token=randomBytes(32).toString('base64url');
const hash=createHash('sha256').update(token).digest('hex');
const path=process.argv[2]||'.device-credentials.json';
writeFileSync(path,JSON.stringify({device_token:token,DEVICE_TOKEN_SHA256:hash},null,2)+'\n',{mode:0o600,flag:'wx'});
console.log(`Saved private device credentials to ${path}. Keep this file out of Git and ZIP packages.`);
console.log(`Render DEVICE_TOKEN_SHA256: ${hash}`);
