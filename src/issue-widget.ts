import RedmineIssuePlugin from './main'
import {RedmineIssue} from './lib/redmine'
import * as path from 'path'

export default class IssueWidget {
  el: HTMLElement;
  plugin: RedmineIssuePlugin;
  redmineIssueKey: string;
  issue: RedmineIssue;
  timerControlContainer: HTMLDivElement;
  transitionControlContainer: HTMLDivElement;

  constructor(plugin: RedmineIssuePlugin, el: HTMLElement) {
    this.plugin = plugin
    this.el = el
  }

  getIssueIdentifier(): string {
    return this.redmineIssueKey
  }

  setIssueIdentifier(redmineIssueKey: string): IssueWidget {
    this.el.dataset.identifier = redmineIssueKey

    this.el.empty()
    this.el.innerHTML = 'loading..'

    this.redmineIssueKey = redmineIssueKey
    this.loadIssue()

    return this
  }

  async loadIssue(): Promise<void> {
    try {
      this.issue = await this.plugin.redmineClient.getIssueDetails(this.redmineIssueKey)
    } catch ({ errorMessages }) {
      this.el.innerHTML = errorMessages.join(' ')
      this.el.addClass('in-error')
      return
    }

    this.el.empty()
    this.showIssueDetails()
    this.showTimeStats()
  }

  showIssueDetails(): void {
    if (!this.issue) {
      return
    }

    this.el.createSpan({
      text: `${this.issue.subject}`
    })

    const subheader = this.el.createDiv({ cls: ['redmine-issue-details'] })
    subheader.createSpan({
      text: `${this.issue.id}`
    })
    subheader.createSpan({
      text: `${this.issue.project.name}`
    })
    subheader.createSpan({
      text: `${this.issue.status}`
    })
    subheader.createEl('a', {
      attr: {
        rel: 'noopener',
        target: '_blank',
        href: path.join('https://'+this.plugin.settings.host, 'issues', this.issue.id.toString()),
      },
      cls: ['external-link']
    })
  }

  showTimeStats(): void {
    const container = this.el.createDiv({ cls: ['redmine-issue-time-bar-container'] })
    const { doneRatio } = this.issue.timeTracking

    const bar = container.createDiv({ cls: ['redmine-issue-time-bar'] })
    bar.style.width = Math.ceil(doneRatio) + '%'
  }
}
