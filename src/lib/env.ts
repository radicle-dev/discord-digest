import dotenv from 'dotenv'

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			OPENAI_API_KEY: string
			DISCORD_BOT_TOKEN: string
		}
	}
}

dotenv.config()

const missing = ['OPENAI_API_KEY', 'DISCORD_BOT_TOKEN'].filter((k) => !process.env[k])

if (missing.length) throw new Error(`Missing env var: ${missing.join(', ')}`)

export const { OPENAI_API_KEY, DISCORD_BOT_TOKEN } = process.env
