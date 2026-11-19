const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);
const { validateCoachAttachments: validate, MAX_COACH_FILE_BYTES: max } = require('./attachments.ts');
const photo = { uri: 'file:///photo.jpg', name: 'photo.jpg', size: 1024, mimeType: 'image/jpeg', type: 'image' };
const pdf = { uri: 'file:///statement.pdf', name: 'statement.pdf', size: max, mimeType: 'application/pdf' };

test('accepts photos and PDFs up to the exact size and count limits', () => {
  const files = validate([], [photo, pdf, { ...photo, name: 'another.jpg' }]);
  assert.equal(files.length, 3);
  assert.equal(files[1].size, max);
  assert.equal(validate([], [{ ...photo, mimeType: undefined }])[0].mimeType, 'image/jpeg');
});
test('rejects videos even when selected through an image or PDF picker', () => {
  for (const patch of [{ type: 'video' }, { type: 'livePhoto' }, { mimeType: 'video/mp4' }, { name: 'clip.MOV' }]) {
    assert.throws(() => validate([], [{ ...photo, ...patch }]), /Videos aren't supported/);
  }
});
test('rejects excess count cumulatively without changing the current draft', () => {
  const files = validate([], [photo, pdf]);
  assert.throws(() => validate(files, [photo, photo]), /up to 3/);
  assert.equal(files.length, 2);
});
test('rejects oversized, empty and unknown-size files without accepting a partial batch', () => {
  for (const size of [max + 1, 0, -1, undefined, NaN, Infinity]) {
    assert.throws(() => validate([], [photo, { ...pdf, size }]), /too large|check this file's size/);
  }
});
test('blocks unsupported formats and mismatched document types', () => {
  for (const patch of [{ mimeType: 'application/zip' }, { mimeType: 'image/svg+xml' }, { mimeType: 'application/pdf' }, { name: 'statement.pdf' }]) {
    assert.throws(() => validate([], [{ ...photo, ...patch }]), /Choose a JPG/);
  }
});
test('accepts a photo converted from HEIC to JPEG by the native picker', () => {
  assert.equal(validate([], [{ ...photo, name: 'IMG.HEIC' }])[0].mimeType, 'image/jpeg');
});
