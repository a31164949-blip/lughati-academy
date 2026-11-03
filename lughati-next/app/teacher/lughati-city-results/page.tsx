"use client";
import Link from "next/link";
import {useEffect,useState,useCallback} from "react";
import {onAuthStateChanged} from "firebase/auth";
import {auth} from "../../../firebase";
type Row={id:string;studentName:string;classroom:string;stars:number;bestStars:number;attempts:number;completedAt:string};
export default function Results(){
 const [rows,setRows]=useState<Row[]>([]),[cursor,setCursor]=useState<string|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const load=useCallback(async(next?:string)=>{
  if(!auth.currentUser){setMessage("سجّل دخولك بحساب المعلم.");return;}
  setBusy(true);setMessage("");
  try{
   const token=await auth.currentUser.getIdToken();
   const response=await fetch("/api/academy-club/lughati-city"+(next?"?cursor="+encodeURIComponent(next):""),{headers:{Authorization:"Bearer "+token},cache:"no-store"});
   const data=await response.json();
   if(!response.ok||!data.success)throw Error();
   setRows(old=>next?[...old,...data.rows]:data.rows);setCursor(data.cursor);
  }catch{setMessage("تعذر تحميل النتائج. تحقق من حساب المعلم ثم أعد المحاولة.");}finally{setBusy(false);}
 },[]);
 useEffect(()=>onAuthStateChanged(auth,u=>{if(u)void load();else setMessage("سجّل دخولك بحساب المعلم.");}),[load]);
 return <main dir="rtl" style={{padding:24,color:"#174d3b",background:"#f4fbf7",minHeight:"100vh",fontFamily:"Arial"}}>
 <Link href="/teacher">العودة إلى لوحة المعلم</Link><h1>🏙️ نتائج مدينة لغتي</h1>
 <p>أحدث جولة مكتملة لكل طالب، وأفضل نتيجة وعدد الجولات. النجوم تدريبية ولا تضاف إلى بنك النقاط.</p>
 <button disabled={busy} onClick={()=>void load()}>تحديث النتائج</button><p role="status">{busy?"جارٍ التحميل…":message}</p>
 {!busy&&!message&&rows.length===0&&<p>لم تصل نتائج بعد.</p>}
 <div style={{overflowX:"auto"}}><table style={{width:"100%",textAlign:"right",borderCollapse:"collapse"}}><thead><tr>{["الطالب","الصف","آخر نتيجة ⭐","أفضل نتيجة ⭐","الجولات","وقت آخر جولة"].map(t=><th key={t} style={{padding:12}}>{t}</th>)}</tr></thead><tbody>
 {rows.map(r=><tr key={r.id} style={{background:"#fff",borderBottom:"1px solid #cde4d7"}}><th scope="row" style={{padding:12}}>{r.studentName}</th><td>{r.classroom}</td><td>{r.stars}</td><td>{r.bestStars}</td><td>{r.attempts}</td><td>{r.completedAt?new Date(r.completedAt).toLocaleString("ar-SA",{timeZone:"Asia/Riyadh"}):"—"}</td></tr>)}
 </tbody></table></div>{cursor&&<button disabled={busy} onClick={()=>void load(cursor)}>عرض المزيد</button>}</main>;
}