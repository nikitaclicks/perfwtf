onmessage = async (e) => {
  const test_reserved = e.data[0]
  let time_reserved
  ;(async () => {
    try {
      time_reserved = await eval(`async () => {
        const start_reserved = Date.now()
        for (let i_reserved = 0; i_reserved < 10; i_reserved++) {
          ${test_reserved.code};
        }
        return Date.now() - start_reserved || 1
      }`)()
    } catch (ex) {
      time_reserved = -1
      console.error('Test Error:', ex)
    }
    postMessage(time_reserved)
  })()
}
