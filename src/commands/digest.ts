import { ChatInputCommand, Command } from "@sapphire/framework";
import { createFunctionPrecondition } from "@sapphire/decorators";
import {
  PROMPTS,
  PromptStyle,
  summarizeChannel,
  Summary,
} from "../lib/summarizer";
import { TextChannel } from "discord.js";
import { ChannelType } from "discord-api-types/v10";
import { ServerConfig, SERVER_CONFIGS } from "../lib/config";

const RequiresValidInteraction = createFunctionPrecondition(
  async (interaction: Command.ChatInputInteraction) => {
    // not sure what's possible here, so some basic sanity checks
    const channel = interaction.options.getChannel(
      "channel",
      true
    ) as TextChannel;
    return interaction.guild === channel.guild && !!interaction.guild.me;
  },
  (interaction: Command.ChatInputInteraction) => {
    return interaction.reply({
      content: "Invalid interaction",
      ephemeral: true,
    });
  }
);

export class DigestCommand extends Command {
  public constructor(context: Command.Context, options: Command.Options) {
    super(context, { ...options });
  }
  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry
  ) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("digest")
        .setDescription("Summarize the last messages in a channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption((option) =>
          option
            .setName("style")
            .setDescription("Summary style")
            .setRequired(false)
            .addChoices(
              ...Object.keys(PROMPTS).map((k) => ({ name: k, value: k }))
            )
        )
    );
  }

  private async sendSummary(
    interaction: Command.ChatInputInteraction,
    summaryChannel: TextChannel,
    summary: Summary,
    config: ServerConfig
  ) {
    const guild = interaction.guild!;

    const privateSummary =
      !config.textOutputChannelId ||
      !summaryChannel.permissionsFor(guild.roles.everyone).has("VIEW_CHANNEL");

    const summaryMsgText =
      `${interaction.user} — here's a summary of the last ${summary.messageCount} messages in ${summaryChannel} (style: '${summary.style}')\n\n` +
      `${summary.text}`;

    if (privateSummary) {
      return interaction.editReply(summaryMsgText);
    } else {
      const outputChannel = await guild.channels.fetch(
        config.textOutputChannelId
      );

      if (!outputChannel?.isText())
        return interaction.editReply(
          `invalid output channel: ${outputChannel}`
        );

      const summaryMsg = await outputChannel.send(summaryMsgText);
      return interaction.editReply(`${summaryMsg.url}`);
    }
  }

  @RequiresValidInteraction
  public async chatInputRun(interaction: Command.ChatInputInteraction) {
    const guild = interaction.guild!;

    const config = SERVER_CONFIGS[guild.id];

    // check user has one of the whitelisted roles
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    const whitelisted = member.roles.cache.some((role) =>
      config.whitelistedRoles.some((id) => id === role.id)
    );
    if (!whitelisted) {
      return interaction.reply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel(
      "channel",
      true
    ) as TextChannel;

    const style = interaction.options.getString(
      "style",
      false
    ) as PromptStyle | null;

    if (!channel.permissionsFor(guild.me!).has("VIEW_CHANNEL")) {
      return interaction.reply({
        content: "I don't have permission to view that channel",
        ephemeral: true,
      });
    }

    if (channel.id === config.textOutputChannelId) {
      return interaction.reply({
        content: "I can't summarize that channel",
        ephemeral: true,
      });
    }

    const _msg = interaction.reply({
      content: `Digesting...`,
      ephemeral: true,
      fetchReply: true,
    });

    const _summary = summarizeChannel(channel, style || "important");
    let summary: Summary;

    try {
      [, summary] = await Promise.all([_msg, _summary]);
    } catch (e) {
      return interaction.editReply(`Error: ${e}`);
    }

    return this.sendSummary(interaction, channel, summary, config);
  }
}
