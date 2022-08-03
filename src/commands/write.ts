import { Message, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js'
import { ChatInputCommand } from '@sapphire/framework'
import { completion } from '../lib/openai'
import { MessageButtonStyles } from 'discord.js/typings/enums'
import { BaseCommand, IRunCommandParams } from '../lib/basecommand'

export class DigestCommand extends BaseCommand {
	public override registerApplicationCommands(registry: ChatInputCommand.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('write')
				.setDescription('Instruct AI to write something.')
				.addStringOption((option) =>
					option.setName('prompt').setDescription('A writing prompt').setRequired(true)
				)
		)
	}

	async run({ interaction, outputChannel }: IRunCommandParams) {
		const { options } = interaction

		const prompt = options.getString('prompt', true)

		const _msg = (await interaction.reply({
			content: `Writing...`,
			ephemeral: true,
			fetchReply: true
		})) as Message

		const _output = completion(prompt)
		let output: string

		try {
			;[, output] = await Promise.all([_msg, _output])
		} catch (e) {
			return interaction.editReply(`Error: ${e}`)
		}

		const postBtn = new MessageButton()
			.setCustomId('post')
			.setLabel('Post')
			.setStyle(MessageButtonStyles.PRIMARY)

		const postWithPromptBtn = new MessageButton()
			.setCustomId('post-with-prompt')
			.setLabel('Post with prompt')
			.setStyle(MessageButtonStyles.SECONDARY)

		const row = new MessageActionRow().addComponents(postBtn, postWithPromptBtn)

		await interaction.editReply({
			content: output,
			components: [row]
		})

		const collector = interaction.channel?.createMessageComponentCollector({
			filter: (i) => i.user.id === interaction.user.id && !interaction.user.bot,
			time: 60_000 * 10 // 10 min timeout to post
		})

		collector?.on('collect', async (i) => {
			if (i.customId === 'post' || i.customId === 'post-with-prompt') {
				const content =
					i.channelId === outputChannel.id ? 'Posting...' : `Posting to ${outputChannel}...`
				i.update({ content, components: [] })
				collector.stop(i.customId)
			}
		})

		collector?.on('end', (collected, reason) => {
			if (reason === 'post' || reason === 'post-with-prompt') {
				const post = new MessageEmbed().setColor('#00FF00').setDescription(output)
				if (reason === 'post-with-prompt') post.setFooter({ text: `📄 prompt: ${prompt}` })
				outputChannel.send({ embeds: [post] })
			} else if (reason === 'time') {
				let timedout = new MessageEmbed()
					.setColor('#ffffff')
					.setDescription('Timed out for posting')

				interaction.editReply({ components: [], embeds: [timedout] })
			}
		})

		return interaction
	}
}
