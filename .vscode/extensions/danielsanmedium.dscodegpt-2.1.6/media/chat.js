/* eslint-disable no-undef */
(function () {
  const vscode = acquireVsCodeApi()
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: function (code, _lang) {
      return hljs.highlightAuto(code).value
    },
    langPrefix: 'hljs language-',
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false,
    smartypants: false,
    xhtml: false
  })

  const scrollToBottom = (container, { behavior = 'auto' } = {}) => {
    container.scrollTop = container.scrollHeight
    container.style.scroll = behavior
  }

  // TODO: Cambiar a codeicons
  // const clipboardSvg = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>'

  // TODO: cambiar a codeicons
  // const insertSvg = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" /></svg>'

  const userSvg = '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M16 7.992C16 3.58 12.416 0 8 0S0 3.58 0 7.992c0 2.43 1.104 4.62 2.832 6.09.016.016.032.016.032.032.144.112.288.224.448.336.08.048.144.111.224.175A7.98 7.98 0 0 0 8.016 16a7.98 7.98 0 0 0 4.48-1.375c.08-.048.144-.111.224-.16.144-.111.304-.223.448-.335.016-.016.032-.016.032-.032 1.696-1.487 2.8-3.676 2.8-6.106zm-8 7.001c-1.504 0-2.88-.48-4.016-1.279.016-.128.048-.255.08-.383a4.17 4.17 0 0 1 .416-.991c.176-.304.384-.576.64-.816.24-.24.528-.463.816-.639.304-.176.624-.304.976-.4A4.15 4.15 0 0 1 8 10.342a4.185 4.185 0 0 1 2.928 1.166c.368.368.656.8.864 1.295.112.288.192.592.24.911A7.03 7.03 0 0 1 8 14.993zm-2.448-7.4a2.49 2.49 0 0 1-.208-1.024c0-.351.064-.703.208-1.023.144-.32.336-.607.576-.847.24-.24.528-.431.848-.575.32-.144.672-.208 1.024-.208.368 0 .704.064 1.024.208.32.144.608.336.848.575.24.24.432.528.576.847.144.32.208.672.208 1.023 0 .368-.064.704-.208 1.023a2.84 2.84 0 0 1-.576.848 2.84 2.84 0 0 1-.848.575 2.715 2.715 0 0 1-2.064 0 2.84 2.84 0 0 1-.848-.575 2.526 2.526 0 0 1-.56-.848zm7.424 5.306c0-.032-.016-.048-.016-.08a5.22 5.22 0 0 0-.688-1.406 4.883 4.883 0 0 0-1.088-1.135 5.207 5.207 0 0 0-1.04-.608 2.82 2.82 0 0 0 .464-.383 4.2 4.2 0 0 0 .624-.784 3.624 3.624 0 0 0 .528-1.934 3.71 3.71 0 0 0-.288-1.47 3.799 3.799 0 0 0-.816-1.199 3.845 3.845 0 0 0-1.2-.8 3.72 3.72 0 0 0-1.472-.287 3.72 3.72 0 0 0-1.472.288 3.631 3.631 0 0 0-1.2.815 3.84 3.84 0 0 0-.8 1.199 3.71 3.71 0 0 0-.288 1.47c0 .352.048.688.144 1.007.096.336.224.64.4.927.16.288.384.544.624.784.144.144.304.271.48.383a5.12 5.12 0 0 0-1.04.624c-.416.32-.784.703-1.088 1.119a4.999 4.999 0 0 0-.688 1.406c-.016.032-.016.064-.016.08C1.776 11.636.992 9.91.992 7.992.992 4.14 4.144.991 8 .991s7.008 3.149 7.008 7.001a6.96 6.96 0 0 1-2.032 4.907z"/></svg>'
  const botSvg = '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.48 4h4l.5.5v2.03h.52l.5.5V8l-.5.5h-.52v3l-.5.5H9.36l-2.5 2.76L6 14.4V12H3.5l-.5-.64V8.5h-.5L2 8v-.97l.5-.5H3V4.36L3.53 4h4V2.86A1 1 0 0 1 7 2a1 1 0 0 1 2 0 1 1 0 0 1-.52.83V4zM12 8V5H4v5.86l2.5.14H7v2.19l1.8-2.04.35-.15H12V8zm-2.12.51a2.71 2.71 0 0 1-1.37.74v-.01a2.71 2.71 0 0 1-2.42-.74l-.7.71c.34.34.745.608 1.19.79.45.188.932.286 1.42.29a3.7 3.7 0 0 0 2.58-1.07l-.7-.71zM6.49 6.5h-1v1h1v-1zm3 0h1v1h-1v-1z"/></svg>'
  const copySvg = '<svg width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.53 8L14 2.47C13.8595 2.32931 13.6688 2.25018 13.47 2.25H11C10.2707 2.25 9.57118 2.53973 9.05546 3.05546C8.53973 3.57118 8.25 4.27065 8.25 5V6.25H7C6.27065 6.25 5.57118 6.53973 5.05546 7.05546C4.53973 7.57118 4.25 8.27065 4.25 9V19C4.25 19.7293 4.53973 20.4288 5.05546 20.9445C5.57118 21.4603 6.27065 21.75 7 21.75H14C14.7293 21.75 15.4288 21.4603 15.9445 20.9445C16.4603 20.4288 16.75 19.7293 16.75 19V17.75H17C17.7293 17.75 18.4288 17.4603 18.9445 16.9445C19.4603 16.4288 19.75 15.7293 19.75 15V8.5C19.7421 8.3116 19.6636 8.13309 19.53 8ZM14.25 4.81L17.19 7.75H14.25V4.81ZM15.25 19C15.25 19.3315 15.1183 19.6495 14.8839 19.8839C14.6495 20.1183 14.3315 20.25 14 20.25H7C6.66848 20.25 6.35054 20.1183 6.11612 19.8839C5.8817 19.6495 5.75 19.3315 5.75 19V9C5.75 8.66848 5.8817 8.35054 6.11612 8.11612C6.35054 7.8817 6.66848 7.75 7 7.75H8.25V15C8.25 15.7293 8.53973 16.4288 9.05546 16.9445C9.57118 17.4603 10.2707 17.75 11 17.75H15.25V19ZM17 16.25H11C10.6685 16.25 10.3505 16.1183 10.1161 15.8839C9.8817 15.6495 9.75 15.3315 9.75 15V5C9.75 4.66848 9.8817 4.35054 10.1161 4.11612C10.3505 3.8817 10.6685 3.75 11 3.75H12.75V8.5C12.7526 8.69811 12.8324 8.88737 12.9725 9.02747C13.1126 9.16756 13.3019 9.24741 13.5 9.25H18.25V15C18.25 15.3315 18.1183 15.6495 17.8839 15.8839C17.6495 16.1183 17.3315 16.25 17 16.25Z" fill="#808080"/></svg>'
  const insertSvg = '<svg width="1.2rem" height="1.2rem" viewBox="0 0 1024 1024" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000" data-darkreader-inline-fill="" style="--darkreader-inline-fill:#000000;"><path d="M256 120.768L306.432 64 768 512l-461.568 448L256 903.232 659.072 512z" fill="#808080" style="--darkreader-inline-fill:#60686c;" data-darkreader-inline-fill=""></path></svg>'
  const commitSvg = '<svg width="1.5rem" height="1.5rem" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#808080"><path d="M7.5 0H8.5V4.03095C10.4732 4.277 12 5.96019 12 8C12 10.0398 10.4732 11.723 8.5 11.9691V16H7.5V11.9691C5.52684 11.723 4 10.0398 4 8C4 5.96019 5.52684 4.277 7.5 4.03095V0ZM8 10.6C9.43594 10.6 10.6 9.43594 10.6 8C10.6 6.56406 9.43594 5.4 8 5.4C6.56406 5.4 5.4 6.56406 5.4 8C5.4 9.43594 6.56406 10.6 8 10.6Z"/></svg>'

  const form = document.querySelector('form')
  const lastUniqueId = document.getElementById('lastUniqueId')

  const chatContainer = document.querySelector('#chat_container')
  const textAreaInput = document.querySelector('#prompt')

  const btnSettings = document.querySelector('#btn-settings')
  // .initialTemplate li > button
  const templateBtnSuggestions = document.querySelectorAll('.initialTemplate li > button')

  const stopBtn = document.querySelector('#stopResponse')

  let intersecting = false

  if (textAreaInput) {
    textAreaInput.focus()
  }

  if (chatContainer) {
    // scroll to bottom of chat container on webview render
    scrollToBottom(chatContainer)
  }

  setTimeout(() => {
    addCopyButtons()
    addInsertButtons()
    addCopyAllButtons()
    deleteCommitButtons()
  }, 1500)

  function commitCode () {
    vscode.postMessage({
      type: 'commitCode',
      text: msg.text.replace('```bash', '').replace('```', '').replace('\\n', ''),
      uniqueId: msg.id
    })
  }

  const msg = { id: '', text: '' }

  function typeText (element, text, uniqueId, isCompleteText = false, isCommit = false) {
    if (msg.id === uniqueId) {
      if (isCompleteText) {
        msg.text = text
      } else {
        msg.text += text
      }
    } else {
      msg.id = uniqueId
      msg.text = text
    }
    const inCodeBlock = msg.text.includes('```') && msg.text.split('```').length % 2 === 0
    const markedResponse = new DOMParser().parseFromString(marked.parse(msg.text + (inCodeBlock ? '\n```' : '')), 'text/html')
    const textWithMarkdown = markedResponse.documentElement.innerHTML

    element.innerHTML = textWithMarkdown.replace('BOT:', '')

    /* if (isCommit) {
      const preCode = chatContainer.querySelectorAll('pre code')
      preCode.forEach((code) => {
        code.insertAdjacentHTML('beforebegin',
          '<button class="commit-button" > ' + commitSvg + '</button>')
      })
    } */

    if (!isCommit) {
      const pres = chatContainer.querySelectorAll('pre')
      pres.forEach((pre) => {
        if (pre.previousElementSibling && pre.previousElementSibling.className !== 'codeblockHeader') {
          const language = msg.text.split('```')[1].split('\n')[0]
          pre.insertAdjacentHTML('beforebegin',
            `
          <div class="codeblockHeader">
            <span>${language}</span>
            <div>
              <button class="insert-button" title="Insert code">${insertSvg}</button>
              <button class="copy-button" title="Copy code">${copySvg}</button>
            </div>
          </div>`
          )
        }
      })
    } else {
      const pres = chatContainer.querySelectorAll('pre')
      pres.forEach((pre) => {
        if (!pre.previousElementSibling) {
          const language = 'Bash'
          pre.insertAdjacentHTML('beforebegin',
            `
          <div class="codeblockHeader">
            <span>${language}</span>
            <div>
              ${isCommit && `<button class="commit-button" title="Commit code">${commitSvg}</button>`}
              <button class="insert-button" title="Insert code">${insertSvg}</button>
              <button class="copy-button" title="Copy code">${copySvg}</button>
            </div>
          </div>`
          )
        }
      })
    }
    const aiWrappers = chatContainer.querySelectorAll('.ai')

    // copy button to all wrapper text content
    aiWrappers.forEach((wrapper) => {
      const copyAllButton = wrapper.querySelector('.copyAll-button')
      if (!copyAllButton) {
        wrapper.insertAdjacentHTML('afterbegin', `<button class="copyAll-button" title="Copy all">${copySvg}</button>`)
      }
    })

    addCopyButtons()
    addInsertButtons()
    addCopyAllButtons()
    if (isCommit) {
      addCommitButtons()
    }
    if (intersecting) {
      scrollToBottom(chatContainer)
    }
    vscode.postMessage({
      type: 'saveHistory',
      history: chatContainer.innerHTML,
      lastPositionScroll: chatContainer.scrollTop
    })
  }

  function addCommitButtons () {
    const commitButtonElements = chatContainer.querySelectorAll('.commit-button')
    commitButtonElements.forEach((commitButtonElement) => {
      commitButtonElement.addEventListener('click', (e) => {
        e.preventDefault()
        commitCode()
      })
    })
  }

  function deleteCommitButtons () {
    const commitButtonElements = chatContainer.querySelectorAll('.commit-button')
    commitButtonElements.forEach((commitButtonElement) => {
      commitButtonElement.remove()
    })
    vscode.postMessage({
      type: 'saveHistory',
      history: chatContainer.innerHTML,
      lastPositionScroll: chatContainer.scrollTop
    })
  }

  function addCopyButtons () {
    const copyButtonElements = chatContainer.querySelectorAll('.copy-button')
    copyButtonElements.forEach((copyButtonElement) => {
      copyButtonElement.addEventListener('click', () => {
        const codeElement = copyButtonElement.parentElement.parentElement.nextElementSibling
        const code = codeElement.innerText
        navigator.clipboard.writeText(code)
      })
    })
  }

  function addInsertButtons () {
    const insertButtonElements = chatContainer.querySelectorAll('.insert-button')
    insertButtonElements.forEach((insertButtonElement) => {
      insertButtonElement.addEventListener('click', () => {
        const codeElement = insertButtonElement.parentElement.parentElement.nextElementSibling
        const code = codeElement.innerText
        vscode.postMessage({
          type: 'insertCode',
          code
        })
      })
    })
  }

  function addCopyAllButtons () {
    const copyAllButtonElements = chatContainer.querySelectorAll('.copyAll-button')
    copyAllButtonElements.forEach((copyAllButtonElement) => {
      copyAllButtonElement.addEventListener('click', () => {
        const codeElements = copyAllButtonElement.parentElement.querySelectorAll('.ai .message')
        const code = Array.from(codeElements).map((codeElement) => codeElement.innerText).join('\n')
        navigator.clipboard.writeText(code)
      })
    })
  }

  // generate unique ID for each message div of bot
  // necessary for typing text effect for that specific reply
  // without unique ID, typing text will work on every element
  function generateUniqueId () {
    const timestamp = Date.now()
    const randomNumber = Math.random()
    const hexadecimalString = randomNumber.toString(16)

    return `id-${timestamp}-${hexadecimalString}`
  }

  function chatStripe (isAi, value, uniqueId) {
    return (
      `
            <div class="wrapper ${isAi && 'ai'}">
                <div class="chat">
                    <div class="profile chat_header">
                        ${isAi ? botSvg : userSvg}
                        <span>${isAi ? 'CODEGPT' : 'USER'}</span>
                    </div>
                    <div class="message" id=${uniqueId}><p>${value}</p></div>
                </div>
            </div>
        `
    )
  }

  const opts = {
    root: null,
    threshold: 0.5
  }

  const intersectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        intersecting = true
      } else {
        intersecting = false
      }
    })
  }, opts)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // remove scrollDiv flag if exists before
    const scrollFlag = document.getElementById('scrollDiv')
    if (scrollFlag) {
      scrollFlag.remove()
    }

    // if streaming display is block then remove it
    if (stopBtn.style.display === 'block') {
      stopStream()
    }

    btnSettings?.removeEventListener('click', openSettings)

    const data = new FormData(form)

    if (data.get('prompt').trim() === '') {
      return
    }

    // check if chat container only has the initial template
    if (chatContainer.childElementCount < 2) {
      chatContainer.innerHTML = ''
    }

    // user's chatstripe
    chatContainer.innerHTML += chatStripe(false, data.get('prompt'))

    // to clear the textarea input
    form.reset()

    // bot's chatstripe
    const uniqueId = generateUniqueId()
    chatContainer.innerHTML += chatStripe(true, ' ', uniqueId)

    // add scroll flag
    const newScrollFlag = document.createElement('div')
    newScrollFlag.id = 'scrollDiv'
    chatContainer.appendChild(newScrollFlag)
    intersectionObserver.observe(newScrollFlag)

    // Last Message
    console.log(data.get('lastUniqueId'))
    let lastMessage = ''
    if (data.get('lastUniqueId') !== '') {
      lastMessage = document.getElementById(data.get('lastUniqueId')).textContent
      console.log(lastMessage)
    }

    // keep prompt container on focus
    scrollToBottom(chatContainer, { behavior: 'smooth' })

    vscode.postMessage({
      type: 'sendPrompt',
      text: data.get('prompt'),
      uniqueId,
      lastMessage
    })
  }

  function codeGPTCommand (type) {
    btnSettings?.removeEventListener('click', openSettings)
    // check if chat container only has the initial template
    if (chatContainer.childElementCount < 2) {
      chatContainer.innerHTML = ''
    }
    // user's chatstripe
    chatContainer.innerHTML += chatStripe(false, type)
    scrollToBottom(chatContainer, { behavior: 'smooth' })
    // bot's chatstripe
    const uniqueId = generateUniqueId()
    chatContainer.innerHTML += chatStripe(true, ' ', uniqueId)
    return uniqueId
  }

  form.addEventListener('submit', handleSubmit)
  form.addEventListener('keyup', (e) => {
    if (e.keyCode === 13 && !e.shiftKey) {
      handleSubmit(e)
    }
    heightChangeHandler(e)
  })

  btnSettings?.addEventListener('click', openSettings)

  templateBtnSuggestions?.forEach((templateBtnSuggestion) => {
    templateBtnSuggestion.addEventListener('click', async (e) => {
      e.preventDefault()
      const template = e.target.innerText
      const splittedTemplate = template.split('')
      textAreaInput.focus()
      for (const char of splittedTemplate) {
        textAreaInput.value += char
        await sleep(50)
      }
      await sleep(1000)
      await handleSubmit(e)
    })
  })

  stopBtn?.addEventListener('click', stopStream)

  function stopStream () {
    vscode.postMessage({
      type: 'sendPrompt',
      text: 'stop',
      uniqueId: '',
      lastMessage: '',
      stop: true
    })
  }

  function openSettings (e) {
    e.preventDefault()
    vscode.postMessage({
      type: 'openSettings'
    })
  }

  function clearChat () {
    lastUniqueId.value = ''
    chatContainer.innerHTML = ''
    // delete copy buttons event listeners
    const copyButtons = document.querySelectorAll('.copy-button')
    copyButtons.forEach((copyButton) => {
      const newCopyButton = copyButton.cloneNode(true)
      copyButton.parentNode.replaceChild(newCopyButton, copyButton)
    })
    templateBtnSuggestions.forEach((templateBtnSuggestion) => {
      const newTemplateBtnSuggestion = templateBtnSuggestion.cloneNode(true)
      templateBtnSuggestion.parentNode.replaceChild(newTemplateBtnSuggestion, templateBtnSuggestion)
    })
  }

  function heightChangeHandler (event) {
    const { target } = event
    target.style.height = 'auto'
    target.style.height = `${target.scrollHeight}px`
    chatContainer.style.marginBottom = `min(calc(${target.scrollHeight}px + 1.5rem), 17.5rem)`
    stopBtn.style.bottom = `calc(${target.scrollHeight}px + 1.5rem)`
  }

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', event => {
    const message = event.data // The json data that the extension sent
    switch (message.type) {
      case 'showResponse': {
        /* if (message.text) { // https://github.com/davila7/code-gpt-docs/issues/94
          scrollToBottom(chatContainer, { behavior: 'smooth' })
        } */
        const messageDiv = document.getElementById(message.uniqueId)
        lastUniqueId.value = message.uniqueId
        if (message.ok) {
          typeText(messageDiv, message.text, message.uniqueId, message.isCompleteText, message.isCommit)
        } else {
          console.log('Error')
        }
        break
      }
      case 'isStreaming': {
        if (message.ok) {
          stopBtn.style.display = 'block'
        } else {
          stopBtn.style.display = 'none'
        }
        break
      }
      case 'clearChat': {
        clearChat()
        break
      }
      case 'commitCodeGPT': {
        const uniqueId = codeGPTCommand('Commit the changes')
        vscode.postMessage({
          type: 'sendPrompt',
          text: message.gitDiff,
          isCommit: true,
          uniqueId,
          lastMessage: ''
        })
        const messageDiv = document.getElementById(uniqueId)
        typeText(messageDiv, 'Loading...', uniqueId, true, true)
        break
      }
      default: {
        const typePrompt = {
          explainCodeGPT: 'Explain this code:',
          refactorCodeGPT: 'Refactor this code:',
          documentCodeGPT: 'Document this code:',
          findProblemsCodeGPT: 'Find problems in this code:',
          unitTestCodeGPT: 'Unit test this code:'
        }
        const uniqueId = codeGPTCommand(typePrompt[message.type])
        vscode.postMessage({
          type: 'sendPrompt',
          promptType: message.type,
          text: message.selectedText,
          uniqueId,
          lastMessage: ''
        })
      }
    }
  })
}())
