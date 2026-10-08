'use client';
import {useRef,useState} from 'react';
import {ArchiveRestore,RotateCcw,Trash2} from 'lucide-react';
import {code,statusText,type Issue,type Portal} from '../lib/model';
import {canUndoInspection} from '../lib/workflow';
import {Modal,PhotoStrip} from './components';

const date=(value:string)=>new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));

export function IssueManagement({issue,onAction}:{issue:Issue;onAction:(action:string,note:string,files:File[])=>Promise<void>}){
 const [confirm,setConfirm]=useState<{action:'undo'|'delete';revision:number}|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const flight=useRef(false);
 const undo=confirm?.action==='undo';
 async function run(action:string){
  if(flight.current)return;
  if(confirm&&issue.revision!==confirm.revision){setError('資料剛剛有更新，請取消後重新確認。');return;}
  flight.current=true;setBusy(true);setError('');
  try{await onAction(action,'',[]);setConfirm(null)}catch(e){setError((e as Error).message)}finally{flight.current=false;setBusy(false)}
 }
 function open(action:'undo'|'delete'){setError('');setConfirm({action,revision:issue.revision})}
 const previous=issue.status==='passed'?issue.rounds.at(-1):issue.rounds.at(-2);
 return <section className="issue-management" aria-label="屋主管理問題">
  {issue.deletedAt?<><p>已移至回收筒，照片與處理紀錄都還在。</p><button className="secondary" disabled={busy} onClick={()=>void run('restore')}><ArchiveRestore size={18}/>{busy?'正在恢復…':'恢復問題'}</button></>:<div className="management-buttons">
   {canUndoInspection(issue)&&<button className="secondary" disabled={busy} onClick={()=>open('undo')}><RotateCcw size={18}/>撤銷這次驗收</button>}
   <button className="text-button delete-control" disabled={busy} onClick={()=>open('delete')}><Trash2 size={17}/>刪除問題</button>
  </div>}
  {error&&!confirm&&<p className="form-error" role="alert">{error}</p>}
  {confirm&&<Modal title={undo?'撤銷這次驗收？':'刪除這筆問題？'} busy={busy} onClose={()=>{setConfirm(null);setError('')}}><div className="modal-body">
   <p><b>{code(issue.id)} · {issue.room} · {issue.location}</b></p>
   <p className="confirmation-copy">{undo?`撤銷最近一次驗收後，會回到「${previous?.reportedAt?'待驗收':'待修復'}」。原本的照片與修復紀錄會保留，這次更正也會留下紀錄。`:'這筆問題會從清單與平面圖移到回收筒，照片與完整紀錄都會保留，之後可以恢復。'}</p>
   {undo&&issue.status!=='passed'&&<p className="muted">尚未開始處理的下一輪會一併撤回，內容保存在更正紀錄。</p>}
   {error&&<p className="form-error" role="alert">{error}</p>}
   <div className="form-actions"><button className="secondary" disabled={busy} onClick={()=>{setConfirm(null);setError('')}}>取消</button><button className={undo?'primary':'danger'} disabled={busy} onClick={()=>void run(confirm.action)}>{busy?'正在儲存…':undo?'確認撤銷驗收':'確認移到回收筒'}</button></div>
  </div></Modal>}
 </section>;
}

export function IssueChanges({issue,portal}:{issue:Issue;portal:Portal}){
 if(!issue.changes?.length)return null;
 return <section className="detail-section change-history"><h3>更正與回收紀錄</h3>{[...issue.changes].reverse().map((change,index)=><details key={index} className="change-entry"><summary><b>{change.action==='undo'?'屋主撤銷驗收':change.action==='delete'?'移至回收筒':'從回收筒恢復'}</b><small>{date(change.at)}</small></summary><p>{change.note}</p>{change.restoredStatus&&<p>恢復為：{statusText[change.restoredStatus]}</p>}{change.previousRound&&<><p>原第 {change.previousRound.number} 次驗收：{change.previousRound.verdict==='pass'?'通過':'不通過'} · {change.previousRound.verdictNote}</p>{change.previousRound.inspectedAt&&<p className="muted">原驗收時間：{date(change.previousRound.inspectedAt)}</p>}</>}{change.removedRound&&<><p>撤回第 {change.removedRound.number} 次處理：{change.removedRound.description}</p><PhotoStrip ids={change.removedRound.photos} portal={portal}/></>}</details>)}</section>;
}
