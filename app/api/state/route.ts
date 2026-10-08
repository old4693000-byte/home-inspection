import {authorize,db,decodeIssue,json,safe} from '../../../lib/server';
export const dynamic='force-dynamic';
export async function GET(req:Request){return safe(async()=>{const portal=await authorize(req);const [plans,issues]=await Promise.all([db().prepare('SELECT id,name,created_at AS createdAt FROM plans ORDER BY created_at DESC').all(),db().prepare(portal==='owner'?'SELECT * FROM issues ORDER BY updated_at DESC,id DESC':'SELECT * FROM issues WHERE deleted_at IS NULL ORDER BY updated_at DESC,id DESC').all()]);return json({plans:plans.results,issues:issues.results.map(decodeIssue)})})}
