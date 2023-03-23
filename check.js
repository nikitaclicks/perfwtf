onmessage = async (e) => {
  const test = e.data[0]
  let time
  ;(async () => {
    try {
      time = await eval(`async () => {
        const start = performance.now();
        (() => {
          ${test.code};
        })();
        console.info(\`Test succeed ['${test.name}']\`);
        return performance.now() - start;
      }`)()
    } catch (ex) {
      console.error(`Test failed ['${test.name}']`, ex)
      time = -1
    }
    postMessage([test, time])
  })()
}
