/* eslint-disable @typescript-eslint/no-explicit-any */
import RedmineIssuePluginSettings from '../settings'
import { request } from 'https'
import { join } from 'path'

export interface RedmineIssue {
  id: string;
  project: RedmineProject,
  subject: string;
  status: string;
  timeTracking: RedmineIssueTracking
}

export interface RedmineProject {
  id: string;
  name: string;
}

export interface RedmineIssueTracking {
  spentHours: number;
  doneRatio: number;
}

export interface RedmineWorkLog {
  id: string;
  timeSpent: string;
  timeSpentSeconds: number;
  isOwner: boolean;
  startedAt: Date|null;
  updatedAt: Date|null;
}

export default class RedmineClient {
  settings: RedmineIssuePluginSettings

  constructor(settings: RedmineIssuePluginSettings) {
    this.settings = settings
  }

  async callApi(method: string, path: string, data: any = {}): Promise<any> {
    const options = {
      hostname: this.settings.host,
      port: 443,
      path: join('/', path),
      method: method,
      headers: {
        'X-Redmine-API-Key': this.settings.token
      }
    }

    return new Promise((resolve, reject) => {
      let resData = ''

      const req = request(options, (res) => {
        res.on('data', (chunk) => {
          resData += chunk
        })

        res.on('error', (error) => {
          reject(error);
        })

        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode > 299) {
            return reject(JSON.parse(resData))
          }

          resolve(JSON.parse(resData))
        })
      })
      
      req.on('error', (error) => {
        reject(error);
      })

      if (['POST', 'PUT'].includes(method.toLocaleUpperCase()) && data) {
        req.write(data)
      }

      req.end()
    })    
  }

  async getIssueDetails(issueId: string): Promise<RedmineIssue> {
    const res = await this.callApi('GET', join('issues', issueId + '.json'))
    
    return {
      id: res.issue.id,
      project: {
        id: res.issue.project.id,
        name: res.issue.project.name
      },
      subject: res.issue.subject,
      status: res.issue.name,
      timeTracking: {
        doneRatio: res.issue.done_ratio,
        spentHours: res.issue.spent_hours,
      }
    }
  }

  async getIssueWorkLogs(issueId: string): Promise<RedmineWorkLog[]> {
    const res = await this.callApi('GET', join('issue', issueId, 'worklog'))
    res.worklogs = res.worklogs || []

    return res.worklogs
  }
}
