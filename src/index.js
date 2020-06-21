import { format } from 'fecha'
import { getMessages, post } from './client'
import config from '../config.json'

console.log("config is", config)

const todayFormat = 'h:mma'
const notTodayFormat = 'MMM Do YYYY, h:mma'

function df(date) {
  const now = new Date()
  const isToday = now.getFullYear() === date.getFullYear() && now.getDay() === date.getDay()
  return format(date, isToday ? todayFormat : notTodayFormat)
}

function renderMessageList(messages) {
  let lastMessage
  const items = messages.reverse().map(m => {
    const h = `
    ${!lastMessage || lastMessage.source !== m.source ? `<div class="source">${m.source}</div>`: ''}
    <div class="message">
      <div class="content">${m.body}</div>
      <div class="timestamp">${df(m.t)}</div>
    </div>
    `
    lastMessage = m
    return h
  }).join('')
  return `<div class="message-list">${items}</div>`
}

async function loadAndRender(el) {
  const messageLists = await Promise.all(config.streams.map(async s => {
    const messages = await getMessages(s.url)
    messages.forEach(m => m.source = s.label)
    return messages
  }))
  const messages = [].concat(...messageLists).sort((a,b) => a.t > b.t ? -1 : 1)
  el.innerHTML = renderMessageList(messages)
}

window.addEventListener('DOMContentLoaded', (event) => {
  const feedEl = document.querySelector('#messages')
  const formEl = document.querySelector('#post')
  const messageInput = document.querySelector('#post [name=message]')

  formEl.addEventListener('submit', async (event) => {
    event.preventDefault()
    const m = messageInput.value
    console.log("posting a new message:", m)
    const targetStream = config.streams.find(s => s.secret)
    await post({
      url: targetStream.url,
      secret: targetStream.secret,
      contentType: 'text/plain',
      body: m
    })
    messageInput.value = ''
    loadAndRender(feedEl)
  })

  loadAndRender(feedEl)

  // auto refresh every 30 seconds
  // NOTE could be clever and only fetch new messages since last check
  setInterval(() => loadAndRender(feedEl), 30 * 1000)
})
