// Synchronize the owner's academy opening decision with live student access rules.
// Credentials stay in the deployment environment; never log tokens or private keys.
const opening = require('../app/lib/academyOpening.json');
const { initializeApp, cert } = require('firebase-admin/app');
const datedFunction = `    function temporaryAcademyOpen() {
      return request.time >= timestamp.date(2026, 11, 2) + duration.value(21, 'h')
        && request.time < timestamp.date(2026, 11, 3) + duration.value(21, 'h');
    }`;
const openFunction = `    function temporaryAcademyOpen() {
      // All authenticated students may enter; teacher and ownership rules remain.
      return true;
    }`;
function patchOpeningRules(source, openToAll) {
  const target = openToAll ? openFunction : datedFunction;
  const matches = [...source.matchAll(/^    function temporaryAcademyOpen\(\) \{[^{}]*\}/gm)];
  if (matches.length === 1) {
    const normalize = value => value.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, '');
    if (![datedFunction, openFunction].some(known => normalize(known) === normalize(matches[0][0]))) {
      throw Error('Unknown live opening policy; refusing overwrite');
    }
    return source.replace(matches[0][0], target);
  }
  if (matches.length || source.includes('function temporaryAcademyOpen')) throw Error('Unexpected live opening rules');
  const original = '&& studentAdmissionAccepted()\n        && studentAccountAvailable();';
  if (!source.includes(original) || !source.includes('    function studentAdmissionAccepted()')) throw Error('Live access rules differ; refusing overwrite');
  return source.replace(original, '&& (temporaryAcademyOpen() || (studentAdmissionAccepted()\n        && studentAccountAvailable()));')
    .replace('    function studentAdmissionAccepted()', target + '\n\n    function studentAdmissionAccepted()');
}
async function main() {
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
  file.content = patchOpeningRules(source, opening.openToAllStudents);
  if (source !== file.content) {
    const created = await call('/rulesets','POST',{source:{files}});
    const current = await call('/releases/cloud.firestore','GET');
    if(current.rulesetName !== release.rulesetName)throw Error('Live rules changed during release; refusing overwrite');
    await call('/releases/cloud.firestore','PATCH',{release:{name:release.name,rulesetName:created.name},updateMask:'ruleset_name'});
  }
  console.log(opening.openToAllStudents ? 'All-student academy access rules synchronized; no automatic expiry.' : 'Restricted academy access rules synchronized.');
}
module.exports = { patchOpeningRules };
if (require.main === module) main().catch(e=>{console.error(e.message);process.exit(1)});
