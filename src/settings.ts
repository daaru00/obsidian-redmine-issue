export default interface JiraIssuePluginSettings {
	token: string;
	host: string;
	dayHours: number;
}

export const DEFAULT_SETTINGS: JiraIssuePluginSettings = {
	token: '',
	host: '',
	dayHours: 8
}
