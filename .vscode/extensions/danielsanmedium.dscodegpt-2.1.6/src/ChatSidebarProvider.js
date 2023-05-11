const vscode = require('vscode')
const prompts = require('./utils/prompts.js')
const openAIClient = require('./clients/openai_client.js')
const cohereClient = require('./clients/cohere_client.js')
const aiClient = require('./clients/ai_client.js')
const anthropicClient = require('./clients/anthropic_client.js')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

// OpenAI - Cohere API Key
const API_KEY = 'API_KEY'

class ChatSidebarProvider {
  constructor (context) {
    this._view = null
    this._extensionUri = context.extensionUri
    this._vscode = vscode
    this._context = context
  }

  static getChatInstance (context) {
    if (!ChatSidebarProvider._instance) {
      ChatSidebarProvider._instance = new ChatSidebarProvider(context)
      console.log('Congratulations, your extension "codegpt" is now active!')
    }
    return ChatSidebarProvider._instance
  }

  get view () {
    return this._view
  }

  get clearChat () {
    this._view.webview.postMessage({ type: 'clearChat' })
    this._context.globalState.update('history', '')
    this._view.webview.html = this._getHtmlForWebview(this._view.webview)
  }

  resolveWebviewView (webviewView) {
    this._view = webviewView
    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true
    }

    this._update()

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)
  }

  _update () {
    if (!this._view) {
      return
    }

    this._view.webview.html = this._getHtmlForWebview(this._view.webview)
    const apiKey = this._context.secrets.get(API_KEY)
    const promptLayerApiKey = this._context.secrets.get('PROMPT_LAYER_API_KEY')

    if (!apiKey) {
      vscode.window.showWarningMessage('Enter your API KEY to save it securely.')
      return 'Please enter your api key, go to https://codegpt.co for more information.'
    }

    const provider = vscode.workspace.getConfiguration().get('CodeGPT.apiKey')
    const model = vscode.workspace.getConfiguration().get('CodeGPT.model')
    const temperature = vscode.workspace.getConfiguration().get('CodeGPT.temperature')
    const maxTokens = vscode.workspace.getConfiguration().get('CodeGPT.maxTokens')
    const language = vscode.workspace.getConfiguration().get('CodeGPT.query.language')
    let response
    let oneShotPrompt

    this._view.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'sendPrompt': {
          const uniqueId = data.uniqueId
          let message = data.text
          let lastMessage = data.lastMessage
          const promptType = data.promptType

          // check if it have a selected text

          let selectedText = ''
          const { activeTextEditor } = vscode.window
          if (activeTextEditor) {
            const { document } = activeTextEditor

            const { selection } = activeTextEditor
            selectedText = document.getText(selection)
          } else {
            console.log('No active text editor found.')
          }

          try {
            if (lastMessage !== '') {
              lastMessage = ' -Respond about this context ### ' + lastMessage
            }
            if (selectedText !== '') {
              if (!promptType) {
                message = message + ' -Respond about this code ### ' + selectedText
              } else {
                message = prompts.getCommandPrompt(message, promptType, language)
              }
            }
            if (model === 'gpt-3.5-turbo' || model === 'gpt-3.5-turbo-0301' || model === 'gpt-4' || model === 'gpt-4-32k') {
              if (apiKey.g === undefined || apiKey.g === '') {
                vscode.window.showErrorMessage('Enter your API KEY to save it securely.')
                this._view.webview.postMessage({
                  type: 'showResponse',
                  ok: true,
                  text: 'Please enter your api key, go to https://codegpt.co for more information.',
                  uniqueId
                })
                return
              }
              if (data.isCommit) {
                // console.log('is commit')
                await openAIClient.createCommitCompletion({
                  apiKey: apiKey.g,
                  model,
                  text: message,
                  lastMessage,
                  maxTokens,
                  callback: (message) => { // send message to the webview
                    this._view.webview.postMessage(message)
                  },
                  uniqueId,
                  isCommit: data.isCommit
                })
              } else {
                await openAIClient.createChatCompletion({
                  apiKey: apiKey.g,
                  model,
                  text: message,
                  lastMessage,
                  maxTokens,
                  callback: (message) => { // send message to the webview
                    this._view.webview.postMessage(message)
                  },
                  uniqueId,
                  stopTriggered: data.stop,
                  promptLayerApiKey: promptLayerApiKey.g
                })
              }
            } else {
              if (lastMessage !== '') {
                lastMessage = ' -Respond about this context ### ' + lastMessage
              }
              if (selectedText !== '') {
                message = message + ' -Respond about this code ### ' + selectedText
              }
              // no chat options, we have to create the prompt
              oneShotPrompt = prompts.getCommandPrompt(message, 'chatCodeGPT', language)

              if (provider === 'OpenAI') {
                response = await openAIClient.createOpenAiCompletion(apiKey.g, model, oneShotPrompt, temperature, maxTokens)
              }
              if (provider === 'Cohere') {
                response = await cohereClient.createCohereCompletion(apiKey.g, model, oneShotPrompt, temperature, maxTokens)
              }

              if (provider === 'AI21') {
                response = await aiClient.createAICompletion({
                  apiKey: apiKey.g,
                  model,
                  oneShotPrompt,
                  temperature,
                  maxTokens,
                  lastMessage
                })
              }

              if (provider === 'Anthropic') {
                await anthropicClient.createChatCompletion({
                  apiKey: apiKey.g,
                  model,
                  text: message,
                  lastMessage,
                  maxTokens,
                  temperature,
                  callback: (message) => { // send message to the webview
                    this._view.webview.postMessage(message)
                  },
                  uniqueId
                })
              } else {
                if (!response) {
                  response = `${provider} API could not process the query`
                }
              }
            }
          } catch (error) {
            response = `${provider} API Response was: ${error}`
            vscode.window.showErrorMessage(response)
          }
          if (response) {
            this._view.webview.postMessage({
              type: 'showResponse',
              ok: true,
              text: response,
              uniqueId
            })
          }
          break
        }
        case 'saveHistory': {
          const history = data.history
          this._context.globalState.update('history', history)
          break
        }
        case 'clearHistory': {
          this._context.globalState.update('history', '')
          this._view.webview.html = this._getHtmlForWebview(this._view.webview)
          break
        }
        case 'openSettings': {
          const settingsCommand = 'workbench.action.openSettings'
          vscode.commands.executeCommand(settingsCommand, 'codegpt')
          break
        }
        case 'insertCode': {
          const { code } = data
          const { activeTextEditor } = vscode.window
          // console.log({ activeTextEditor })
          if (activeTextEditor) {
            const { selection } = activeTextEditor
            activeTextEditor.edit((editBuilder) => {
              editBuilder.replace(selection, code)
            })
          }
          break
        }
        case 'commitCode': {
          const getWorkspaceFolder = () => {
            const { workspaceFolders } = vscode.workspace
            return workspaceFolders ? workspaceFolders[0].uri.fsPath : ''
          }
          const { stdout } = await exec(data.text, { cwd: getWorkspaceFolder() })
          // console.log({ stdout })
          this._view.webview.postMessage({
            type: 'showResponse',
            ok: true,
            text: '\n' + stdout.split('] ')[1],
            isCommit: true,
            uniqueId: data.uniqueId
          })
          break
        }
      }
    })
  }

  _getHtmlForWebview (webview) {
    console.log('getHtmlForWebview')
    const nonce = this._getNonce()
    const styleVscode = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'vscode.css'))
    // const styleMain = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'main.css'))
    const scriptChat = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'chat.js'))
    const styleChat = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'chat.css'))
    const styleGithubDark = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'github_dark.css'))
    const highlightMinJs = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'highlight.min.js'))
    const markedMindJs = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'marked.min.js'))
    const showdownJs = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'showdown.min.js'))

    const sendButtonSvg = '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M8.08074 5.36891L10.2202 7.50833L4.46802 7.50833L4.46802 8.50833L10.1473 8.50833L8.08073 10.5749L8.78784 11.282L11.7444 8.32545L11.7444 7.61835L8.78784 4.6618L8.08074 5.36891Z"/><path d="M8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14ZM8 13C10.7614 13 13 10.7614 13 8C13 5.23858 10.7614 3 8 3C5.23858 3 3 5.23858 3 8C3 10.7614 5.23858 13 8 13Z"/></svg>'
    const botSvg = '<svg width="24" height="24" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.48 4h4l.5.5v2.03h.52l.5.5V8l-.5.5h-.52v3l-.5.5H9.36l-2.5 2.76L6 14.4V12H3.5l-.5-.64V8.5h-.5L2 8v-.97l.5-.5H3V4.36L3.53 4h4V2.86A1 1 0 0 1 7 2a1 1 0 0 1 2 0 1 1 0 0 1-.52.83V4zM12 8V5H4v5.86l2.5.14H7v2.19l1.8-2.04.35-.15H12V8zm-2.12.51a2.71 2.71 0 0 1-1.37.74v-.01a2.71 2.71 0 0 1-2.42-.74l-.7.71c.34.34.745.608 1.19.79.45.188.932.286 1.42.29a3.7 3.7 0 0 0 2.58-1.07l-.7-.71zM6.49 6.5h-1v1h1v-1zm3 0h1v1h-1v-1z"/></svg>'

    const history = this._context.globalState.get('history') || ''
    const initialTemplate = `
    <div class="initialTemplate">
      <div class="wrapper ai">
        <div class="chat">
          <div class="profile chat_header">
            ${botSvg} <span>CODEGPT</span>
          </div>
            <p>
                Hi, I'm CodeGPT, the ultimate VSCode extension. Feel free to ask me any coding related questions.
            </p>
            <p>
                To get started, simply select a section of code and choose one of the following options:
            </p>
            <ul>
                <li>✨<button>Explain the selected code.</button></li>
                <li>✨<button>Identify any issues in my selected code.</button></li>
                <li>✨<button>Create unit tests for my selected code.</button></li>
            </ul>
            <p>
                If you want to learn more about me, check out the <a href="https://www.codegpt.co/docs/tutorial-basics/installation" target="_blank">Documentation</a>
            </p>
            <button id="btn-settings">Settings</button>
        </div>
    </div>
  </div>`
    const chat = history.length ? history : initialTemplate
    return `
      <!doctype html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <link rel="stylesheet" href="${styleVscode}">
                <link rel="stylesheet" href="${styleChat}">
                <link rel="stylesheet" href="${styleGithubDark}">
                <script nonce="${nonce}" src="${highlightMinJs}"></script>
                <script nonce="${nonce}" src="${showdownJs}"></script>
                <script nonce="${nonce}" src="${markedMindJs}"></script>
            </head>
            <body class="background: black">
                    <form id="app" class="">  
                        <input type="hidden" name="lastUniqueId" id="lastUniqueId" value="">
                        <div id="chat_container" class="hljs">
                            ${chat}
                        </div>
                        <button id="stopResponse">Stop responding</button>
                        <footer>
                          <textarea type="text" rows="1" tabindex="0" name="prompt" id="prompt" placeholder="Ask a question..."></textarea>
                          <button type="submit" id="btn-question">Send ${sendButtonSvg}</button>
                        </footer>
                    </form>
                    <script nonce="${nonce}" src="${scriptChat}" >
            </body>
        </html>
      `
  }

  _getNonce () {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }

  static register (context) {
    const provider = ChatSidebarProvider.getChatInstance(context)
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        'codegpt-sidebar',
        provider,
        {
          webviewOptions: {
            retainContextWhenHidden: true
          }
        }
      )
    )
  }
}

ChatSidebarProvider.viewType = 'miExtension.sidebar'

module.exports = ChatSidebarProvider
