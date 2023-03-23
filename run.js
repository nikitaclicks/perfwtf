onmessage = async e => {
  const test_reserved = e.data[0]
  const duration_reserved = e.data[1]
  let result_reserved
  ;(async () => {
    try {
      result_reserved = await eval(`async () => {
        let ops_reserved = 0;
        let end_reserved = Date.now() + ${duration_reserved};
        while (Date.now() < end_reserved) {
          ${test_reserved.code};
          ops_reserved++;
        }
        return ops_reserved;
      }`)()
    } catch (e) {
      result_reserved = -1
    }
    postMessage(result_reserved === -1 ? result_reserved : (result_reserved * (1000 / duration_reserved)) << 0)
  })()
}
