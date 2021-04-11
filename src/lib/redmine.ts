/* eslint-disable @typescript-eslint/no-explicit-any */
import RedmineIssuePluginSettings from '../settings'
import { request } from 'https'
import { join } from 'path'

export interface RedmineIssue {
  id: string;
  key: string;
  project: RedmineProject,
  summary: string;
  status: string;
  timeTracking: RedmineIssueTracking;
}

export interface RedmineProject {
  id: string;
  key: string;
  name: string;
}

export interface RedmineIssueTracking {
  originalEstimate: string;
  originalEstimateSeconds: number;
  remainingEstimate: string;
  remainingEstimateSeconds: number;
  timeSpent: string;
  timeSpentSeconds: number;
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
      path,
      method: method,
      headers: {
        'X-Redmine-API-Key': this.settings.token
      }
    };    

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
    const res = await this.callApi('GET', join('issues.json')+'?issue_id='+issueId)
    
    return {
      id: res.id,
      key: '',
      project: {
        id: res.project_id,
        key: '',
        name: ''
      },
      summary: '',
      status: '',
      timeTracking: null
    }
  }

  async getIssueWorkLogs(issueId: string): Promise<RedmineWorkLog[]> {
    const res = await this.callApi('GET', join('issue', issueId, 'worklog'))
    res.worklogs = res.worklogs || []

    return res.worklogs
  }
}
