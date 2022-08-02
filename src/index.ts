import { SapphireClient } from "@sapphire/framework";
import { DISCORD_BOT_TOKEN } from "./lib/env";

const client = new SapphireClient({ intents: ["GUILDS", "GUILD_MESSAGES"] });

client.login(DISCORD_BOT_TOKEN);
