// Explicit release step for the owner's November 3 all-services opening.
// Credentials stay in the deployment environment; never log tokens or private keys.
const fs = require('node:fs');
const { initializeApp, cert } = require('firebase-admin/app');
async function main() {
  const now = Date.now();
  if (now < Date.parse('2026-11-03T00:00:00+03:00') || now >= Date.parse('2026-11-04T00:00:00+03:00')) return;
  let account = {};
  if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) account = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);
  const clean = v => typeof v === 'string' ? v.trim().replace(/^['"]|['"]$/g, '') : '';
  const projectId = clean(process.env.FIREBASE_PROJECT_ID) || clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || clean(account.project_id) || clean(process.env.FIREBASE_ADMIN_PROJECT_ID);
  if (projectId !== 'lughati-academy') throw Error('Unexpected Firebase project');
  const credential = cert({ projectId, clientEmail: clean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL) || clean(account.client_email), privateKey: (clean(process.env.FIREBASE_ADMIN_PRIVATE_KEY) || clean(account.private_key)).replace(/\\n/g, '\n') });
  initializeApp({credential,projectId});
  const {access_token} = await credential.getAccessToken();
  const base = 'https://firebaserules.googleapis.com/v1/projects/' + projectId;
  async function call(path,method,body) {
    const response = await fetch(base + path,{method,headers:{Authorization:'Bearer '+access_token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
    if(!response.ok) throw Error('Firebase rules request failed: '+response.status);
    return response.json();
  }
  // Amend the live source rather than overwriting unrelated rule changes.
  const release = await call('/releases/cloud.firestore','GET');
  const sourceResponse = await fetch('https://firebaserules.googleapis.com/v1/'+release.rulesetName,{headers:{Authorization:'Bearer '+access_token}});
  if(!sourceResponse.ok)throw Error('Cannot read live rules');
  const ruleset = await sourceResponse.json();
  const files = ruleset.source.files;
  const file = files.find(f=>f.content.includes('function isStudent()'));
  if(!file)throw Error('Cannot locate student access rules');
  const source = file.content;
  if(!source.includes('function temporaryAcademyOpen()')) {
    const original = '&& studentAdmissionAccepted()\n        && studentAccountAvailable();';
    if(!source.includes(original))throw Error('Live access rules differ; refusing overwrite');
    file.content = source.replace(original,'&& (temporaryAcademyOpen() || (studentAdmissionAccepted()\n        && studentAccountAvailable()));').replace('    function studentAdmissionAccepted()',"    function temporaryAcademyOpen() {\n      return request.time >= timestamp.date(2026, 11, 2) + duration.value(21, 'h')\n        && request.time < timestamp.date(2026, 11, 3) + duration.value(21, 'h');\n    }\n\n    function studentAdmissionAccepted()");
    const created = await call('/rulesets','POST',{source:{files}});
    const current = await call('/releases/cloud.firestore','GET');
    if(current.rulesetName !== release.rulesetName)throw Error('Live rules changed during release; refusing overwrite');
    await call('/releases/cloud.firestore','PATCH',{release:{name:release.name,rulesetName:created.name},updateMask:'ruleset_name'});
  }
  console.log('Temporary student services rules deployed; expiry 2026-11-04 00:00 Asia/Riyadh.');
}
main().catch(e=>{console.error(e.message);process.exit(1)});
