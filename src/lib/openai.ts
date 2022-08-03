import GPT3Tokenizer from 'gpt3-tokenizer'
import { Configuration, OpenAIApi } from 'openai'
import { OPENAI_API_KEY } from './env'

const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })

export const tokenCount = (str: string) => {
	const encoded = tokenizer.encode(str)
	return encoded.text.length
}

export const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_API_KEY }))

export const completion = async (text: string): Promise<string> => {
	const completion = await openai.createCompletion({
		model: 'text-davinci-002',
		prompt: text,
		max_tokens: 300
	})

	if (!completion.data.choices || !completion.data.choices[0].text)
		throw new Error('Could not create completion')

	return completion.data.choices[0].text
}
