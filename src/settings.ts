export default interface JiraIssuePluginSettings {
	token: string;
	host: string;
}

export const DEFAULT_SETTINGS: JiraIssuePluginSettings = {
	token: '',
	host: '',
}
