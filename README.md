# Obsidian Redmine Issue Plugin

An [Obsidian.md](https://obsidian.md/) plugin that show Redmine issue details.

## Usage

Add this code block where you want to show the issue widget:
````makrdown
```redmine
12345
```
````

or add multiple ids, one for each line, to show a grid of widgets:
````makrdown
```jira
12345
12346
12347
12348
12349
12340
```
````

Open the preview mode to see issue's details:

![issue details](./doc/gifs/redmine-details.gif)

## Usage with Time Tracker

This plugin is compatible with [Time Tracker Plugin](https://github.com/daaru00/obsidian-timer-tracker), you can start a timer and save it as Redmine Time Entry:

![issue time tracker](./doc/gifs/redmine-time-tracker.gif)

An additional panel can be activated in order to show the percentage of worked hours are being currently saved to Redmine:

![issue time tracked statistics](./doc/gifs/redmine-time-stats.gif)
