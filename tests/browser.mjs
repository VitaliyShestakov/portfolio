/* Minimal CDP client for local QA; Node >=22, Chrome with remote debugging. */
import { writeFile } from 'node:fs/promises';
export async function connect() {
  const endpoint = process.env.PORTFOLIO_DEBUG_URL ?? 'http://127.0.0.1:9223';
  const target = await (await fetch(`${endpoint}/json/new?about:blank`, { method: 'PUT' })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  const errors = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const callback = pending.get(message.id);
      if (!callback) return;
      pending.delete(message.id);
      clearTimeout(callback.timer);
      if (message.error) callback.reject(new Error(JSON.stringify(message.error)));
      else callback.resolve(message.result);
    } else {
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
      for (const callback of listeners.get(message.method) ?? []) callback(message.params);
    }
  };
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const requestId = ++id;
      const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`CDP timed out: ${method}`)); }, 15000);
      pending.set(requestId, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: requestId, method, params }));
    });
  }
  function once(method) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { listeners.delete(method); reject(new Error(`Event timed out: ${method}`)); }, 15000);
      const callback = data => { clearTimeout(timer); listeners.delete(method); resolve(data); };
      listeners.set(method, [callback]);
    });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  }
  await send('Page.enable');
  await send('Runtime.enable');
  return {
    send, evaluate, errors,
    async navigate(url) {
      const loaded = once('Page.loadEventFired');
      const navigation = await send('Page.navigate', { url });
      // A fragment-only navigation does not emit load; reload to exercise a fresh document.
      if (!navigation.loaderId && !navigation.errorText) await send('Page.reload');
      await loaded;
      if (navigation.errorText) throw new Error(navigation.errorText);
      await evaluate('document.fonts.ready.then(() => true)');
    },
    async viewport(width, height = 1000) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 641 });
    },
    async media(theme = 'dark', motion = 'reduce') {
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }, { name: 'prefers-reduced-motion', value: motion }] });
    },
    async screenshot(path, full = false) {
      const params = { format: 'png', captureBeyondViewport: full };
      if (full) {
        const { cssContentSize } = await send('Page.getLayoutMetrics');
        params.clip = { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 };
      }
      const { data } = await send('Page.captureScreenshot', params);
      await writeFile(path, Buffer.from(data, 'base64'));
    },
    async close() {
      await fetch(`${endpoint}/json/close/${target.id}`);
      socket.close();
    },
  };
}
