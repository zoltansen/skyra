import { Command, UserRichDisplay, klasaUtil : { isFunction }, MessageEmbed, Permissions; } from; '../../../index';

const PERMISSIONS_RICHDISPLAY = new Permissions([Permissions.FLAGS.MANAGE_MESSAGES, Permissions.FLAGS.ADD_REACTIONS]);

export default class extends Command {

	public constructor(client: Client, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['commands', 'cmd', 'cmds'],
			guarded: true,
			description: (language) => language.get('COMMAND_HELP_DESCRIPTION'),
			usage: '(Command:command)'
		});

		this.createCustomResolver('command', (arg, possible, message) => {
			if (!arg || arg === '') return undefined;
			return this.client.arguments.get('command').run(arg, possible, message);
		});
	}

	public async run(message, [command]) {
		if (command) {
			return message.sendMessage([
				message.language.get('COMMAND_HELP_TITLE', command.name, isFunction(command.description) ? command.description(message.language) : command.description),
				message.language.get('COMMAND_HELP_USAGE', command.usage.fullUsage(message)),
				message.language.get('COMMAND_HELP_EXTENDED', isFunction(command.extendedHelp) ? command.extendedHelp(message.language) : command.extendedHelp)
			].join('\n'));
		}

		if (!message.flags.all && message.guild && message.channel.permissionsFor(this.client.user).has(PERMISSIONS_RICHDISPLAY))
			return (await this.buildDisplay(message)).run(await message.send('Loading Commands...'), message.author.id);

		return message.author.send(await this.buildHelp(message), { split: { char: '\n' } })
			.then(() => { if (message.channel.type !== 'dm') message.sendLocale('COMMAND_HELP_DM'); })
			.catch(() => { if (message.channel.type !== 'dm') message.sendLocale('COMMAND_HELP_NODM'); });
	}

	public async buildHelp(message) {
		const commands = await this._fetchCommands(message);
		const { prefix } = message.guildSettings;

		const helpMessage = [];
		for (const [category, list] of commands)
			helpMessage.push(`**${category} Commands**:\n`, list.map(this.formatCommand.bind(this, message, prefix, false)).join('\n'), '');

		return helpMessage.join('\n');
	}

	public async buildDisplay(message) {
		const commands = await this._fetchCommands(message);
		const { prefix } = message.guildSettings;
		const display = new UserRichDisplay();
		const color = message.member.displayColor;
		for (const [category, list] of commands) {
			display.addPage(new MessageEmbed()
				.setTitle(`${category} Commands`)
				.setColor(color)
				.setDescription(list.map(this.formatCommand.bind(this, message, prefix, true)).join('\n'))
			);
		}

		return display;
	}

	public formatCommand(message, prefix, richDisplay, command) {
		const description = typeof command.description === 'function' ? command.description(message.language) : command.description;
		return richDisplay ? `• ${prefix}${command.name} → ${description}` : `• **${prefix}${command.name}** → ${description}`;
	}

	public async _fetchCommands(message) {
		const run = this.client.inhibitors.run.bind(this.client.inhibitors, message);
		const commands = new Map();
		await Promise.all(this.client.commands.map((command) => run(command, true)
			.then(() => {
				const category = commands.get(command.category);
				if (category) category.push(command);
				else commands.set(command.category, [command]);
			}).catch(() => {
				// noop
			})
		));

		return commands;
	}

}