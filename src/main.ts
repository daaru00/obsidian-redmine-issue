import * as os from 'os'
import { Plugin } from 'obsidian'
import RedmineClient from './lib/redmine'
import RedmineIssuePluginSettings, { DEFAULT_SETTINGS } from './settings'
import RedmineIssueSettingTab from './settings-tab'
import IssueWidget from './issue-widget'

export default class RedmineIssuePlugin extends Plugin {
	settings: RedmineIssuePluginSettings
	redmineClient: RedmineClient
	issuesWidgets: IssueWidget[]

	async onload(): Promise<void> {
		await this.loadSettings()
		this.addSettingTab(new RedmineIssueSettingTab(this.app, this))
		
		this.registerMarkdownCodeBlockProcessor('redmine', this.issueBlockProcessor.bind(this))

		this.initRedmineClient()
	}

	initRedmineClient(): void {
		this.redmineClient = new RedmineClient(this.settings)
	}

	async issueBlockProcessor(content: string, el: HTMLElement): Promise<void> {
		el.empty()

		const container = el.createDiv()
		container.addClass('redmine-issues-grid')

		const issues = content.split(os.EOL).filter(key => key.trim().length > 0)
		for (const key of issues) {
			const issueWidgetContainer = container.createDiv()
			issueWidgetContainer.addClass('redmine-issue-grid-item')
			
			const issueWidget = issueWidgetContainer.createDiv()
			issueWidget.addClass('redmine-issue')
			issueWidget.addClass('timer-tracker-compatible')

			new IssueWidget(this, issueWidget)
				.setIssueIdentifier(key)
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings)

		this.initRedmineClient()
	}
}
