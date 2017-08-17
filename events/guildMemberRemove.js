const { Event } = require('../index');
const AntiRaid = require('../utils/anti-raid');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Event {

    async run(member) {
        let settings = member.guild.settings;
        if (settings instanceof Promise) settings = await settings;
        return this.handle(member, settings).catch(this.handleError);
    }

    async sendLog(type, member, settings, system = false) {
        if (!settings.channels.log) return false;
        const channel = member.guild.channels.get(settings.channels.log);
        if (!channel) return settings.update({ channels: { log: null } });

        const embed = new MessageEmbed()
            .setAuthor(system ? this.client.user.tag : `${member.user.tag} (${member.id})`)
            .setFooter(member.guild.language.get(type))
            .setTimestamp();

        return channel.send({ embed });
    }

    async handle(member, settings) {
        if (settings.selfmod.raid === true) AntiRaid.remove(member.guild, settings, member);
        if (settings.events.memberRemove) await this.handleMessage(member, settings).catch(this.handleError);
        return true;
    }

    async handleMessage(member, settings) {
        await this.sendLog('EVENTS_GUILDMEMBERREMOVE', member, settings).catch(this.handleError);
        if (settings.channels.default && settings.messages.farewell) await this.handleFarewell(member, settings).catch(this.handleError);
    }

    async handleFarewell(member, settings) {
        const channel = member.guild.channels.get(settings.channels.default);
        if (!channel) {
            await settings.update({ channels: { default: null } });
            await this.sendLog('SETTINGS_DELETE_CHANNELS_DEFAULT', member, settings, true);
            return null;
        }

        return channel.send(this.getMessage(member, settings));
    }

    getMessage(member, settings) {
        return settings.messages.farewell
            .replace(/%MEMBER%/g, member)
            .replace(/%MEMBERNAME%/g, member.user.username)
            .replace(/%GUILD%/g, member.guild.name);
    }

    handleError(err) {
        return this.client.emit('log', err, 'error');
    }

};