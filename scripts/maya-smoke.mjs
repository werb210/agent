#!/usr/bin/env node
// maya-smoke.mjs — live end-to-end smoke test for the Maya feature set.
// Mints a real service JWT, calls every BF-Server /api/maya/staff/* endpoint
// with realistic args (chaining real ids from pipeline-query / contact-find),
// hits the live agent /api/maya/message per audience, prints PASS/FAIL/SKIP.
// Read-only: send-sms and call-initiate are skipped by design.
//
// USAGE (Azure Cloud Shell or any Node 18+ host that can reach the services):
//   JWT_SECRET=<BF-Server JWT_SECRET> BASE_URL=https://server.boreal.financial \
//   MAYA_URL=https://<your-maya-service>.azurewebsites.net node maya-smoke.mjs
import crypto from "node:crypto";
const JWT_SECRET = process.env.JWT_SECRET || "";
const BASE_URL = (process.env.BASE_URL || "https://server.boreal.financial").replace(/\/$/, "");
const MAYA_URL = (process.env.MAYA_URL || "").replace(/\/$/, "");
if (!JWT_SECRET) { console.error("FATAL: set JWT_SECRET (must match BF-Server's JWT_SECRET)."); process.exit(2); }
function b64url(buf){return Buffer.from(buf).toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");}
function signServiceJWT(secret){const h=b64url(JSON.stringify({alg:"HS256",typ:"JWT"}));const now=Math.floor(Date.now()/1000);const p=b64url(JSON.stringify({kind:"service",source:"agent",iat:now,exp:now+3600}));const d=`${h}.${p}`;return `${d}.${b64url(crypto.createHmac("sha256",secret).update(d).digest())}`;}
const TOKEN = signServiceJWT(JWT_SECRET);
const rows = [];
function record(feature,status,detail){rows.push({feature,status,detail:detail||""});const tag=status==="PASS"?"\x1b[32mPASS\x1b[0m":status==="FAIL"?"\x1b[31mFAIL\x1b[0m":"\x1b[33mSKIP\x1b[0m";console.log(`  [${tag}] ${feature}${detail?"  — "+detail:""}`);}
async function callStaff(path,body){try{const res=await fetch(`${BASE_URL}/api/maya${path}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${TOKEN}`},body:JSON.stringify(body||{})});let data=null;try{data=await res.json();}catch{}return{status:res.status,ok:res.ok,data};}catch(e){return{status:0,ok:false,error:e?.message||"network_error"};}}
function summarize(d){if(!d)return "200";if(typeof d.count==="number")return `${d.count} result(s)`;if(Array.isArray(d.applications))return `${d.applications.length} app(s)`;if(typeof d.summary==="string")return d.summary.slice(0,60);return "200 ok";}
function judge(feature,r){if(r.status===401)return record(feature,"FAIL","401 — service JWT rejected (JWT_SECRET mismatch or fix not deployed)");if(r.status===404)return record(feature,"FAIL","404 — endpoint not deployed");if(r.status===0)return record(feature,"FAIL",r.error||"unreachable");if(r.status>=500)return record(feature,"FAIL",`${r.status} — server error`);if(r.data&&r.data.ok===false)return record(feature,"FAIL",r.data.error||"ok:false");return record(feature,"PASS",summarize(r.data));}
async function main(){
  console.log(`\nMaya smoke test → ${BASE_URL}${MAYA_URL?"  (agent: "+MAYA_URL+")":"  (agent checks skipped: no MAYA_URL)"}\n`);
  console.log("STAFF DATA ENDPOINTS (BF-Server):");
  const pipeline=await callStaff("/staff/pipeline-query",{query:"applications in review",silo:"BF"}); judge("pipeline.query",pipeline);
  const newest=await callStaff("/staff/application-newest",{}); judge("application.open_newest",newest);
  judge("daily.briefing",await callStaff("/staff/daily-briefing",{silo:"BF"}));
  judge("call.triage",await callStaff("/staff/call-triage",{}));
  judge("maya.audit",await callStaff("/staff/audit-recent",{}));
  judge("lender.products",await callStaff("/staff/lender-products",{country:"CA"}));
  const contacts=await callStaff("/staff/contact-find",{query:"a",silo:"BF"}); judge("contact.find",contacts);
  const appId=newest?.data?.application?.id||pipeline?.data?.applications?.[0]?.id||null;
  const contactRow=contacts?.data?.contacts?.[0]||null; const contactId=contactRow?.id||null; const contactPhone=contactRow?.phone||null;
  if(appId){
    judge("application.summary",await callStaff("/staff/application-summary",{application_id:appId}));
    judge("application.underwriting_summary",await callStaff("/staff/underwriting-summary",{application_id:appId}));
    judge("application.risk_flags",await callStaff("/staff/risk-flags",{application_id:appId}));
    judge("banking.summary",await callStaff("/staff/banking-summary",{application_id:appId}));
    judge("credit.summary",await callStaff("/staff/credit-summary",{application_id:appId}));
    judge("docs.request_draft",await callStaff("/staff/docs-request-draft",{application_id:appId}));
    judge("lender.match_explain",await callStaff("/staff/lender-match-explain",{application_id:appId}));
  } else for(const f of ["application.summary","application.underwriting_summary","application.risk_flags","banking.summary","credit.summary","docs.request_draft","lender.match_explain"]) record(f,"SKIP","no application id found");
  if(contactId){
    judge("contact.timeline",await callStaff("/staff/contact-timeline",{contact_id:contactId}));
    judge("notes.read",await callStaff("/staff/notes-read",{contact_id:contactId,silo:"BF"}));
  } else { record("contact.timeline","SKIP","no contact id"); record("notes.read","SKIP","no contact id"); }
  if(contactPhone){const bp=await callStaff("/staff/applications-by-phone",{phone:contactPhone}); if(bp.status===404) record("application.find_mine (endpoint)","FAIL","404 — applications-by-phone not deployed yet"); else judge("application.find_mine (endpoint)",bp);} else record("application.find_mine (endpoint)","SKIP","no contact phone");
  record("comm.send_sms","SKIP","write action — not exercised");
  record("call.initiate","SKIP","write action — not exercised");
  if(MAYA_URL){
    console.log("\nAGENT MESSAGE (live, end-to-end):");
    for(const [aud,msg] of [["visitor","How many lenders do you have?"],["client","What's the status of my application?"],["staff","How many applications are in review?"]]){
      try{
        const res=await fetch(`${MAYA_URL}/api/maya/message`,{method:"POST",headers:{"Content-Type":"application/json","X-Maya-Audience":aud},body:JSON.stringify({message:msg,phone:aud==="client"?(contactPhone||undefined):undefined})});
        const data=await res.json().catch(()=>({})); const reply=(data?.reply||"").toString();
        const bad=/i need more context|couldn't retrieve|couldn't find|having trouble/i.test(reply);
        if(!res.ok) record(`agent /message (${aud})`,"FAIL",`HTTP ${res.status}`);
        else if(!reply) record(`agent /message (${aud})`,"FAIL","empty reply");
        else if(bad) record(`agent /message (${aud})`,"FAIL",`failure-phrase: "${reply.slice(0,50)}"`);
        else record(`agent /message (${aud})`,"PASS",reply.slice(0,55));
      }catch(e){ record(`agent /message (${aud})`,"FAIL",e?.message||"unreachable"); }
    }
  }
  const pass=rows.filter(r=>r.status==="PASS").length, fail=rows.filter(r=>r.status==="FAIL").length, skip=rows.filter(r=>r.status==="SKIP").length;
  console.log(`\n──────── ${pass} PASS · ${fail} FAIL · ${skip} SKIP ────────`);
  if(fail){ console.log("\nNOT FUNCTIONING:"); for(const r of rows.filter(x=>x.status==="FAIL")) console.log(`  • ${r.feature} — ${r.detail}`); }
  process.exit(fail?1:0);
}
main().catch(e=>{console.error("harness crashed:",e);process.exit(2);});
