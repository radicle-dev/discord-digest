import dotenv from "dotenv";

const { parsed } = dotenv.config();

if (!parsed) throw new Error("Could not load .env file");

export const { OPENAI_API_KEY, DISCORD_BOT_TOKEN } = parsed;
