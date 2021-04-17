import * as os from 'os'
import { Plugin, WorkspaceLeaf } from 'obsidian'
import RedmineClient from './lib/redmine'
import RedmineIssuePluginSettings, { DEFAULT_SETTINGS } from './settings'
import RedmineIssueSettingTab from './settings-tab'
import IssueWidget from './issue-widget'
import TrackingSaveModal from './tracking-save-modal'
import { OnTimerSaveEvent } from './types'
import TrackingView, { VIEW_TYPE_OUTPUT } from './tracking-view'

export default class RedmineIssuePlugin extends Plugin {
	settings: RedmineIssuePluginSettings
	redmineClient: RedmineClient
	issuesWidgets: IssueWidget[]
	trackingView: TrackingView

	async onload(): Promise<void> {
		await this.loadSettings()
		this.addSettingTab(new RedmineIssueSettingTab(this.app, this))

		this.initRedmineClient()
		
		this.registerMarkdownCodeBlockProcessor('redmine', this.issueBlockProcessor.bind(this))

		this.registerView(
			VIEW_TYPE_OUTPUT,
			(leaf: WorkspaceLeaf) => {
				this.trackingView = new TrackingView(leaf, this)
				return this.trackingView
			}
		)

		this.addCommand({
			id: 'app:show-redmine-stats',
			name: 'Show Redmine tracking statistics',
			callback: () => this.initLeaf(),
			hotkeys: []
		})

		this.addCommand({
			id: 'app:refresh-redmine-issues',
			name: 'Refresh Redmine issues',
			callback: this.refreshData.bind(this),
			hotkeys: []
		})
	}

	initRedmineClient(): void {
		this.redmineClient = new RedmineClient(this.settings)
		this.refreshData()
	}

	refreshData(): void {
		document.querySelectorAll('.redmine-issue').forEach(issue => issue.dispatchEvent(new CustomEvent('refresh')))
		if (this.trackingView) {
			this.trackingView.refreshStats()
		}
	}

	initLeaf(): void {
		const { workspace } = this.app

		if (workspace.getLeavesOfType(VIEW_TYPE_OUTPUT).length > 0) {
			return
		}

		const leaf = workspace.getRightLeaf(false)
		if (!leaf) {
			return
		}

		leaf.setViewState({
			type: VIEW_TYPE_OUTPUT,
			active: true
		});
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

			issueWidget.addEventListener('timersave', this.onSaveTimer.bind(this))

			new IssueWidget(this, issueWidget)
				.setIssueIdentifier(key)
		}
	}

	async onSaveTimer(event: OnTimerSaveEvent): Promise<void> {
		new TrackingSaveModal(this, event).open()
	}

	onTimerSaved(event: OnTimerSaveEvent): void {
		const timerElement = window.document.querySelector('.timer-control-container[data-identifier="'+event.detail.id+'"]')
		if (!timerElement) {
			return
		}

		timerElement.dispatchEvent(new CustomEvent('timersaved', event))
		this.refreshData()
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings)

		this.initRedmineClient()
	}
}
