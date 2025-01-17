import {
  html,
  preact,
  uid,
  pSeries,
  average,
  fetchWorkerScript,
  startTesting,
  latestLocalStorage,
  updateProgress,
  extractValidSuites,
  decodeState, updateDuration, updateRuns,
} from './utils.js'

import Tests from './components/tests.js'
import Archive from './components/archive.js'
import Results from './components/results.js'

const { render, useReducer, useEffect } = preact
const defaults = {
  started: false,
  dialog: true,
  aside: 'results',
  suites: extractValidSuites(localStorage),
  runs: 5,
  duration: 100,
  progress: 0,
  id: uid(),
  searchTerm: '',
  title: 'Finding numbers in an array of 1000',
  before: `const data = [...Array(1000).keys()]`,
  tests: [
    { name: 'Find item 100', code: 'data.find(x => x == 100)', ops: 3479502 },
    { name: 'Find item 200', code: 'data.find(x => x == 200)', ops: 2679182 },
    { name: 'Find item 400', code: 'data.find(x => x == 400)', ops: 1795812 },
    { name: 'Find item 800', code: 'data.find(x => x == 800)', ops: 1019190 },
  ],
}

const testParam = new URL(location.href).searchParams.get('test')

const init = testParam
  ? {
      ...defaults,
    ...decodeState(testParam),
  }
  : defaults

const reducer = (state, update) => ({
  ...state,
  ...(typeof update === 'function' ? update(state) : update),
})

const app = () => {
  const [state, dispatch] = useReducer(reducer, init)
  let { before, started, tests, runs, duration, title, id, suites, aside } = state
  window.appState = state;

  useEffect(() => {
    if (started) {
      if (Number(duration) <= 0) {
        dispatch(updateDuration(duration = defaults.duration));
      }
      if (Number(runs) <= 0) {
        dispatch(updateRuns(runs = defaults.runs));
      }
      setTimeout(() => {
        ;(async () => {
          const checkScript = await fetchWorkerScript(before, 'check')
          const runScript = await fetchWorkerScript(before, 'run')
          console.group('Test checks');
          const checkResults = await Promise.all(
            tests.map(
              (test) =>
                new Promise((resolve) => {
                  const worker = new Worker(checkScript, { type: 'module' })
                  worker.onmessage = (e) => {
                    resolve(e.data)
                    worker.terminate()
                  }
                  worker.postMessage([test])
                })
            )
          )
          console.groupEnd();

          const taskDurations = new Map(checkResults);
          const bench = (test) =>
            new Promise((resolve) => {
              const worker = new Worker(runScript, { type: 'module' })
              worker.onmessage = (e) => {
                resolve({ ...test, ops: e.data })
                worker.terminate()
              }
              worker.postMessage([test, duration]);
            })
          const tasks = () => () => {
            dispatch(updateProgress)
            return Promise.all(tests.filter(x => taskDurations.get(x) !== -1).map(bench))
          }
          pSeries(Array.from({ length: runs }, tasks)).then((results) => {
            dispatch({ tests: average(results.flat()), started: false });
          }
          )
        })()
      }, 300)
    }
  }, [started, before, tests])

  useEffect(() => {
    const x = JSON.stringify({
      id,
      title,
      before,
      runs,
      duration,
      tests: tests.map((item) => ({
        ...item,
        runs: [],
      })),
      updated: new Date(),
    })
    history.replaceState(null, null, `?test=${encodeURIComponent(LZUTF8.compress(x, { outputEncoding: 'Base64' }))}`)
    if (Object.fromEntries(suites)[id]) {
      localStorage.setItem(id, x)
      dispatch(latestLocalStorage)
    }
  }, [id, title, before, tests])

  useEffect(() => {
    const alt = (e) => (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)
    const hotKeys = (e) => {
      if (e.keyCode == 27) e.preventDefault() || dispatch({ aside: 'results' })
      if (alt(e) && e.keyCode == 13)
        e.preventDefault() || dispatch(startTesting)
      if (alt(e) && e.keyCode == 80)
        e.preventDefault() ||
          dispatch({ aside: aside === 'archive' ? 'results' : 'archive' })
    }
    addEventListener('keydown', hotKeys)
    return () => removeEventListener('keydown', hotKeys)
  }, [aside])

  return html`
    <main className="app">
      <${Tests} state=${state} dispatch=${dispatch} />
      <${Results} state=${state} dispatch=${dispatch} />
      <${Archive} state=${state} dispatch=${dispatch} />
    </main>
  `
}

render(html` <${app} /> `, document.body)
