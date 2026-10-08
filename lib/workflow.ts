import type {Issue,Portal,Round} from './model';
export class AppError extends Error{constructor(message:string,public status=400){super(message)}}
export function textValue(value:unknown,label:string,max=2000,required=true){if(typeof value!=='string'||value.length>max||required&&!value.trim())throw new AppError(`${label}請填寫完整，且不超過 ${max} 字。`);return value.trim()}
export function applyAction(issue:Issue,portal:Portal,action:string,note:string,photos:string[],now:string):Issue{
 const copy:Issue=structuredClone(issue),round=copy.rounds.at(-1)!;
 if(action==='update'){
  if(portal!=='designer')throw new AppError('只有設計師可以更新處理進度。',403);
  if(issue.status!=='pending'&&issue.status!=='ready')throw new AppError('這筆問題已結案，無法再更新進度。',409);
  const message=textValue(note,'進度內容');
  round.updates=[...(round.updates||[]),{note:message,createdAt:now}];
 }else if(action==='report'){
  if(portal!=='designer')throw new AppError('請從設計師入口回報修復。',403);
  if(issue.status!=='pending')throw new AppError('這筆問題已回報，請重新整理。',409);
  round.reportNote=note;round.repairPhotos=photos;round.reportedAt=now;copy.status='ready';
 }else if(action==='pass'||action==='fail'){
  if(portal!=='owner')throw new AppError('只有屋主可以填寫驗收結果。',403);
  if(issue.status!=='pending'&&issue.status!=='ready')throw new AppError('這筆問題已結案，無法再次驗收。',409);
  if(action==='fail'&&!note.trim())throw new AppError('請填寫不通過的原因。');
  round.verdict=action;round.verdictNote=note||'OK';round.inspectedAt=now;
  if(action==='pass'){copy.status='passed'}else{copy.status='pending';copy.rounds.push({number:round.number+1,createdAt:now,description:note,photos} satisfies Round)}
 }else{throw new AppError('無法辨識的操作。')}
 copy.revision++;copy.updatedAt=now;return copy;
}
