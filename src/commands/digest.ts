import { ChatInputCommand } from '@sapphire/framework'
import { PROMPTS, PromptStyle, summarizeChannel, Summary } from '../lib/summarizer'
import { MessageEmbed, TextChannel } from 'discord.js'
import { ChannelType } from 'discord-api-types/v10'
import { BaseCommand, IRunCommandParams } from '../lib/basecommand'

export class DigestCommand extends BaseCommand {
	public override registerApplicationCommands(registry: ChatInputCommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('digest')
				.setDescription('Summarize the last messages in a channel')
				.addChannelOption((option) =>
					option
						.setName('channel')
						.setDescription('Channel')
						.setRequired(true)
						.addChannelTypes(ChannelType.GuildText)
				)
				.addStringOption((option) =>
					option
						.setName('style')
						.setDescription('Summary style')
						.setRequired(false)
						.addChoices(...Object.keys(PROMPTS).map((k) => ({ name: k, value: k })))
				)
		)
	}

	async run({ interaction, guild, outputChannel, config }: IRunCommandParams) {
		const { options } = interaction
		const channel = options.getChannel('channel', true) as TextChannel
		const style = options.getString('style', false) as PromptStyle | null

		if (!channel.permissionsFor(guild!.me!).has('VIEW_CHANNEL')) {
			return interaction.reply({
				content: "I don't have permission to view that channel",
				ephemeral: true
			})
		}

		if (channel.id === config.textOutputChannelId) {
			return interaction.reply({
				content: "I can't summarize that channel",
				ephemeral: true
			})
		}

		const _msg = interaction.reply({
			content: `Digesting...`,
			ephemeral: true,
			fetchReply: true
		})

		const _summary = summarizeChannel(channel, style || 'important')
		let summary: Summary

		try {
			;[, summary] = await Promise.all([_msg, _summary])
		} catch (e) {
			return interaction.editReply(`Error: ${e}`)
		}

		const delta = Date.now() - summary.messages[0].createdAt.getTime()
		const days = Math.ceil(delta / (1000 * 3600 * 24))

		const post = new MessageEmbed()
			.setColor('#00FF00')
			.setTitle(`Summary of #${channel.name} from the last ${days} day${days > 1 ? 's' : ''}`)
			.setDescription(summary.text)
			.setFooter({ text: `💩 (prompt: '${summary.style}', msgs: ${summary.messages.length})` })

		const privateSummary = !channel.permissionsFor(guild.roles.everyone).has('VIEW_CHANNEL')

		if (privateSummary) {
			return interaction.editReply({ embeds: [post] })
		} else {
			if (outputChannel.id === interaction.channelId) {
				interaction.editReply('Digested!')
				return interaction.followUp({ embeds: [post] })
			} else {
				const summaryMsg = await outputChannel.send({ embeds: [post] })
				return interaction.editReply(`${summaryMsg.url}`)
			}
		}
	}
}
