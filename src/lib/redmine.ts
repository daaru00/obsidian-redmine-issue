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
  estimatedHours: number;
}

export interface RedmineTimeEntry {
  id: string;
  issueId: number;
  hours: number;
  activity: number;
  spentOn: Date;
  comments: string;
}

export interface RedmineTimeEntryActivity {
  id: string;
  name: string;
  isDefault: boolean;
  projectId: string;
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
        'X-Redmine-API-Key': this.settings.token,
        'Content-Type': 'application/json'
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
          resData = resData.trim()

          if (res.statusCode < 200 || res.statusCode > 299) {
            return reject(resData ? JSON.parse(resData) : res.statusCode)
          }

          resolve(resData ? JSON.parse(resData) : '')
        })
      })
      
      req.on('error', (error) => {
        reject(error);
      })

      if (['POST', 'PUT'].includes(method.toLocaleUpperCase()) && data) {
        req.write(JSON.stringify(data))
      }

      req.end()
    })    
  }

  async getIssueDetails(issueId: string): Promise<RedmineIssue> {
    const res = await this.callApi('GET', join('issues', issueId + '.json'))
    res.issue = res.issue || {}

    return {
      id: res.issue.id,
      project: {
        id: res.issue.project.id,
        name: res.issue.project.name
      },
      subject: res.issue.subject,
      status: res.issue.name,
      timeTracking: {
        doneRatio: res.issue.done_ratio || 0,
        spentHours: res.issue.spent_hours || 0,
        estimatedHours: res.issue.estimated_hours || 0
      }
    }
  }

  async getAllActivities(): Promise<RedmineTimeEntryActivity[]> {
    const res = await this.callApi('GET', join('enumerations', 'time_entry_activities.json'))
    res.time_entry_activities = res.time_entry_activities || []

    return res.time_entry_activities.map((activity: { id: any; name: any; is_default: any }) => ({
      id: activity.id,
      name: activity.name,
      isDefault: activity.is_default
    }))
  }

  async getAllActivitiesByProject(projectId: string): Promise<RedmineTimeEntryActivity[]> {
    const res = await this.callApi('GET', join('projects', projectId + '.json'))
    res.project = res.project || {}
    res.project.time_entry_activities = res.project.time_entry_activities || []

    return res.project.time_entry_activities.map((activity: { id: any; name: any; is_default: any }) => ({
      id: activity.id,
      name: activity.name,
      isDefault: activity.is_default,
      projectId: projectId
    }))
  }
  
  async saveIssueTimeEntry(issueId: string, hours: number, activityId: number, spentOn?: Date, comments?: string): Promise<void> {
    await this.callApi('POST', 'time_entries.json', {
      time_entry: {
        issue_id: issueId,
        comments: comments || '',
        activity_id: activityId,
        hours: hours,
        spent_on: (spentOn || new Date()).toISOString().slice(0, 10)
      }
    })
  }

  async getTimeEntriesByDate(date?: Date): Promise<RedmineTimeEntry[]> {
    date = date || (new Date())
    const dateFilter = date.toISOString().slice(0, 10)

    const res = await this.callApi('GET', `time_entries.json?user_id=me&from=${dateFilter}&to=${dateFilter}`)
    res.time_entries = res.time_entries || []

    return res.time_entries.map((entry: { id: number, issue: { id: number }, activity: { id: number }, hours: number, spent_on: string, comments: string }) => ({
      id: entry.id,
      issueId: entry.issue.id,
      hours: entry.hours,
      activity: entry.activity.id,
      spentOn: new Date(entry.spent_on),
      comments: entry.comments,
    }))
  }
}
