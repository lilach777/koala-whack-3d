import json
import time
import urllib.request
import websocket


def command(ws, method, params, ident):
    ws.send(json.dumps({"id": ident, "method": method, "params": params}))
    while True:
        response = json.loads(ws.recv())
        if response.get("id") == ident:
            return response


def main():
    tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9223/json"))
    page = next(tab for tab in tabs if tab.get("type") == "page")
    ws = websocket.create_connection(page["webSocketDebuggerUrl"], suppress_origin=True)
    command(ws, "Runtime.enable", {}, 1)
    command(ws, "Page.enable", {}, 2)
    command(ws, "Page.navigate", {"url": "http://127.0.0.1:3000/?demo=qa"}, 3)
    command(ws, "Runtime.evaluate", {"expression": "new Promise(resolve => setTimeout(resolve, 3000))", "awaitPromise": True}, 4)
    qa = command(ws, "Runtime.evaluate", {"expression": "(() => { const q = window.__koalaQA; const targets = q?.targets?.() || []; const visible = targets.find(t => t.phase === 'visible'); return {targets, visible, point: visible ? q.screenForId(visible.id) : null, pick: visible ? q.pick(q.screenForId(visible.id).x, q.screenForId(visible.id).y) : null}; })()", "returnByValue": True}, 5)
    before = command(ws, "Runtime.evaluate", {"expression": "document.body.innerText.match(/SCORE\\s+\\d+/)?.[0] || 'unknown'", "returnByValue": True}, 6)
    click = "(() => { const canvas = document.querySelector('canvas'); const q = window.__koalaQA; const visible = q.targets().find(t => t.phase === 'visible'); const point = q.screenForId(visible.id); const ev = new PointerEvent('pointerdown', {bubbles:true, cancelable:true, clientX:point.x, clientY:point.y, button:0, buttons:1, pointerType:'mouse'}); canvas.dispatchEvent(ev); return {point, pick:q.pick(point.x, point.y)}; })()"
    point = command(ws, "Runtime.evaluate", {"expression": click, "returnByValue": True}, 6)
    command(ws, "Runtime.evaluate", {"expression": "new Promise(resolve => setTimeout(resolve, 250))", "awaitPromise": True}, 7)
    after = command(ws, "Runtime.evaluate", {"expression": "document.body.innerText.match(/SCORE\\s+\\d+/)?.[0] || 'unknown'", "returnByValue": True}, 8)
    print(json.dumps({"qa": qa.get("result", {}).get("result", {}).get("value"), "before": before.get("result", {}).get("result", {}).get("value"), "point": point.get("result", {}).get("result", {}).get("value"), "after": after.get("result", {}).get("result", {}).get("value")}))
    ws.close()


if __name__ == '__main__':
    main()
