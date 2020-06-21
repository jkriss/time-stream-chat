async function getMessage(streamUrl, before) {
  const url = before ? `${streamUrl}?before=${encodeURIComponent(before)}` : streamUrl
  const res = await fetch(url)
  if (res.ok) {
    let data
    let url
    const type = res.headers.get('content-type')
    if (!type) throw new Error('content-type header required')
    if (type.includes('text/plain')) {
      data = await res.text()
    } else if (type.includes('json')) {
      data = await res.json()
    } else if (type.includes('image')) {
      const url = URL.createObjectURL(await res.blob())
      data = `<img src="${url}">`
    }
    const date = res.headers.get('date')
    return { body: data, contentType: type, date, t: new Date(date), url }
  } else {
    console.warn(res.status)
  }
}

export async function getMessages(streamUrl) {
  const messages = []
  const max = 20
  let m
  let before
  do {
    m = await getMessage(streamUrl, before)
    if (m) {
      messages.push(m)
      before = m.date
    }
  } while (messages.length < max && m && m.date)
  return messages
}

export async function post({ url, body, contentType, secret }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': contentType,
      'authorization': `Bearer ${secret}`
    },
    body
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Error posting: ${error}`)
  }
}
