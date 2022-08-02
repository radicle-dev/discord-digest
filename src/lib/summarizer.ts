import { Collection, GuildTextBasedChannel, Message } from "discord.js";
import { openai, tokenCount } from "./openai";

export const summarize = async (text: string): Promise<string> => {
  const completion = await openai.createCompletion({
    model: "text-davinci-002",
    prompt: text,
    max_tokens: 300,
  });

  if (!completion.data.choices || !completion.data.choices[0].text)
    throw new Error("Could not create completion");

  return completion.data.choices[0].text;
};

export const PROMPTS = {
  tldr: (log: string) => `${log}\n\ntl;dr`,

  bullet: (log: string) =>
    `${log}\n\nA bullet point summary of the chat log above:\n\n`,

  basic: (log: string) => `Summarize the following conversation:\n\n${log}\n\n`,

  two_sentence: (log: string) =>
    `Summarize the following conversation in two sentences:\n\n${log}\n\n`,

  five_bullet_points: (log: string) =>
    `${log}\n\nFive bullet points outlining the important points from the chat log above:\n`,

  detailed: (log: string) =>
    `Summarize the following conversation in detail:\n\n${log}\n\n`,

  important: (log: string) =>
    `${log}\n\nWhat are the important points from this chat log?\n\n`,
};

export type PromptStyle = keyof typeof PROMPTS;

function buildPrompt(
  msgs: Collection<string, Message<boolean>>,
  style: PromptStyle
) {
  const MAX_MSG_TOKENS = 3200; // 4000 is current max & we need space for prompt & reply

  let promptMsgs: { msg: Message; str: string }[] = [];
  let curTokens = 0;

  msgs.reverse().some((msg, i) => {
    const str = `${msg.author.username}: ${msg.content}`;
    const tokens = tokenCount(str);
    if (curTokens + tokens > MAX_MSG_TOKENS) return true;
    curTokens += tokens;
    promptMsgs.push({ msg, str });
    return false;
  });

  return {
    messageCount: promptMsgs.length,
    chatTokenCount: curTokens,
    prompt: PROMPTS[style](promptMsgs.map((m) => m.str).join("\n")),
  };
}

export interface Summary {
  messageCount: number;
  text: string;
  style: string;
}

export const summarizeChannel = async (
  channel: GuildTextBasedChannel,
  style: PromptStyle
): Promise<Summary> => {
  const msgs = await channel.messages.fetch({ limit: 100 });

  const { messageCount, prompt } = buildPrompt(msgs, style);

  return {
    messageCount,
    text: await summarize(prompt),
    style,
  };
};
