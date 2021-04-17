import { App, PluginSettingTab, Setting } from 'obsidian'
import RedmineIssuePlugin from './main'

export default class RedmineIssueSettingTab extends PluginSettingTab {
	plugin: RedmineIssuePlugin;

	constructor(app: App, plugin: RedmineIssuePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async display(): Promise<void> {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Redmine Host')
			.setDesc('The domain host of Redmine instance')
			.addText(text => text
				.setValue(this.plugin.settings.host)
				.setPlaceholder("my-host-name.com")
				.onChange(async (value) => {
					this.plugin.settings.host = value;
					await this.plugin.saveSettings();
				}));
		
		new Setting(containerEl)
			.setName('API Access Key')
			.setDesc('The API token from account page')
			.addText(text => {
				text.inputEl.type = 'password'
				text.setValue(this.plugin.settings.token)
					.setPlaceholder("xxxxxxxxxxxxxxxxxxxxx")
					.onChange(async (value) => {
						this.plugin.settings.token = value;
						await this.plugin.saveSettings();
					})
			})

		new Setting(containerEl)
			.setName('Working Day Hours')
			.setDesc('the number of hours to track in a working day')
			.addText(text => text
				.setValue(this.plugin.settings.dayHours.toString())
				.onChange(async (value) => {
					this.plugin.settings.dayHours = parseInt(value);
					await this.plugin.saveSettings();
				}));
	}
}
