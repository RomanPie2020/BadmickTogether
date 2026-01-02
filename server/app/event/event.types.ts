export interface IFilters {
	eventType?: string[]
	dateFrom?: string
	dateTo?: string
	gameType?: string[]
	levelOfPlayers?: string[]
}

export type SortByOption = 'eventDate' | 'title' | 'location'
export type SortOrder = 'asc' | 'desc'
