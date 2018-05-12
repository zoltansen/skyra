class LanguageHelp {

	constructor() {
		this.explainedUsage = null;
		this.possibleFormats = null;
		this.examples = null;
		this.reminder = null;
	}

	setExplainedUsage(text) {
		this.explainedUsage = text;
		return this;
	}

	setPossibleFormats(text) {
		this.possibleFormats = text;
		return this;
	}

	setExamples(text) {
		this.examples = text;
		return this;
	}

	setReminder(text) {
		this.reminder = text;
		return this;
	}

	display(name, { extendedHelp, explainedUsage = [], possibleFormats = [], examples = [], reminder }, multiline = false) {
		const output = [];

		// Extended help
		if (extendedHelp)
			output.push(LanguageHelp.resolveMultilineString(extendedHelp, multiline), '');

		// Explained usage
		if (explainedUsage.length)
			output.push(this.explainedUsage, ...explainedUsage.map(([arg, desc]) => `→ **${arg}**: ${desc}`), '');

		// Possible formats
		if (possibleFormats.length)
			output.push(this.possibleFormats, ...possibleFormats.map(([type, example]) => `→ **${type}**: ${example}`), '');

		// Examples
		if (examples.length)
			output.push(this.examples, ...examples.map(example => `→ Skyra, ${name}${example ? ` *${example}*` : ''}`), '');
		else
			output.push(this.examples, `→ Skyra, ${name}`, '');

		// Reminder
		if (reminder)
			output.push(this.reminder, LanguageHelp.resolveMultilineString(reminder));

		return output.join('\n');
	}

	static resolveMultilineString(string, multiline) {
		return Array.isArray(string)
			? LanguageHelp.resolveMultilineString(string.join(multiline ? '\n' : ' '), multiline)
			: string.split('\n').map(line => line.trim()).join(multiline ? '\n' : ' ');
	}

}

module.exports = LanguageHelp;