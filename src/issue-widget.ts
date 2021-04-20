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
    this.el.addEventListener('refresh', this.loadIssue.bind(this))
  }

  getIssueIdentifier(): string {
    return this.redmineIssueKey
  }

  setIssueIdentifier(redmineIssueKey: string): IssueWidget {
    this.el.empty()
    this.el.innerHTML = 'loading..'

    this.redmineIssueKey = redmineIssueKey
    this.loadIssue()

    return this
  }

  async loadIssue(): Promise<void> {
    try {
      this.issue = await this.plugin.redmineClient.getIssueDetails(this.redmineIssueKey)
    } catch (error) {
      this.el.innerHTML = error.toString()
      this.el.addClass('in-error')
      return
    }
    this.el.removeClass('in-error')

    this.el.empty()
    this.showIssueDetails()
    this.showTimeStats()
  }

  showIssueDetails(): void {
    if (!this.issue) {
      return
    }

    this.el.createDiv({
      text: `${this.issue.subject}`,
      cls: ['redmine-issue-title']
    })

    const subheader = this.el.createDiv({ cls: ['redmine-issue-details'] })
    subheader.createSpan({
      text: `${this.issue.id}`
    })
    subheader.createSpan({
      text: `${this.issue.project.name}`
    })
    if (this.issue.status) {
      subheader.createSpan({
        text: `${this.issue.status}`
      })
    }
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
    const timeBar = container.createDiv({ cls: ['redmine-issue-time-bar'] })

    const { doneRatio, estimatedHours, spentHours } = this.issue.timeTracking
    if (estimatedHours && estimatedHours > 0) {
      const percentage = Math.ceil(spentHours / estimatedHours * 100)
      if (percentage <= 100) {
        timeBar.style.width = percentage + '%'
      } else {
        timeBar.style.width = '100%'

        const timeBarOverflow = timeBar.createDiv({ cls: ['redmine-issue-time-bar-overflow'] })
        timeBarOverflow.style.width = (percentage - 100) + '%'
      }
    } else {
      timeBar.style.width = Math.ceil(doneRatio) + '%'
    }
  }
}
