// Meaningful state checks; no network or dependencies. Run: node prototype/verify.cjs
const assert = require('node:assert/strict');
const app = require('./app.js');
const s = app.getState;
const count = name => s().logs.filter(x=>x.tool===name).length;
const results=[];
function test(name,fn){fn();results.push(name);console.log('PASS '+name);}
test('BM 217 cannot hold or change two passengers',()=>{
  app.reset('family');assert.equal(s().view,'options');assert.equal(s().reason,'capacity');assert.equal(count('giu_cho_chuyen_moi'),0);assert.equal(count('doi_chuyen_bay'),0);assert.equal(s().transaction,null);
});
test('Ambiguous input and free text never execute a change',()=>{
  app.reset('ambiguous');app.handleMessage('Ừ, đổi đi');assert.equal(s().selected,null);assert.equal(count('doi_chuyen_bay'),0);
  app.hold('BM 205');app.handleMessage('Đồng ý');assert.equal(s().view,'hold');assert.equal(count('doi_chuyen_bay'),0);assert.equal(app.confirmChange(),true);assert.equal(s().selected.id,'BM 205');assert.equal(count('doi_chuyen_bay'),1);
});
test('Expired hold blocks confirmation and requires a fresh selection',()=>{
  app.reset('normal');s().deadline=Date.now()-1;assert.equal(app.confirmChange(),false);assert.equal(s().view,'expired');assert.equal(count('doi_chuyen_bay'),0);app.showOptions();app.hold('BM 201');assert.ok(app.remaining()>1190);assert.equal(app.confirmChange(),true);
});
test('Refund requires checkbox AND explicit submission; chat cannot submit',()=>{
  app.reset('refund');app.handleMessage('Có');assert.equal(app.confirmRefund(),false);assert.equal(count('gui_yeu_cau_hoan_ve'),0);s().consent=true;assert.equal(count('gui_yeu_cau_hoan_ve'),0);assert.equal(app.confirmRefund(),true);assert.equal(s().transaction,'refunded');assert.equal(app.confirmRefund(),false);assert.equal(count('gui_yeu_cau_hoan_ve'),1);
});
test('Leaving refund clears consent and never sends request',()=>{
  app.reset('refund');s().consent=true;app.showOptions();app.openRefund();assert.equal(s().consent,false);assert.equal(app.confirmRefund(),false);app.showOptions();app.hold('BM 205');assert.equal(count('gui_yeu_cau_hoan_ve'),0);
});
test('Child alone escalates without executing a change or hold',()=>{
  app.reset('child');assert.equal(s().view,'support');assert.equal(count('chuyen_nhan_vien'),1);app.handleMessage('Đổi BM 201');assert.equal(count('giu_cho_chuyen_moi'),0);assert.equal(app.confirmChange(),false);
});
test('Repeated clicks cannot execute change twice; correction escalates',()=>{
  app.reset('normal');assert.equal(app.confirmChange(),true);assert.equal(app.confirmChange(),false);assert.equal(count('doi_chuyen_bay'),1);app.handleMessage('Bạn vừa đổi nhầm rồi');assert.equal(s().view,'support');assert.equal(s().transaction,'changed');assert.equal(count('doi_chuyen_bay'),1);
});
test('Refund request prevents subsequent automatic change',()=>{
  app.reset('refund');s().consent=true;app.confirmRefund();app.handleMessage('Huỷ hoàn, đổi BM 201');app.hold('BM 201');assert.equal(s().view,'support');assert.equal(count('doi_chuyen_bay'),0);assert.equal(count('gui_yeu_cau_hoan_ve'),1);
});
console.log(`${results.length} checks passed.`);
