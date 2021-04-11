import RedmineIssuePlugin from './main'
import {RedmineIssue} from './lib/redmine'

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
      text: `${this.issue.summary}`
    })

    const subheader = this.el.createDiv({ cls: ['redmine-issue-details'] })
    subheader.createSpan({
      text: `${this.issue.key}`
    })
    subheader.createSpan({
      text: `${this.issue.project.name}`
    })
    subheader.createSpan({
      text: `${this.issue.status}`
    })
  }

  showTimeStats(): void {
    const container = this.el.createDiv({ cls: ['redmine-issue-time-bar-container'] })
    const { originalEstimateSeconds, timeSpentSeconds } = this.issue.timeTracking
    const percentage = originalEstimateSeconds / (100 * timeSpentSeconds)

    const bar = container.createDiv({ cls: ['redmine-issue-time-bar'] })
    bar.style.width = Math.ceil(percentage) + '%'
  }
}
