onmessage = async e => {
  const test = e.data[0]
  const duration = e.data[1]
  let result
  ;(async () => {
    try {
      result = await eval(`async () => {
        let opsReserved = 0;
        let end = performance.now() + duration;
        while (performance.now() < end) {
          (() => {
            ${test.code};
          })();
          opsReserved++;
        }
        return opsReserved;
      }`)()
    } catch (ex) {
      result = -1
    }
    postMessage(result === -1 ? result : (result / (duration / 1000)) << 0)
  })()
}
