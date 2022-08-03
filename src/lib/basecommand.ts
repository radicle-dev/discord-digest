import { Command, UserError } from '@sapphire/framework'
import { Guild, TextChannel } from 'discord.js'
import { ServerConfig, SERVER_CONFIGS } from './config'

export interface IRunCommandParams {
	interaction: Command.ChatInputInteraction
	guild: Guild
	outputChannel: TextChannel
	config: ServerConfig
}

export abstract class BaseCommand extends Command {
	abstract run(params: IRunCommandParams): Promise<unknown>

	async chatInputRun(interaction: Command.ChatInputInteraction) {
		try {
			// not sure what's possible here, so some basic sanity checks
			const guild = interaction.guild

			if (!guild) {
				throw new UserError({
					identifier: 'RequireGuild',
					message: 'Interaction is missing guild'
				})
			}

			if (!guild.me) {
				throw new UserError({
					identifier: 'RequireGuildMe',
					message: 'Guild is missing me'
				})
			}

			const config = SERVER_CONFIGS[guild.id]

			// check user has one of the whitelisted roles
			const member = await guild.members.fetch(interaction.user.id)
			const whitelisted = member.roles.cache.some((role) =>
				config.whitelistedRoles.some((id) => id === role.id)
			)

			if (!whitelisted) {
				throw new UserError({
					identifier: 'RequireWhitelistedRole',
					message: "You don't have permission to use this command"
				})
			}

			const outputChannel = await guild.channels.fetch(config.textOutputChannelId)

			if (outputChannel?.type !== 'GUILD_TEXT') {
				throw new UserError({
					identifier: 'RequireOutputTextChannel',
					message: `Output channel must be a text channel: ${outputChannel}`
				})
			}

			return this.run({ interaction, guild, outputChannel, config })
		} catch (error) {
			const errorMsg = error instanceof UserError ? error.message : `Unknown error — ${error}`
			return interaction.reply({
				content: errorMsg,
				ephemeral: true
			})
		}
	}
}
