import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const auditDir = resolve('browser-audit')
mkdirSync(auditDir, { recursive: true })

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms))
}

function findChrome() {
  const command = execFileSync('bash', ['-lc', 'command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser'], { encoding: 'utf8' }).trim()
  if (!command) throw new Error('No se encontró un navegador Chromium en el runner.')
  return command
}

async function waitForJson(url, attempts = 80) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
    } catch {
      // El puerto de DevTools todavía no está listo.
    }
    await sleep(100)
  }
  throw new Error(`DevTools no respondió en ${url}`)
}

function createCdpClient(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl)
  let sequence = 0
  const pending = new Map()
  const events = new Map()

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    if (message.id) {
      const request = pending.get(message.id)
      if (!request) return
      pending.delete(message.id)
      if (message.error) request.reject(new Error(message.error.message))
      else request.resolve(message.result)
      return
    }
    for (const listener of events.get(message.method) ?? []) listener(message.params)
  })

  const opened = new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true })
    socket.addEventListener('error', rejectOpen, { once: true })
  })

  return {
    async ready() { await opened },
    close() { socket.close() },
    on(method, listener) {
      const current = events.get(method) ?? []
      current.push(listener)
      events.set(method, current)
    },
    async send(method, params = {}) {
      await opened
      sequence += 1
      const id = sequence
      return new Promise((resolveRequest, rejectRequest) => {
        pending.set(id, { resolve: resolveRequest, reject: rejectRequest })
        socket.send(JSON.stringify({ id, method, params }))
      })
    },
  }
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    awaitPromise: true,
    expression,
    returnByValue: true,
  })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Error evaluando JavaScript en la página.')
  return result.result?.value
}

async function waitForReady(client) {
  for (let index = 0; index < 120; index += 1) {
    const ready = await evaluate(client, 'document.readyState === "complete" && Boolean(document.querySelector("#root")?.children.length)')
    if (ready) {
      await sleep(450)
      return
    }
    await sleep(100)
  }
  throw new Error('ElectroCMS no terminó de renderizar en el navegador de auditoría.')
}

async function setViewport(client, width, height, mobile = false) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  })
  await evaluate(client, 'window.dispatchEvent(new Event("resize")); true')
  await sleep(300)
}

async function capture(client, name) {
  const result = await client.send('Page.captureScreenshot', {
    captureBeyondViewport: true,
    format: 'png',
    fromSurface: true,
  })
  writeFileSync(resolve(auditDir, `${name}.png`), Buffer.from(result.data, 'base64'))
}

async function metrics(client, label, width, height) {
  return evaluate(client, `(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const targetRows = [...document.querySelectorAll('button,a,input,select,textarea,[role="tab"]')]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          name: (element.getAttribute('aria-label') || element.textContent || element.getAttribute('name') || element.tagName).trim().replace(/\\s+/g, ' ').slice(0, 100),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          tag: element.tagName,
        };
      });
    const offscreen = [...document.querySelectorAll('body *')]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          name: (element.getAttribute('aria-label') || element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 90),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          tag: element.tagName,
        };
      })
      .filter((row) => row.left < -3 || row.right > window.innerWidth + 3)
      .slice(0, 80);
    return {
      label: ${JSON.stringify(label)},
      viewport: { width: ${width}, height: ${height} },
      title: document.title,
      documentWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      documentHeight: document.documentElement.scrollHeight,
      severeSmallTargets: targetRows.filter((row) => row.width < 32 || row.height < 32).slice(0, 80),
      mobileTargetsUnder44: ${width < 768 ? 'targetRows.filter((row) => row.width < 44 || row.height < 44).slice(0, 80)' : '[]'},
      offscreen,
      visibleText: document.body.innerText.slice(0, 5000),
    };
  })()`)
}

async function clickNamed(client, name) {
  return evaluate(client, `(() => {
    const normalize = (value) => String(value || '').trim().replace(/\\s+/g, ' ').toLocaleLowerCase('es');
    const expected = normalize(${JSON.stringify(name)});
    const elements = [...document.querySelectorAll('button,[role="tab"],a')];
    const exact = elements.find((element) => normalize(element.getAttribute('aria-label') || element.textContent) === expected);
    const partial = exact || elements.find((element) => normalize(element.getAttribute('aria-label') || element.textContent).includes(expected));
    if (!partial) return false;
    partial.click();
    return true;
  })()`)
}

const chrome = findChrome()
const chromeProcess = spawn(chrome, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--remote-debugging-port=9222',
  '--user-data-dir=/tmp/electrocms-browser-audit',
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] })

const report = {
  generatedAt: new Date().toISOString(),
  console: [],
  exceptions: [],
  states: [],
}

try {
  const pages = await waitForJson('http://127.0.0.1:9222/json/list')
  const page = pages.find((candidate) => candidate.type === 'page')
  if (!page?.webSocketDebuggerUrl) throw new Error('DevTools no expuso una página auditable.')
  const client = createCdpClient(page.webSocketDebuggerUrl)
  await client.ready()
  client.on('Runtime.consoleAPICalled', (params) => {
    if (params.type === 'error' || params.type === 'warning') {
      report.console.push({
        type: params.type,
        text: params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '),
      })
    }
  })
  client.on('Runtime.exceptionThrown', (params) => {
    report.exceptions.push(params.exceptionDetails?.exception?.description ?? params.exceptionDetails?.text ?? 'Excepción sin descripción')
  })
  await client.send('Page.enable')
  await client.send('Runtime.enable')
  await client.send('Log.enable')
  await client.send('Page.navigate', { url: 'http://127.0.0.1:4173/' })
  await waitForReady(client)

  const viewports = [
    ['desktop-1440', 1440, 1000, false],
    ['desktop-1024', 1024, 768, false],
    ['tablet-768', 768, 1024, false],
    ['mobile-375', 375, 812, true],
    ['mobile-landscape', 812, 375, true],
  ]

  for (const [name, width, height, mobile] of viewports) {
    await setViewport(client, width, height, mobile)
    report.states.push(await metrics(client, name, width, height))
    await capture(client, name)
  }

  await setViewport(client, 1440, 1000, false)
  if (await clickNamed(client, 'Datos')) {
    await sleep(300)
    for (const tab of ['Tipos', 'Taxonomías', 'Campos', 'Registros y relaciones']) {
      if (await clickNamed(client, tab)) {
        await sleep(250)
        const slug = tab.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
        report.states.push(await metrics(client, `data-${slug}`, 1440, 1000))
        await capture(client, `data-${slug}`)
      }
    }
  } else {
    report.console.push({ type: 'warning', text: 'No se encontró el destino Datos en desktop.' })
  }

  if (await clickNamed(client, 'Inspector')) {
    await sleep(250)
    report.states.push(await metrics(client, 'inspector-desktop', 1440, 1000))
    await capture(client, 'inspector-desktop')
  }

  writeFileSync(resolve(auditDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  const horizontalOverflow = report.states.filter((state) => state.documentWidth > state.clientWidth + 2)
  console.log(JSON.stringify({
    states: report.states.length,
    horizontalOverflow: horizontalOverflow.map((state) => state.label),
    exceptions: report.exceptions,
    console: report.console,
  }, null, 2))
  client.close()
  if (report.exceptions.length > 0) process.exitCode = 1
} finally {
  chromeProcess.kill('SIGTERM')
}
