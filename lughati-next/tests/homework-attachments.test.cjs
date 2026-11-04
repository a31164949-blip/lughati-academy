const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function fixture() {
  const calls = [], exports = {};
  let fail = false, malformed = false;
  const source = ts.transpileModule(fs.readFileSync('app/lib/uploadHomeworkAttachment.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, File, FormData, require: name => {
    assert.equal(name, './uploadCloudinary');
    return { uploadCloudinary: async (url, options) => {
      calls.push({ url, body: options.body });
      if (malformed) return new Response('not JSON');
      const type = url.includes('/raw/') ? 'raw' : 'image';
      return Response.json(fail ? { error: { message: 'File rejected' } }
        : { secure_url: `https://res.cloudinary.com/ffv5igmg/${type}/upload/v1/test` }, { status: fail ? 400 : 200 });
    } };
  } });
  return { upload: exports.uploadHomeworkAttachment, calls, reject: () => { fail = true; }, malformed: () => { malformed = true; } };
}

test('PDF and photos use the existing homework upload preset and return a usable attachment', async () => {
  for (const [name, type] of [['صياد التنوين.pdf', 'application/pdf'], ['photo.jpg', 'image/jpeg']]) {
    const f = fixture();
    const result = await f.upload(new File(['content'], name, { type }));
    assert.equal(f.calls[0].url, 'https://api.cloudinary.com/v1_1/ffv5igmg/image/upload');
    assert.equal(f.calls[0].body.get('upload_preset'), 'lughati_homework_upload');
    assert.equal(result.fileName, name);
    assert.match(result.downloadUrl, /^https:\/\/res\.cloudinary\.com\//);
  }
});
test('Word uses raw delivery and iPad files without MIME metadata are recognized', async () => {
  const f = fixture();
  await f.upload(new File(['content'], 'WORKSHEET.PDF'));
  assert.equal(f.calls[0].body.get('file').type, 'application/pdf');
  await f.upload(new File(['content'], 'worksheet.docx', { type: 'application/octet-stream' }));
  assert.equal(f.calls[1].url, 'https://api.cloudinary.com/v1_1/ffv5igmg/raw/upload');
  assert.match(f.calls[1].body.get('file').type, /wordprocessingml/);
});
test('empty, unsupported and oversized files are rejected before an upload', async () => {
  const f = fixture();
  for (const file of [new File([], 'empty.pdf', { type: 'application/pdf' }),
    new File(['bad'], 'script.js', { type: 'text/javascript' }),
    new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.pdf', { type: 'application/pdf' })]) {
    await assert.rejects(f.upload(file));
  }
  assert.equal(f.calls.length, 0);
});
test('provider rejection and malformed responses do not report a successful upload', async () => {
  const f = fixture(); f.reject();
  await assert.rejects(f.upload(new File(['pdf'], 'test.pdf', { type: 'application/pdf' })), /File rejected/);
  const g = fixture(); g.malformed();
  await assert.rejects(g.upload(new File(['pdf'], 'test.pdf', { type: 'application/pdf' })), /رابطًا صالحًا/);
});
