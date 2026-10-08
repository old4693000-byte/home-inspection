'use client';
import {useCallback,useEffect,useRef,useState,type RefObject} from 'react';

type Navigation={selectedId:number|null;cluster:number[]|null;view:string;filter:string;room:string;planId:string;depth:number;backLabel:string;scrollY:number};
const initial:Navigation={selectedId:null,cluster:null,view:'map',filter:'open',room:'',planId:'',depth:0,backLabel:'返回問題清單',scrollY:0};
const key='homeInspectionNavigation';

export function useInspectionNavigation(dataset:string,panel:RefObject<HTMLElement|null>){
 const [navigation,setNavigation]=useState<Navigation>(initial);
 const current=useRef(navigation),scope=useRef(''),restoring=useRef(false);
 const apply=useCallback((next:Navigation)=>{current.current=next;setNavigation(next)},[]);
 const write=useCallback((next:Navigation,push=false)=>{
  const entry={...history.state,[key]:{scope:scope.current,navigation:next}};
  if(push)history.pushState(entry,'');else history.replaceState(entry,'');
 },[]);
 useEffect(()=>{
  scope.current=location.pathname+location.search+'|'+dataset;
  const saved=history.state?.[key];
  const start=saved?.scope===scope.current?saved.navigation:{...current.current,selectedId:null,cluster:null,depth:0};
  apply(start);write(start);
  const previousRestoration=history.scrollRestoration;history.scrollRestoration='manual';
  const restore=(event:PopStateEvent)=>{
   if(location.pathname+location.search+'|'+dataset!==scope.current)return;
   const entry=event.state?.[key];
   const next:Navigation=entry?.scope===scope.current?entry.navigation:{...current.current,selectedId:null,cluster:null,depth:0};
   restoring.current=true;apply(next);
   requestAnimationFrame(()=>{window.scrollTo({top:next.scrollY,behavior:'instant'});restoring.current=false});
  };
  window.addEventListener('popstate',restore);
  return()=>{window.removeEventListener('popstate',restore);history.scrollRestoration=previousRestoration};
 },[dataset,apply,write]);
 const update=useCallback((patch:Partial<Navigation>)=>{
  const next={...current.current,...patch};apply(next);write(next);
 },[apply,write]);
 const back=useCallback(()=>{
  if(restoring.current)return;
  if(current.current.depth>0){restoring.current=true;history.back()}
  else{update({selectedId:null,cluster:null});panel.current?.scrollIntoView({block:'start',behavior:'smooth'})}
 },[update,panel]);
 const selectIssue=useCallback((ids:number[],fromList=false)=>{
  if(!ids.length||restoring.current)return;
  const before=current.current;
  if(fromList&&ids.length===1&&before.selectedId===ids[0])return;
  const sameGroup=ids.length>1&&before.cluster?.length===ids.length&&ids.every(id=>before.cluster!.includes(id));
  if(!fromList&&(ids.length===1&&before.selectedId===ids[0]||sameGroup)){back();return}
  write({...before,scrollY:window.scrollY});
  const parentLabel=before.selectedId!==null?'返回上一個問題':before.cluster?'返回此位置的問題':'返回問題清單';
  const next={...before,selectedId:ids.length===1?ids[0]:null,cluster:ids.length>1?ids:fromList&&before.cluster?.includes(ids[0])?before.cluster:null,depth:before.depth+1,backLabel:parentLabel,scrollY:window.scrollY};
  apply(next);write(next,true);
  requestAnimationFrame(()=>panel.current?.scrollIntoView({block:'start',behavior:'smooth'}));
 },[apply,write,back,panel]);
 const setView=useCallback((view:string)=>update({view}),[update]);
 const setFilter=useCallback((filter:string)=>update({filter,selectedId:null,cluster:null}),[update]);
 const setRoom=useCallback((room:string)=>update({room,selectedId:null,cluster:null}),[update]);
 const setPlanId=useCallback((planId:string,onlyIfEmpty=false)=>{if(!onlyIfEmpty||!current.current.planId)update({planId})},[update]);
 const resetNavigation=useCallback((planId:string)=>update({...initial,view:current.current.view,planId}),[update]);
 return {...navigation,setView,setFilter,setRoom,setPlanId,selectIssue,back,resetNavigation};
}
