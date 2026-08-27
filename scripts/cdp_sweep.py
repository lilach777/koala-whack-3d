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
    results = []
    ident = 10
    for y in range(160, 301, 20):
        command(ws, "Page.navigate", {"url": "http://127.0.0.1:3000/?demo"}, ident); ident += 1
        command(ws, "Runtime.evaluate", {"expression": "new Promise(resolve => setTimeout(resolve, 500))", "awaitPromise": True}, ident); ident += 1
        expression = f"(() => {{ const canvas = document.querySelector('canvas'); const r = canvas.getBoundingClientRect(); const x = r.left + r.width/2; const y = r.top + {y}; const ev = new PointerEvent('pointerdown', {{bubbles:true, cancelable:true, clientX:x, clientY:y, button:0, buttons:1, pointerType:'mouse'}}); canvas.dispatchEvent(ev); return {{x,y,score:document.body.innerText.match(/SCORE\\s+\\d+/)?.[0] || 'unknown'}}; }})()"
        result = command(ws, "Runtime.evaluate", {"expression": expression, "returnByValue": True}, ident); ident += 1
        results.append(result.get("result", {}).get("result", {}).get("value"))
    print(json.dumps(results))
    ws.close()


if __name__ == '__main__':
    main()
