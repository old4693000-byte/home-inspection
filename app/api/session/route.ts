import {authorize,body,json,portalOf,safe} from '../../../lib/server';
export const dynamic='force-dynamic';
export async function GET(req:Request){return safe(async()=>json({portal:await authorize(req)}))}
export async function POST(req:Request){return safe(async()=>{await body(req);const portal=portalOf(req),response=json({portal});response.headers.set('Set-Cookie',`home_${portal}=selected; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${new URL(req.url).protocol==='https:'?'; Secure':''}`);return response})}
