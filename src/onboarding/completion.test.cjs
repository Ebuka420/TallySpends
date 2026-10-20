const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const { createCompletionAction }=require('./completion.ts');
test('Get Started immediately reports loading, ignores double taps and waits for completion before navigation',async()=>{
  const action=createCompletionAction(),events=[];let release;
  const pending=new Promise(resolve=>{release=resolve;});
  const finish=()=>action(()=>{events.push('register');return pending;},()=>events.push('navigate'),busy=>events.push(busy),message=>events.push(message));
  const first=finish();await finish();assert.deepEqual(events,[true,'register']);
  release();await first;assert.deepEqual(events,[true,'register','navigate',false]);
});
test('registration errors remain visible, do not navigate or bypass PIN, and allow retry',async()=>{
  const action=createCompletionAction(),events=[];
  await action(async()=>{throw Error('Network unavailable');},()=>events.push('navigate'),busy=>events.push(busy),message=>events.push(message));
  assert.deepEqual(events,[true,'Network unavailable',false]);
  await action(async()=>{},()=>events.push('navigate'),busy=>events.push(busy),message=>events.push(message));
  assert.deepEqual(events,[true,'Network unavailable',false,true,'navigate',false]);
});
