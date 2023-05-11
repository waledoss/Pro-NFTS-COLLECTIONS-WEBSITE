const axios = require('axios')

const createAICompletion = async ({
  apiKey,
  model,
  oneShotPrompt,
  temperature,
  maxTokens
}) => {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }

  const body = {
    prompt: oneShotPrompt + '\nBOT: ',
    numResults: 1,
    maxTokens,
    temperature,
    topKReturn: 0,
    topP: 1,
    countPenalty: {
      scale: 0,
      applyToNumbers: false,
      applyToPunctuations: false,
      applyToStopwords: false,
      applyToWhitespaces: false,
      applyToEmojis: false
    },
    frequencyPenalty: {
      scale: 0,
      applyToNumbers: false,
      applyToPunctuations: false,
      applyToStopwords: false,
      applyToWhitespaces: false,
      applyToEmojis: false
    },
    presencePenalty: {
      scale: 0,
      applyToNumbers: false,
      applyToPunctuations: false,
      applyToStopwords: false,
      applyToWhitespaces: false,
      applyToEmojis: false
    },
    stopSequences: ['\nUSER:']
  }

  const url = `https://api.ai21.com/studio/v1/${model}/complete`

  const completion = await axios.post(url, body, { headers })

  console.log(oneShotPrompt)
  console.log({ completion })

  const response = completion.data.completions[0].data.text

  // AI21 completion
  return response.trim().replace('USER: ', '').trim()
}

module.exports = { createAICompletion }
