import GPT3Tokenizer from "gpt3-tokenizer";
import { Configuration, OpenAIApi } from "openai";
import { OPENAI_API_KEY } from "./env";

const tokenizer = new GPT3Tokenizer({ type: "gpt3" });

export const tokenCount = (str: string) => {
  const encoded = tokenizer.encode(str);
  return encoded.text.length;
};

export const openai = new OpenAIApi(
  new Configuration({ apiKey: OPENAI_API_KEY })
);
