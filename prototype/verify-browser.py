"""Browser checks and screenshots. Requires local Chrome and Python websockets.
Run: python prototype/verify-browser.py
"""
import base64
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.request
from websockets.sync.client import connect

ROOT = Path(__file__).resolve().parent
chrome = os.environ.get('CHROME_PATH', 'C:/Program Files/Google/Chrome/Application/chrome.exe')
profile = tempfile.mkdtemp(prefix='an-tam-qa-')
browser = subprocess.Popen([chrome, '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=0', f'--user-data-dir={profile}',
    'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    creationflags=subprocess.CREATE_NO_WINDOW)
socket = None
seq = 0
errors = []
try:
    port_file = Path(profile) / 'DevToolsActivePort'
    for _ in range(100):
        if port_file.exists():
            break
        time.sleep(.1)
    port = port_file.read_text().splitlines()[0]
    with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list') as response:
        target = next(x for x in json.load(response) if x['type'] == 'page')
    socket = connect(target['webSocketDebuggerUrl'], open_timeout=10, max_size=20_000_000, proxy=None)
    def send(method, params=None):
        global seq
        seq += 1
        current = seq
        socket.send(json.dumps({'id': current, 'method': method, 'params': params or {}}))
        while True:
            data = json.loads(socket.recv(timeout=10))
            if data.get('method') == 'Runtime.exceptionThrown':
                errors.append(data['params']['exceptionDetails'])
            if data.get('id') == current:
                assert 'error' not in data, data
                return data.get('result', {})
    def evaluate(expression):
        result = send('Runtime.evaluate', {'expression': expression, 'returnByValue': True, 'awaitPromise': True})
        assert 'exceptionDetails' not in result, result
        return result['result'].get('value')
    def click(selector):
        evaluate('(()=>{const e=document.querySelector('+json.dumps(selector)+');if(!e||e.disabled)throw Error("Missing/disabled button");e.click()})()')
    def scenario(value):
        click('[data-action="scenario"][data-scenario="'+value+'"]')
    def screenshot(name):
        result = send('Page.captureScreenshot', {'format':'png', 'captureBeyondViewport':True})
        (ROOT / 'screenshots').mkdir(exist_ok=True)
        (ROOT / 'screenshots' / name).write_bytes(base64.b64decode(result['data']))
    send('Runtime.enable')
    send('Page.enable')
    send('Emulation.setDeviceMetricsOverride', {'width':1440,'height':1250,'deviceScaleFactor':1,'mobile':False})
    send('Page.navigate', {'url': (ROOT / 'index.html').as_uri()})
    for _ in range(50):
        time.sleep(.1)
        if evaluate('typeof state!=="undefined" && !!document.querySelector("[data-action=select]")'):
            break
    assert evaluate('state.reason') == 'capacity'
    assert evaluate('document.querySelectorAll("[data-action=select]").length') == 2
    assert evaluate('document.querySelectorAll(".scenario-card").length') == 6
    assert evaluate('document.querySelector(".scenario-card[aria-pressed=true]").dataset.scenario') == 'family'
    assert evaluate('document.querySelector(".unavailable button").disabled')
    assert evaluate('document.querySelectorAll(".flight-card").length') == 3
    click('#show-annotations')
    click('[data-pin="3"]')
    assert evaluate('document.getElementById("annotation-dialog").open')
    assert 'Không đủ chỗ' in evaluate('document.getElementById("annotation-title").textContent')
    assert evaluate('state.transaction') is None
    click('#close-annotation')
    assert evaluate('document.activeElement.dataset.pin') == '3'
    evaluate('document.querySelectorAll(".pin-highlight").forEach(e=>e.classList.remove("pin-highlight"))')
    screenshot('01-family-options.png')
    click('[data-flight="BM 205"]')
    assert evaluate('document.querySelector("[data-tool=giu_cho_chuyen_moi]").classList.contains("tool-recent")')
    assert evaluate('document.querySelector("[data-tool=doi_chuyen_bay] .tool-state").textContent') == 'Chờ khách duyệt'
    deadline = evaluate('state.deadline')
    click('[data-pin="5"]')
    click('#close-annotation')
    assert evaluate('state.deadline') == deadline
    assert evaluate('state.transaction') is None
    assert evaluate('document.getElementById("timer").textContent') in ['20:00','19:59']
    click('[data-action="ambiguous-message"]')
    assert evaluate('state.transaction') is None
    click('[data-action="expire"]')
    assert evaluate('document.querySelector("[data-action=confirm-change]")===null')
    click('[data-action="refresh"]')
    click('[data-flight="BM 205"]')
    click('[data-action="confirm-change"]')
    assert evaluate('state.transaction') == 'changed'
    click('[data-action="report-error"]')
    assert evaluate('state.view') == 'support'
    scenario('ambiguous')
    assert evaluate('state.selected') is None
    click('[data-flight="BM 201"]')
    scenario('refund')
    assert evaluate('document.querySelector(".scenario-card[aria-pressed=true]").dataset.scenario') == 'refund'
    assert evaluate('document.querySelector("[data-tool=gui_yeu_cau_hoan_ve] .tool-state").textContent') == 'Chờ khách duyệt'
    click('[data-pin="7"]')
    click('#close-annotation')
    assert not evaluate('document.getElementById("refund-consent").checked')
    assert evaluate('document.querySelector("[data-action=confirm-refund]").disabled')
    screenshot('02-refund-gate.png')
    evaluate('document.getElementById("message").value="Có";document.getElementById("chat-form").requestSubmit()')
    assert evaluate('state.transaction') is None
    click('#refund-consent')
    assert not evaluate('document.querySelector("[data-action=confirm-refund]").disabled')
    click('[data-action="confirm-refund"]')
    assert evaluate('state.view') == 'refunded'
    assert evaluate('document.querySelector("[data-tool=gui_yeu_cau_hoan_ve]").classList.contains("tool-recent")')
    scenario('child')
    assert evaluate('state.view') == 'support'
    # Stage 6 acceptance: apply the same 3 criteria to both highest-cost cases.
    def tool_count(name):
        return evaluate('state.logs.filter(x=>x.tool==='+json.dumps(name)+').length')
    scenario('ambiguous')
    evaluate('document.getElementById("message").value="Ừ, đổi đi";document.getElementById("chat-form").requestSubmit()')
    assert evaluate('state.selected') is None
    assert tool_count('doi_chuyen_bay') == tool_count('gui_yeu_cau_hoan_ve') == 0
    click('[data-flight="BM 205"]')
    text = evaluate('document.querySelector(".confirm-card").textContent')
    assert all(x in text for x in ['BM 205','13/11/2026','09:30','Nguyễn Minh An','Nguyễn Gia Bình','0đ','lần đổi miễn phí duy nhất'])
    assert 'Chưa đổi vé' in evaluate('document.querySelector(".hold-banner").textContent')
    click('[data-action="cancel"]')
    assert evaluate('state.deadline') is None
    assert tool_count('doi_chuyen_bay') == 0
    click('[data-flight="BM 205"]')
    click('[data-action="confirm-change"]')
    assert tool_count('doi_chuyen_bay') == 1
    assert evaluate('document.querySelector("[data-action=confirm-change]")===null')
    click('[data-action="report-error"]')
    assert evaluate('state.view') == 'support'
    assert tool_count('doi_chuyen_bay') == 1
    print('ACCEPTANCE #5: C1 PASS (explicit approval); C2 PASS (context and consequences); C3 PASS (cancel, single outcome, escalation).')
    scenario('refund')
    text = evaluate('document.querySelector(".refund-warning").textContent')
    assert all(x in text for x in ['TRV-7Q2K','Nguyễn Minh An','Nguyễn Gia Bình','không thể huỷ','phương thức thanh toán ban đầu','90 ngày','mất chỗ','quyền đổi miễn phí'])
    evaluate('document.getElementById("message").value="Đồng ý";document.getElementById("chat-form").requestSubmit()')
    assert tool_count('gui_yeu_cau_hoan_ve') == 0
    click('#refund-consent')
    assert tool_count('gui_yeu_cau_hoan_ve') == 0
    click('[data-action="options"]')
    assert tool_count('gui_yeu_cau_hoan_ve') == 0
    click('[data-action="refund"]')
    assert not evaluate('document.getElementById("refund-consent").checked')
    assert evaluate('document.querySelector("[data-action=confirm-refund]").disabled')
    click('#refund-consent')
    click('[data-action="confirm-refund"]')
    assert tool_count('gui_yeu_cau_hoan_ve') == 1
    assert evaluate('document.querySelector("[data-action=confirm-refund]")===null')
    click('[data-action="support"]')
    assert evaluate('state.view') == 'support'
    assert tool_count('gui_yeu_cau_hoan_ve') == 1 and tool_count('doi_chuyen_bay') == 0
    print('ACCEPTANCE #7: C1 PASS (checkbox AND submit); C2 PASS (context and consequences); C3 PASS (back, consent reset, single outcome, escalation).')
    send('Emulation.setDeviceMetricsOverride', {'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
    for value in ['family','normal','refund','child']:
        scenario(value)
        assert evaluate('document.documentElement.scrollWidth<=window.innerWidth'), value
        evaluate('document.getElementById("tool-panel").open=true')
        assert evaluate('document.documentElement.scrollWidth<=window.innerWidth'), 'Open tool matrix: '+value
        evaluate('document.getElementById("tool-panel").open=false')
    scenario('family')
    screenshot('mobile-family.png')
    assert not errors, errors
    print('PASS browser: 6 scenario cards, locked BM 217, interactive annotations and focus restoration, live tool matrix, capacity, ambiguous input, hold expiry, refresh, change, correction, refund gate, child escalation, 4 mobile layouts including open matrix; 0 runtime errors.')
    print('Screenshots saved to prototype/screenshots/.')
finally:
    if socket:
        socket.close()
    browser.terminate()
