import {authorize,json,safe} from '../../../lib/server';
export const dynamic='force-dynamic';
export async function GET(req:Request){return safe(async()=>{await authorize(req);return json({path:'/'})})}
