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

async function waitForJson(url, chromeProcess, attempts = 240) {
  for (let index = 0; index < attempts; index += 1) {
    if (chromeProcess.exitCode !== null) throw new Error(`Chrome terminó antes de exponer DevTools con código ${chromeProcess.exitCode}.`)
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

async function waitForSelector(client, selector, attempts = 60) {
  for (let index = 0; index < attempts; index += 1) {
    const found = await evaluate(client, `Boolean(document.querySelector(${JSON.stringify(selector)}))`)
    if (found) return
    await sleep(100)
  }
  throw new Error(`No apareció el selector esperado: ${selector}`)
}

async function setViewport(client, width, height, touch = false) {
  await client.send('Emulation.setTouchEmulationEnabled', {
    enabled: touch,
    maxTouchPoints: touch ? 5 : 1,
  })
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: touch,
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

async function metrics(client, label, width, height, touch = false) {
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
        const name = (element.getAttribute('aria-label') || element.textContent || element.getAttribute('name') || element.tagName).trim().replace(/\\s+/g, ' ').slice(0, 100);
        let effectiveWidth = rect.width;
        let effectiveHeight = rect.height;
        if (name.startsWith('Abrir menú contextual de ')) {
          effectiveWidth = Math.max(effectiveWidth, 44);
          effectiveHeight = Math.max(effectiveHeight, 44);
        }
        if (name.startsWith('Redimensionar ') && (rect.width >= 24 || rect.height >= 24)) {
          effectiveWidth = Math.max(effectiveWidth, 44);
          effectiveHeight = Math.max(effectiveHeight, 44);
        }
        if (element instanceof HTMLInputElement && ['checkbox', 'radio'].includes(element.type)) {
          const labelElement = element.closest('label');
          const labelRect = labelElement?.getBoundingClientRect();
          if (labelRect) {
            effectiveWidth = Math.max(effectiveWidth, labelRect.width);
            effectiveHeight = Math.max(effectiveHeight, labelRect.height);
          }
        }
        return {
          name,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          effectiveWidth: Math.round(effectiveWidth),
          effectiveHeight: Math.round(effectiveHeight),
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
      viewport: { width: ${width}, height: ${height}, touch: ${touch} },
      title: document.title,
      documentWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      documentHeight: document.documentElement.scrollHeight,
      severeSmallTargets: targetRows.filter((row) => row.width < 32 || row.height < 32).slice(0, 80),
      mobileTargetsUnder44: ${touch ? 'targetRows.filter((row) => row.effectiveWidth < 44 || row.effectiveHeight < 44).slice(0, 80)' : '[]'},
      offscreen,
      visibleText: document.body.innerText.slice(0, 5000),
      primaryModule: document.querySelector('[data-primary-module]')?.getAttribute('data-primary-module') ?? null,
    };
  })()`)
}

async function clickNamed(client, name) {
  return evaluate(client, `(() => {
    const normalize = (value) => String(value || '').trim().replace(/\\s+/g, ' ').toLocaleLowerCase('es');
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const expected = normalize(${JSON.stringify(name)});
    const elements = [...document.querySelectorAll('button,[role="tab"],a')].filter(visible);
    const exact = elements.find((element) => normalize(element.getAttribute('aria-label') || element.textContent) === expected);
    const partial = exact || elements.find((element) => normalize(element.getAttribute('aria-label') || element.textContent).includes(expected));
    if (!partial) return false;
    partial.click();
    return true;
  })()`)
}

async function requireClickNamed(client, name) {
  if (!await clickNamed(client, name)) throw new Error(`No se encontró un control visible llamado: ${name}`)
  await sleep(250)
}

async function assertEditorLibraryScope(client) {
  const result = await evaluate(client, `(() => {
    const library = document.querySelector('.library-panel');
    if (!library) return { present: false, tabs: [] };
    return {
      present: true,
      tabs: [...library.querySelectorAll('[role="tab"]')].map((tab) => (tab.getAttribute('aria-label') || tab.textContent || '').trim()),
    };
  })()`)
  if (!result.present) throw new Error('No se encontró el panel contextual Capas/Widgets.')
  const unexpected = result.tabs.filter((tab) => !['Capas', 'Widgets'].includes(tab))
  if (unexpected.length > 0) throw new Error(`Capas/Widgets contiene módulos globales inesperados: ${unexpected.join(', ')}`)
}

const report = {
  generatedAt: new Date().toISOString(),
  console: [],
  exceptions: [],
  states: [],
}

const chrome = findChrome()
let chromeStderr = ''
const chromeProcess = spawn(chrome, [
  '--headless=new',
  '--no-sandbox',
  '--no-first-run',
  '--disable-extensions',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=9222',
  '--user-data-dir=/tmp/electrocms-browser-audit',
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] })

chromeProcess.stderr?.on('data', (chunk) => {
  chromeStderr = `${chromeStderr}${String(chunk)}`.slice(-12_000)
})

try {
  const pages = await waitForJson('http://127.0.0.1:9222/json/list', chromeProcess)
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

  for (const [name, width, height, touch] of viewports) {
    await setViewport(client, width, height, touch)
    report.states.push(await metrics(client, name, width, height, touch))
    await capture(client, name)
  }

  // Desktop: los módulos globales se alcanzan desde el sidebar, nunca desde Capas.
  await setViewport(client, 1440, 1000, false)
  await assertEditorLibraryScope(client)
  await requireClickNamed(client, 'Contenido')
  await waitForSelector(client, '[data-primary-module="content"]')
  report.states.push(await metrics(client, 'cms-desktop', 1440, 1000, false))
  await capture(client, 'cms-desktop')

  for (const tab of ['Tipos', 'Taxonomías', 'Campos', 'Registros y relaciones']) {
    await requireClickNamed(client, tab)
    const slug = tab.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
    report.states.push(await metrics(client, `cms-${slug}`, 1440, 1000, false))
    await capture(client, `cms-${slug}`)
  }

  await requireClickNamed(client, 'Volver al Editor')
  await waitForSelector(client, '.library-panel')
  await assertEditorLibraryScope(client)

  await requireClickNamed(client, 'Documentos')
  await waitForSelector(client, '[data-primary-module="documents"]')
  report.states.push(await metrics(client, 'documents-desktop', 1440, 1000, false))
  await capture(client, 'documents-desktop')
  await requireClickNamed(client, 'Volver al Editor')

  await requireClickNamed(client, 'Diseño')
  await waitForSelector(client, '[data-primary-module="design"]')
  report.states.push(await metrics(client, 'design-desktop', 1440, 1000, false))
  await capture(client, 'design-desktop')
  await requireClickNamed(client, 'Volver al Editor')

  // Móvil: los módulos globales se alcanzan mediante Más, manteniendo cinco destinos.
  await setViewport(client, 375, 812, true)
  await requireClickNamed(client, 'Más')
  await waitForSelector(client, '[aria-label="Más módulos"]')
  report.states.push(await metrics(client, 'mobile-more', 375, 812, true))
  await capture(client, 'mobile-more')
  await requireClickNamed(client, 'Contenido')
  await waitForSelector(client, '[data-primary-module="content"]')
  report.states.push(await metrics(client, 'cms-mobile', 375, 812, true))
  await capture(client, 'cms-mobile')
  await requireClickNamed(client, 'Canvas')
  await waitForSelector(client, '#editor-canvas')

  writeFileSync(resolve(auditDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  const horizontalOverflow = report.states.filter((state) => state.documentWidth > state.clientWidth + 2)
  const architectureErrors = report.states.filter((state) => state.label.startsWith('cms-') && state.primaryModule !== 'content')
  console.log(JSON.stringify({
    states: report.states.length,
    horizontalOverflow: horizontalOverflow.map((state) => state.label),
    touchTargetsUnder44: report.states.filter((state) => state.viewport.touch).map((state) => ({ label: state.label, count: state.mobileTargetsUnder44.length })),
    architectureErrors: architectureErrors.map((state) => state.label),
    exceptions: report.exceptions,
    console: report.console,
  }, null, 2))
  client.close()
  if (report.exceptions.length > 0 || horizontalOverflow.length > 0 || architectureErrors.length > 0) process.exitCode = 1
} catch (error) {
  report.infrastructureError = error instanceof Error ? error.message : String(error)
  report.chromeStderr = chromeStderr
  writeFileSync(resolve(auditDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  throw error
} finally {
  chromeProcess.kill('SIGTERM')
}
