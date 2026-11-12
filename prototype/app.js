'use strict';

// Local fixture only. No API, payment, reservation or message leaves this page.
const FLIGHTS = Object.freeze([
  {id:'BM 217', date:'12/11/2026', time:'21:00', seats:1},
  {id:'BM 201', date:'13/11/2026', time:'07:00', seats:9},
  {id:'BM 205', date:'13/11/2026', time:'09:30', seats:4}
]);
const SCENARIOS = {
  family:'Đổi sang chuyến BM 217 lúc 21:00 tối nay cho cả hai mẹ con nhé.',
  ambiguous:'Chuyến bị huỷ rồi à? Vậy đổi giúp mình sang sáng mai nhé.',
  refund:'Thôi huỷ hết đi, hoàn tiền cho mình.',
  child:'Cho bé Bình 5 tuổi bay một mình chuyến 07:00, tôi đi sau.',
  correction:'Bạn vừa đổi tôi sang 09:30 rồi! Tôi chọn 07:00 mà.',
  normal:'Đổi sang BM 201 lúc 07:00 cho cả hai mẹ con nhé.'
};
const SCENARIO_LABELS = {
  family:['CA CHÍNH · #6','BM 217 chỉ còn 1 chỗ','2 mẹ con · có bé 5 tuổi'],
  ambiguous:['MƠ HỒ · #5','“Đổi sang sáng mai”','Hỏi rõ giữa 07:00 và 09:30'],
  refund:['HOÀN VÉ · #7','“Huỷ hết, hoàn tiền”','Checkbox + nút gửi riêng'],
  child:['NGOÀI PHẠM VI · #8','Bé 5 tuổi bay một mình','Chuyển nhân viên hỗ trợ'],
  correction:['XỬ LÝ SỰ CỐ · #13','“Bạn vừa đổi nhầm rồi”','Dừng thao tác · bàn giao'],
  normal:['BÌNH THƯỜNG','Chọn rõ BM 201 · 07:00','Giữ 2 chỗ → khách duyệt']
};
const PIN_INFO = {
  1:['Căn cứ từ đặt chỗ','PAIR · Explainability & Trust','PNR TRV-7Q2K có 2 hành khách, trong đó bé Bình 5 tuổi. Giờ bay, số chỗ và lý do huỷ lấy từ fixture; không suy đoán thêm sơ đồ ghế hay giờ đến.','tra_cuu_dat_cho được tự làm vì là thao tác chỉ đọc.'],
  2:['Cho biết AI làm được gì','HAX G1 · Minh bạch khả năng','Badge Trợ lý AI và dòng giới hạn giúp khách biết AI chỉ tra cứu, giữ chỗ tạm; đổi vé và gửi hoàn chỉ xảy ra khi khách bấm duyệt.','AI không được biến một tin nhắn “đồng ý” thành giao dịch.'],
  3:['Không đủ chỗ thì không đổi','PAIR · Explainability & Trust','BM 217 còn 1 chỗ trong khi đặt chỗ có 2 khách. Thẻ bị khoá kèm lý do bằng chữ; không tự tách bé 5 tuổi khỏi người lớn.','Không gọi giữ hoặc đổi vé cho phương án thiếu chỗ.'],
  4:['Hỏi rõ thay vì tự chọn','HAX G10 · Thu hẹp phạm vi khi nghi ngờ','Có 2 chuyến sáng mai phù hợp: BM 201 lúc 07:00 và BM 205 lúc 09:30. Khách chọn rõ một chuyến trước khi AI giữ 2 chỗ.','Chọn chuyến mới chỉ giữ chỗ; chưa dùng lần đổi miễn phí.'],
  5:['Giữ chỗ tự động, đổi vé có duyệt','PAIR · Trust & User control','Đồng hồ thể hiện hạn giữ thực 20 phút. Thẻ xác nhận cho khách kiểm tra chuyến, ngày giờ, đủ 2 hành khách, chi phí 0đ và việc dùng lần đổi miễn phí.','Hết hạn thì chặn đổi, kiểm tra lại và chọn lại; không tự gia hạn khi vẽ lại giao diện.'],
  6:['Luôn có đường lui phù hợp','HAX G8/G9 · PAIR Graceful Failure','Khách có thể huỷ chỗ tạm, chọn lại hoặc gặp nhân viên trước khi đổi. Nếu đã đổi nhầm, trợ lý dừng tự động và bàn giao trạng thái thực tế.','Huỷ giữ chỗ không phải hoàn tác vé đã đổi. Tool nhả trước hạn là phần mở rộng mô phỏng.'],
  7:['Chặn hoàn vé ngoài ý muốn','PAIR · Errors & Graceful Failure','Nút gửi bị khoá đến khi khách tích checkbox hiểu hậu quả. Tích checkbox chưa gửi; cần bấm nút gửi riêng. Có lối quay lại các chuyến đổi miễn phí.','Gửi yêu cầu hoàn không thể huỷ; chat “Có” không thay thế bước duyệt.' ]
};
const TOOL_INFO = [
  ['tra_cuu_dat_cho','Tra cứu đặt chỗ','Tự làm','Chỉ đọc PNR, hành khách và số chỗ.'],
  ['giu_cho_chuyen_moi','Giữ 2 chỗ · 20 phút','Tự làm','Chỉ giữ chuyến đủ chỗ; chưa đổi vé.'],
  ['doi_chuyen_bay','Đổi chuyến bay','Khách duyệt','Xem đủ chuyến, hành khách và lần đổi miễn phí.'],
  ['soan_yeu_cau_hoan_ve','Soạn bản nháp hoàn','Tự làm · tách bước','Soạn thông tin; chưa gửi yêu cầu.'],
  ['gui_yeu_cau_hoan_ve','Gửi yêu cầu hoàn','Khách duyệt + checkbox','Tích hiểu hậu quả rồi bấm gửi; không thể rút lại.'],
  ['chuyen_nhan_vien','Chuyển nhân viên','Tự làm','Dừng tự động khi ngoài thẩm quyền / báo lỗi.'],
  ['huy_giu_cho','Nhả chỗ tạm','Tự làm · bổ sung','Chỉ nhả chỗ trước hạn; không hoàn tác đổi / hoàn.']
];
function renderDemoTools(){
  $('scenario-cards').innerHTML=Object.entries(SCENARIO_LABELS).map(([id,[tag,title,desc]])=>`<button class="scenario-card ${state.scenario===id?'selected':''}" data-action="scenario" data-scenario="${id}" aria-pressed="${state.scenario===id}"><span>${tag}</span><strong>${title}</strong><small>${desc}</small></button>`).join('');
  const latest=state.logs.at(-1);
  const waiting=state.view==='hold'?'doi_chuyen_bay':state.view==='refund'?'gui_yeu_cau_hoan_ve':null;
  $('tool-activity').textContent=latest?`Vừa mô phỏng: ${latest.tool} · ${latest.time}${waiting?' · Đang chờ khách duyệt, chưa thực hiện giao dịch.':''}`:'Chưa có thao tác.';
  $('tool-matrix').innerHTML=TOOL_INFO.map(([id,title,level,why])=>{
    const last=latest?.tool===id;
    const runs=state.logs.filter(x=>x.tool===id).length;
    return `<tr data-tool="${id}" class="${last?'tool-recent':''} ${waiting===id?'tool-waiting':''}"><td><strong>${title}</strong><code>${id}</code></td><td><span class="badge ${level.startsWith('Khách')?'approval-badge':'mint'}">${level}</span></td><td>${why}</td><td>${waiting===id?'<span class="tool-state waiting">Chờ khách duyệt</span>':last?'<span class="tool-state recent">Vừa mô phỏng</span>':runs?`Đã mô phỏng ${runs} lần`:'Chưa gọi'}</td></tr>`;
  }).join('');
}
function wireAnnotations(){document.querySelectorAll('span.annotation').forEach(span=>{const n=span.textContent.trim();const button=document.createElement('button');button.type='button';button.className='annotation';button.dataset.pin=n;button.textContent=n;button.setAttribute('aria-label',`Giải thích ${n}: ${PIN_INFO[n][0]}`);span.replaceWith(button);});}
let annotationOpener=null;
function explainPin(button){
  annotationOpener=button;
  const [title,principle,description,rule]=PIN_INFO[button.dataset.pin];
  document.querySelectorAll('.pin-highlight').forEach(el=>el.classList.remove('pin-highlight'));
  const target=button.closest('.flight-card,.notice,.confirm-card,.hold-banner,.refund-warning,.booking-card,.assistant-header,.flight-list,.action-title,.bottom-links')||button;
  target.classList.add('pin-highlight');
  $('annotation-title').textContent=`${button.dataset.pin}. ${title}`;
  $('annotation-description').textContent=description;
  $('annotation-rule').textContent=`${principle} — ${rule}`;
  $('annotation-dialog').showModal();
}
function newState(){return {view:'options', selected:null, deadline:null, consent:false, transaction:null, busy:false, messages:[], logs:[], reason:null, scenario:'family'};}
let state = newState();
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function log(tool, detail){state.logs.push({tool,detail,time:new Date().toLocaleTimeString('vi-VN',{hour12:false})});}
function say(text,role='assistant'){state.messages.push({text,role});}
function lookup(){log('tra_cuu_dat_cho','TỰ LÀM · TRV-7Q2K · 2 khách · BM 217: 1 chỗ, BM 201: 9, BM 205: 4');}
function remaining(){return state.deadline ? Math.max(0,Math.ceil((state.deadline-Date.now())/1000)) : 0;}
function timerText(){const s=remaining();return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function cancelHold(reason){if(state.deadline){log('huy_giu_cho','TỰ LÀM · '+reason+' · Tool bổ sung mô phỏng, chưa đổi vé');}state.deadline=null;state.selected=null;state.consent=false;}
function showOptions(){if(state.transaction||state.busy||state.view==='support')return;cancelHold('Khách quay lại chọn chuyến');state.view='options';state.reason=null;state.consent=false;}
function hold(id){if(state.transaction||state.busy||state.view==='support')return;const f=FLIGHTS.find(x=>x.id===id);if(!f)return;if(f.seats<2){state.view='options';state.reason='capacity';say('BM 217 chỉ còn 1 chỗ, trong khi đặt chỗ có 2 hành khách. Mình chưa đổi vé và không tự tách bé Bình khỏi người lớn. Bạn chọn một chuyến còn đủ 2 chỗ bên dưới nhé.');return;}cancelHold('Thay phương án giữ chỗ');state.selected=f;state.deadline=Date.now()+20*60*1000;state.consent=false;state.view='hold';state.reason=null;log('giu_cho_chuyen_moi',`TỰ LÀM · ${f.id} · ${f.date} ${f.time} · giữ 2 chỗ / 20 phút`);say(`Mình đã giữ tạm 2 chỗ trên ${f.id} lúc ${f.time} ngày ${f.date}. Chưa đổi vé. Bạn kiểm tra thông tin rồi bấm xác nhận khi sẵn sàng nhé.`);}
function openRefund(){if(state.transaction||state.busy||state.view==='support')return;state.view='refund';state.consent=false;state.reason=null;log('soan_yeu_cau_hoan_ve','TỰ LÀM · Chỉ tạo bản nháp cho 2 hành khách, chưa gửi');say('Mình hiểu bạn đang sốt ruột. Yêu cầu hoàn vé một khi đã gửi sẽ không thể huỷ. Bạn hãy đọc điều kiện bên dưới trước khi quyết định; mình chưa gửi yêu cầu nào.');}
function support(reason){if(state.busy||state.view==='support')return;cancelHold('Nhả chỗ khi bàn giao nhân viên');state.view='support';state.reason=reason;state.consent=false;log('chuyen_nhan_vien','TỰ LÀM · '+reason+' · Bàn giao PNR, lịch sử hội thoại và trạng thái giao dịch (mô phỏng)');say('Mình đã tạo bàn giao mô phỏng cho nhân viên kèm thông tin đặt chỗ và lịch sử trao đổi. Các thao tác tự động đã dừng. Chưa có nhân viên thật được thông báo, và mình không hứa có thể hoàn tác vé đã đổi hoặc yêu cầu hoàn đã gửi.');}
function expire(){if(state.view!=='hold'||state.busy||state.transaction)return;log('giu_cho_chuyen_moi','HẾT HẠN · 2 chỗ tự nhả sau 20 phút');state.deadline=null;state.selected=null;state.view='expired';say('Thời gian giữ chỗ đã hết. Mình chưa đổi vé; lần đổi miễn phí vẫn còn. Bạn cần kiểm tra lại chỗ trống và chọn lại chuyến trước khi xác nhận.');}
function confirmChange(){if(state.view!=='hold'||state.busy||state.transaction||!state.selected)return false;if(!remaining()){expire();render();return false;}lookup();if(state.selected.seats<2)return false;state.busy=true;const flight=state.selected;log('doi_chuyen_bay',`KHÁCH ĐÃ DUYỆT · ${flight.id} · ${flight.date} ${flight.time} · Nguyễn Minh An + Nguyễn Gia Bình · 0đ`);state.transaction='changed';state.deadline=null;state.consent=false;state.view='success';state.busy=false;say(`Đã đổi vé mô phỏng sang ${flight.id} lúc ${flight.time} ngày ${flight.date} cho cả hai hành khách. Lần đổi miễn phí đã được sử dụng.`);return true;}
function confirmRefund(){if(state.view!=='refund'||!state.consent||state.transaction||state.busy)return false;state.busy=true;cancelHold('Nhả chỗ khi khách duyệt gửi hoàn');log('gui_yeu_cau_hoan_ve','KHÁCH ĐÃ TÍCH CHECKBOX & BẤM GỬI · TRV-7Q2K · 2 hành khách');state.transaction='refunded';state.view='refunded';state.busy=false;say('Đã gửi yêu cầu hoàn vé mô phỏng cho cả hai hành khách. Đây là trạng thái đã gửi yêu cầu, chưa phải đã nhận tiền. Không thể huỷ yêu cầu qua trợ lý.');return true;}
function normalize(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');}
function handleMessage(text){if(!text.trim())return;say(text,'user');const s=normalize(text);
  if(state.view==='support'){say('Phiên này đang chờ nhân viên hỗ trợ (mô phỏng). Mình giữ nguyên trạng thái và không tự đổi hoặc gửi hoàn vé.');return;}
  if(state.transaction){if(/nham|doi y|huy|hoan tac/.test(s))support('Khách báo đổi nhầm / đổi ý sau giao dịch');else say('Đặt chỗ đã có giao dịch. Bạn có thể gặp nhân viên để được kiểm tra; mình không tự thực hiện thêm lần đổi hoặc hoàn nào.');return;}
  if(/mot minh|doi ten|gia bao|nhan vien hang|truong ca|bo qua|doi nham|ban vua doi/.test(s)){lookup();support(/mot minh/.test(s)?'Yêu cầu trẻ 5 tuổi bay một mình':/doi ten|gia bao/.test(s)?'Đổi tên ngoài thẩm quyền':'Yêu cầu ngoài thẩm quyền / báo đổi nhầm');return;}
  if(/boi thuong|den bu/.test(s)){lookup();say('Theo chính sách Bay Mẫu trong dữ liệu bài lab, chuyến bị huỷ do bão được đổi miễn phí một lần trong 48 giờ hoặc hoàn toàn bộ. Không có bồi thường tiền mặt do thời tiết.');return;}
  if(/hoan tien|hoan ve|huy het/.test(s)){lookup();openRefund();return;}
  if(/217|21[:h]?(00| gio)?/.test(s)){lookup();hold('BM 217');return;}
  if(/201|07:00|7 gio|07h/.test(s)){lookup();hold('BM 201');return;}
  if(/205|09:30|9h30|9 gio 30/.test(s)){lookup();hold('BM 205');return;}
  if(/sang mai/.test(s)){lookup();showOptions();say('Sáng mai còn hai chuyến đủ chỗ cho cả hai: BM 201 lúc 07:00 (9 chỗ) và BM 205 lúc 09:30 (4 chỗ). Bạn muốn chọn chuyến nào? Mình chưa đổi vé.');return;}
  if(/dong y|doi di|lam di|xac nhan|^co$|^u$|^ok/.test(s)){say(state.view==='refund'?'Mình chưa gửi yêu cầu hoàn. Tin nhắn không thay thế xác nhận: hãy đọc điều kiện, tích checkbox rồi bấm nút gửi nếu bạn quyết định hoàn.':state.view==='hold'?'Mình chưa đổi vé. Bạn kiểm tra chuyến và hai hành khách trong thẻ bên dưới, rồi bấm nút xác nhận đổi vé.':'Mình chưa xác định được chuyến bạn muốn đổi. Bạn chọn BM 201 lúc 07:00 hoặc BM 205 lúc 09:30 bên dưới nhé.');return;}
  lookup();say('Mình có thể giúp kiểm tra chuyến bị huỷ, giữ chỗ, đổi hoặc soạn yêu cầu hoàn vé. Bạn muốn chọn chuyến nào cho cả hai hành khách? Với yêu cầu khác, bạn có thể gặp nhân viên hỗ trợ.');
}
function reset(scenario='family'){state=newState();state.scenario=scenario;handleMessage(SCENARIOS[scenario]||SCENARIOS.family);render();}
function bottomLinks(){return `<div class="bottom-links"><button class="text-button" data-action="refund">Tôi muốn tìm hiểu hoàn vé</button><div><button class="text-button" data-action="support">Gặp nhân viên hỗ trợ</button> <span class="annotation">6</span></div></div>`;}
function flightOptions(){return `${state.reason==='capacity'?'<div class="notice error"><strong>BM 217 · 21:00 · Chỉ còn 1 chỗ <span class="annotation">3</span></strong>Không đủ cho 2 hành khách. Mình không tách bé 5 tuổi khỏi người lớn; vé chưa được đổi.</div>':''}<div class="action-title">Các chuyến bay thay thế <span class="annotation">4</span><span class="subtle">Hà Nội → TP. Hồ Chí Minh</span></div><div class="flight-list">${FLIGHTS.map(f=>`<article class="flight-card ${f.seats<2?'unavailable':''}"><div class="flight-top"><span>Bay Mẫu · ${f.id}</span><span>${f.date}</span></div><div class="flight-time">${f.time}<small>Giờ khởi hành · ${f.id==='BM 217'?'tối nay':'ngày mai'}</small></div><div class="flight-bottom"><span>Còn ${f.seats} chỗ</span><strong>${f.seats<2?'Cần 2 chỗ':'Đổi miễn phí'}</strong></div>${f.seats<2?'<div class="capacity-reason">Thiếu 1 chỗ · Không tự tách mẹ và bé</div><button class="button quiet" disabled aria-label="BM 217 không thể chọn: chỉ còn 1 chỗ, cần 2 chỗ">Không đủ chỗ cho cả hai</button>':`<button class="button primary" data-action="select" data-flight="${f.id}">Chọn & giữ 2 chỗ</button>`}</article>`).join('')}</div>${bottomLinks()}`;}
function holdCard(){const f=state.selected;return `<div class="hold-banner"><div><strong>✓ Đang giữ 2 chỗ · Chưa đổi vé</strong><br>Chỗ tự nhả khi hết thời gian <span class="annotation">5</span></div><div class="timer" id="timer" role="timer" aria-label="Thời gian giữ chỗ còn lại">${timerText()}</div></div><div class="confirm-card"><h3>Kiểm tra trước khi đổi vé</h3><div class="confirm-row"><span>Chuyến cũ · Đã huỷ</span><strong>BM 213 · 12/11 · 19:00</strong></div><div class="confirm-row"><span>Chuyến mới · HAN → SGN</span><strong>${f.id} · ${f.date} · ${f.time}</strong></div><div class="confirm-row"><span>Hành khách</span><strong>Nguyễn Minh An<br>Nguyễn Gia Bình · 5 tuổi</strong></div><div class="confirm-row"><span>Chi phí đổi theo dữ liệu giả</span><strong>0đ · Cho cả 2 hành khách</strong></div><div class="notice"><strong>Bạn sẽ dùng lần đổi miễn phí duy nhất trong 48 giờ.</strong>Đổi vé khó hoàn tác. Bạn hãy kiểm tra đúng chuyến và đủ cả hai hành khách trước khi xác nhận. <span class="annotation">5</span></div><button class="button primary full" data-action="confirm-change">Xác nhận đổi ${f.id} · ${f.time} · 2 khách · 0đ</button></div><div class="bottom-links"><button class="text-button" data-action="cancel">Huỷ giữ chỗ / chọn chuyến khác <span class="annotation">6</span></button><button class="text-button" data-action="support">Gặp nhân viên hỗ trợ</button></div><div class="quick-actions"><button class="button quiet" data-action="ambiguous-message">Thử nhắn: “Ừ, đổi đi”</button></div>`;}
function refundCard(){return `<div class="refund-warning"><h3>Trước khi gửi yêu cầu hoàn vé <span class="annotation">7</span></h3><p class="subtle">Bản nháp · TRV-7Q2K · Nguyễn Minh An & Nguyễn Gia Bình</p><ul><li><strong>Gửi rồi không thể huỷ yêu cầu.</strong></li><li>Bạn mất chỗ thay thế và quyền đổi miễn phí.</li><li>Hoàn toàn bộ theo chính sách Bay Mẫu. Dữ liệu chưa có giá vé nên chưa thể hiển thị số tiền cụ thể.</li><li>Về phương thức thanh toán ban đầu; 14–90 ngày theo giả định của spec nhóm. Trường hợp voucher cần nhân viên kiểm tra.</li></ul><button class="button primary full" data-action="options">Xem chuyến đổi miễn phí sáng mai</button><label class="checkbox-label"><input type="checkbox" id="refund-consent" ${state.consent?'checked':''}><span>Tôi hiểu yêu cầu hoàn vé gửi rồi không thể huỷ, mất quyền đổi miễn phí và thời gian hoàn có thể tới 90 ngày.</span></label><button class="button danger full" data-action="confirm-refund" ${state.consent?'':'disabled'}>Xác nhận gửi hoàn vé cho 2 hành khách</button></div><div class="bottom-links"><button class="text-button" data-action="support">Chuyển nhân viên tư vấn</button><span class="subtle">Chưa gửi yêu cầu hoàn vé</span></div>`;}
function endCard(title,body,icon='✓'){return `<div class="success-panel"><div class="success-icon">${icon}</div><h3>${title}</h3>${body}</div>`;}
function render(){if(typeof document==='undefined')return;
  $('conversation').innerHTML=state.messages.map(m=>`<div class="message ${m.role==='user'?'user':''}"><span class="message-label">${m.role==='user'?'BẠN':'AN TÂM · TRỢ LÝ AI'}</span>${esc(m.text)}</div>`).join('');
  const c=$('conversation');c.scrollTop=c.scrollHeight;
  let content='';
  if(state.view==='options')content=flightOptions();
  if(state.view==='hold')content=holdCard();
  if(state.view==='refund')content=refundCard();
  if(state.view==='expired')content=endCard('Chỗ giữ đã hết hạn','<p>Vé chưa đổi, lần đổi miễn phí vẫn còn.<br>Kiểm tra lại chỗ trống trước khi chọn phương án mới.</p><button class="button primary" data-action="refresh">Kiểm tra lại chuyến bay</button>','◷');
  if(state.view==='success'){const f=state.selected;content=endCard('Cả hai đã có hành trình mới',`<p><strong>${f.id} · ${f.date} · ${f.time}</strong><br>Hà Nội → TP. Hồ Chí Minh</p><p>Nguyễn Minh An & Nguyễn Gia Bình · Chi phí đổi 0đ<br>Đã sử dụng lần đổi miễn phí · Kết quả mô phỏng</p><button class="button secondary" data-action="support">Có vấn đề? Gặp nhân viên hỗ trợ</button><div class="quick-actions"><button class="button quiet" data-action="report-error">Thử ca: “Bạn vừa đổi nhầm rồi”</button></div>`);}
  if(state.view==='refunded')content=endCard('Đã gửi yêu cầu hoàn vé',`<p>TRV-7Q2K · 2 hành khách · Trạng thái mô phỏng</p><p>Chưa nhận tiền hoàn. Yêu cầu đã gửi không thể huỷ qua trợ lý.</p><button class="button secondary" data-action="support">Tôi đổi ý / cần nhân viên hỗ trợ</button>`);
  if(state.view==='support')content=endCard('Đã tạo bàn giao cho nhân viên',`<p><strong>Lý do:</strong> ${esc(state.reason)}</p><p>Thông tin bàn giao: TRV-7Q2K, 2 hành khách,<br>lịch sử trao đổi và trạng thái ${state.transaction==='changed'?'đã đổi vé':state.transaction==='refunded'?'đã gửi hoàn':'chưa đổi / chưa gửi hoàn'}.</p><p>Chưa có thông báo thật được gửi.<br>Không cam kết thời gian tiếp nhận hoặc khả năng hoàn tác.</p><button class="button secondary" data-action="reset">Bắt đầu lại demo</button>`,'♧');
  $('action-area').innerHTML=content;
  // Keep annotation controls outside transaction buttons to avoid nested actions.
  document.querySelectorAll('[data-action] > span.annotation').forEach(pin=>pin.parentElement.after(pin));
  renderDemoTools();
  wireAnnotations();
  $('audit-log').innerHTML=state.logs.map(l=>`<li><strong>${esc(l.tool)}</strong> · ${esc(l.time)}<br>${esc(l.detail)}</li>`).join('');
  $('log-count').textContent=`${state.logs.length} thao tác`;
  $('expire-button').disabled=state.view!=='hold';
  $('booking-status').textContent=state.transaction==='changed'?'Đã đổi vé (mô phỏng)':state.transaction==='refunded'?'Đã gửi hoàn (mô phỏng)':'Đã huỷ do bão';
  $('benefit-title').textContent=state.transaction==='changed'?'Đã dùng lần đổi miễn phí':state.transaction==='refunded'?'Đã chọn hoàn vé':'Còn 1 lần đổi miễn phí';
  ['step-1','step-2','step-3'].forEach((id,i)=>$(id).classList.toggle('active',i===(['success','refunded','support'].includes(state.view)?2:['hold','refund'].includes(state.view)?1:0)));
}
if(typeof document!=='undefined'){
  document.addEventListener('click',event=>{const pin=event.target.closest('[data-pin]');if(pin){explainPin(pin);return;}const button=event.target.closest('[data-action]');if(!button||button.disabled)return;const action=button.dataset.action;
    if(action==='reset')reset(state.scenario);
    if(action==='scenario')reset(button.dataset.scenario);
    if(action==='select')hold(button.dataset.flight);
    if(action==='refund')openRefund();
    if(action==='options'||action==='cancel'){showOptions();say('Bạn có thể chọn lại chuyến đủ chỗ cho cả hai. Chưa có yêu cầu hoàn nào được gửi.');}
    if(action==='support')support('Khách cần nhân viên tư vấn');
    if(action==='expire'){state.deadline=Date.now()-1;expire();}
    if(action==='refresh'){lookup();showOptions();say('Đã kiểm tra lại dữ liệu giả. BM 201 còn 9 chỗ và BM 205 còn 4 chỗ. Bạn chọn lại chuyến để giữ chỗ mới nhé.');}
    if(action==='confirm-change')confirmChange();
    if(action==='confirm-refund')confirmRefund();
    if(action==='ambiguous-message')handleMessage('Ừ, đổi đi');
    if(action==='report-error')handleMessage('Bạn vừa đổi nhầm rồi, tôi muốn chuyến khác.');
    render();
  });
  $('chat-form').addEventListener('submit',event=>{event.preventDefault();const input=$('message');handleMessage(input.value);input.value='';render();});
  $('close-annotation').addEventListener('click',()=>{$('annotation-dialog').close();if(annotationOpener?.isConnected)annotationOpener.focus({preventScroll:true});});
  $('annotation-dialog').addEventListener('close',()=>{if(annotationOpener?.isConnected)annotationOpener.focus({preventScroll:true});});
  document.addEventListener('change',event=>{if(event.target.id==='refund-consent'){state.consent=event.target.checked;render();$('refund-consent').focus();}});
  $('show-annotations').addEventListener('change',event=>document.body.classList.toggle('annotated',event.target.checked));
  setInterval(()=>{if(state.view==='hold'){if(!remaining()){expire();render();}else if($('timer'))$('timer').textContent=timerText();}},1000);
  reset();
}
if(typeof module!=='undefined')module.exports={FLIGHTS,reset,hold,openRefund,showOptions,handleMessage,confirmChange,confirmRefund,expire,support,remaining,getState:()=>state};
