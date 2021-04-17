import RedminePlugin from './main';
import { ButtonComponent, ItemView, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_OUTPUT = 'redmine-tracking'
const XMLNS = "http://www.w3.org/2000/svg"

export default class TimerView extends ItemView {
	plugin: RedminePlugin
	svgCircle: SVGCircleElement;
	dateFilter: Date;
	dateFilterSpan: HTMLSpanElement;
	svgText: SVGTextElement;

	constructor(leaf: WorkspaceLeaf, plugin: RedminePlugin) {
		super(leaf);
		this.plugin = plugin
		this.dateFilter = new Date()
	}

	getViewType(): string {
		return VIEW_TYPE_OUTPUT;
	}

	getDisplayText(): string {
		return 'Tracked Time Stats';
	}

	getIcon(): string {
		return "clock";
	}

	async onOpen(): Promise<void> {
		const { containerEl } = this;
		containerEl.empty()

		this.showDateFilter()

		const svg = window.document.createElementNS(XMLNS, "svg")
		svg.setAttributeNS(null, "width", "100")
		svg.setAttributeNS(null, "height", "100")
		svg.setAttributeNS(null, "viewBox", "0 0 100 100")

    this.svgCircle = window.document.createElementNS(XMLNS, "circle")
    this.svgCircle.setAttributeNS(null,"cx",'50')
    this.svgCircle.setAttributeNS(null,"cy",'50')
    this.svgCircle.setAttributeNS(null,"r",'35')
    this.svgCircle.setAttributeNS(null,"stroke-width",'4')
    this.svgCircle.setAttributeNS(null,"stroke-linecap",'round')
    this.svgCircle.setAttributeNS(null,"fill",'transparent')
    this.svgCircle.setAttributeNS(null,"stroke",'currentColor')

		this.svgText = window.document.createElementNS(XMLNS, "text")
		this.svgText.setAttributeNS(null,"x",'50')
    this.svgText.setAttributeNS(null,"y",'54')
		this.svgText.setAttributeNS(null,"fill",'currentColor')
		this.svgText.setAttributeNS(null,"text-anchor",'middle')

		svg.appendChild(this.svgCircle)
		svg.appendChild(this.svgText)
		svg.addClass('redmine-tracking-stats')

		this.setCirclePercentage(0)
		this.setLabelText('...')

		containerEl.appendChild(svg)

		this.refreshStats()
	}

	showDateFilter(): void {
		const { containerEl } = this;

		const filterContainer = containerEl.createDiv({
			cls: ['redmine-tracking-filter']
		})
		
		new ButtonComponent(filterContainer)
			.setButtonText('<')
			.onClick(() => {
				this.dateFilter.setDate(this.dateFilter.getDate() - 1)
				this.refreshDateFilterSpan()
				this.refreshStats()
			})

		this.dateFilterSpan = filterContainer.createSpan()
		this.refreshDateFilterSpan()

		new ButtonComponent(filterContainer)
			.setButtonText('>')
			.onClick(() => {
				this.dateFilter.setDate(this.dateFilter.getDate() + 1)
				this.refreshDateFilterSpan()
				this.refreshStats()
			})
	}

	refreshDateFilterSpan(): void {
		if (!this.dateFilterSpan) {
			return
		}
		this.dateFilterSpan.setText(this.dateFilter.toISOString().slice(0, 10))
	}

  async refreshStats(): Promise<void> {
		let entries = []
		try {
			entries = await this.plugin.redmineClient.getTimeEntriesByDate(this.dateFilter)	
		} catch (error) {
			this.setCirclePercentage(0)
			this.setLabelText('-')
			return
		}
    
		const total = entries.reduce((total, entry) => total + entry.hours, 0)
		let percent = 0
		if (total !== 0 && this.plugin.settings.dayHours) {
			percent = Math.ceil(total / this.plugin.settings.dayHours * 100)
		}

		this.setCirclePercentage(percent > 100 ? 100 : percent)
		this.setLabelText(`${percent}%`)
  }

	setCirclePercentage(percent: number): void {
		const radius = this.svgCircle.r.baseVal.value;
		const circumference = radius * 2 * Math.PI;
		const offset = circumference - percent / 100 * circumference;

		this.svgCircle.style.strokeDasharray = `${circumference} ${circumference}`;
		this.svgCircle.style.strokeDashoffset = offset.toFixed(2);
		this.svgCircle.style.strokeWidth = percent === 0 ? '0' : '4'
	}

	setLabelText(content: string): void {
		this.svgText.innerHTML = content
	}
}
