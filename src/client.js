const parseLinkHeader = require('parse-link-header')

async function getMessage(url) {
  const res = await fetch(url)
  if (res.ok) {
    let data
    let url
    const type = res.headers.get('content-type')
    const links = parseLinkHeader(res.headers.get('link'))
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
    return { body: data, contentType: type, date, t: new Date(date), url, links }
  } else {
    console.warn(res.status)
  }
}

export async function getMessages(streamUrl) {
  const messages = []
  const max = 20
  let m
  let url = streamUrl
  do {
    m = await getMessage(url)
    if (m) {
      // console.log("got message", m)
      // console.log("previous:", m.links.previous)
      messages.push(m)
      // url = null
      const urlStr = m.links.previous ? m.links.previous.url : null
      url = urlStr && new URL(urlStr, streamUrl)
    }
  } while (messages.length < max && m && url)
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
