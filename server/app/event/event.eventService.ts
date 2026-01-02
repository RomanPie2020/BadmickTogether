import User from '@/auth/models/user'
import ApiError from '@/exceptions/apiError'
import UserProfile from '@/profile/models/userProfile'
import { logger } from '@/utils/logger/log'
import { Op, OrderItem, WhereOptions } from 'sequelize'
import { emitEventDeleted, emitEventUpdated, emitParticipantJoined, emitParticipantLeft } from '../config/socket'
import { IFilters, SortByOption, SortOrder } from './event.types'
import {
	default as Event,
	EventAttributes,
	default as EventModel,
} from './models/event'

class EventService {
	// 1) Отримати всі івенти разом із кількістю учасників
	public async getFilteredPaged({
		filters,
		search,
		searchField = 'title',
		sortBy,
		sortOrder,
		limit,
		offset,
	}: {
		filters: Partial<IFilters>
		search?: string
		searchField?: 'title' | 'location' | 'creator'
		sortBy: SortByOption
		sortOrder: SortOrder
		limit: number
		offset: number
	}): Promise<{ rows: any[]; count: number }> {
		console.log('Backend params:', {
			limit,
			offset,
			sortBy,
			sortOrder,
			search,
			searchField,
		})

		// 1) Створюємо базовий where для Event
		const where: WhereOptions = {}

		// 2) Фільтри по типу події
		if (filters.eventType && filters.eventType.length > 0) {
			where.eventType = { [Op.in]: filters.eventType }
		}

		// 3) Фільтри по типу гри
		if (filters.gameType && filters.gameType.length > 0) {
			where.gameType = { [Op.in]: filters.gameType }
		}

		// 4) Фільтри по рівню гравців
		if (filters.levelOfPlayers && filters.levelOfPlayers.length > 0) {
			where.levelOfPlayers = { [Op.in]: filters.levelOfPlayers }
		}

		// 5) Фільтри по датах
		if (
			typeof filters.dateFrom === 'string' &&
			filters.dateFrom.trim() !== '' &&
			typeof filters.dateTo === 'string' &&
			filters.dateTo.trim() !== ''
		) {
			where.eventDate = {
				[Op.between]: [new Date(filters.dateFrom), new Date(filters.dateTo)],
			}
		} else if (
			typeof filters.dateFrom === 'string' &&
			filters.dateFrom.trim() !== ''
		) {
			where.eventDate = { [Op.gte]: new Date(filters.dateFrom) }
		} else if (
			typeof filters.dateTo === 'string' &&
			filters.dateTo.trim() !== ''
		) {
			where.eventDate = { [Op.lte]: new Date(filters.dateTo) }
		}

		// 6) Пошук по різних полях
		if (search && search.trim() !== '' && searchField) {
			const trimmedSearch = search.trim()
			const ilikePattern = { [Op.iLike]: `%${trimmedSearch}%` }

			if (searchField === 'title') {
				where.title = ilikePattern
			} else if (searchField === 'location') {
				where.location = ilikePattern
			}
			// Для creator пошук буде в include
		}

		// 7) Налаштовуємо include для creator
		const creatorInclude: any = {
			association: Event.associations.creator,
			attributes: ['id', 'username'],
			required: false, // LEFT JOIN за замовчуванням
			include: [
				{
					model: UserProfile,
					as: 'profile',
					attributes: ['nickname'],
					required: false, // LEFT JOIN за замовчуванням
				},
			],
		}

		// Якщо шукаємо по creator, змінюємо на INNER JOIN з умовою
		if (search && search.trim() !== '' && searchField === 'creator') {
			const trimmedSearch = search.trim()
			creatorInclude.required = true // INNER JOIN
			creatorInclude.include[0].required = true // INNER JOIN для profile
			creatorInclude.include[0].where = {
				nickname: { [Op.iLike]: `%${trimmedSearch}%` },
			}
		}

		// 8) Налаштовуємо сортування
		const order: OrderItem[] = []

		if (sortBy === 'title') {
			order.push(['title', sortOrder])
		} else if (sortBy === 'location') {
			order.push(['location', sortOrder])
		} else if (sortBy === 'eventDate') {
			order.push(['eventDate', sortOrder])
		}

		// Додаємо додаткове сортування для стабільності
		order.push(['id', 'ASC'])

		try {
			// Спочатку отримуємо ID подій без participants (щоб уникнути дублювання)
			const eventIds = await Event.findAll({
				attributes: ['id'],
				where,
				include: [creatorInclude], // Тільки creator, без participants
				order,
				limit: Math.max(1, Math.min(100, limit)),
				offset: Math.max(0, offset),
				raw: true,
			})

			if (eventIds.length === 0) {
				return { rows: [], count: 0 }
			}

			// Отримуємо загальну кількість без limit/offset
			const totalCount = await Event.count({
				where,
				include: [creatorInclude],
				distinct: true,
			})

			// Тепер отримуємо повні дані для знайдених ID
			const events = await Event.findAll({
				where: {
					id: {
						[Op.in]: eventIds.map((event: any) => event.id),
					},
				},

				include: [
					{
						association: Event.associations.creator,
						attributes: ['id', 'username'],
						required: false,
						include: [
							{
								model: UserProfile,
								as: 'profile',
								attributes: ['nickname'],
								required: false,
							},
						],
					},
					{
						association: Event.associations.participants,
						attributes: ['id', 'username'],
						through: { attributes: [] },
						required: false,
						include: [
							{
								model: UserProfile,
								as: 'profile',
								attributes: ['nickname'],
								required: false,
							},
						],
					},
				],
				order, // Зберігаємо той самий порядок
			})

			return {
				rows: events,
				count: totalCount,
			}
		} catch (error) {
			console.error('Помилка при отриманні відфільтрованих подій:', error)
			throw new Error('Не вдалося отримати події. Спробуйте пізніше.')
		}
	}

	// 2) Отримати один івент з деталями
	async getById(id: number) {
		const event = await Event.findByPk(id, {
			include: [
				{
					association: Event.associations.creator,
					attributes: ['id', 'username'],
					required: false,
					include: [
						{
							model: UserProfile,
							as: 'profile',
							attributes: ['nickname'],
							required: false,
						},
					],
				},
				{
					association: Event.associations.participants,
					attributes: ['id', 'username'],
					through: { attributes: [] },
					required: false,
					include: [
						{
							model: UserProfile,
							as: 'profile',
							attributes: ['nickname'],
							required: false,
						},
					],
				},
			],
		})
		if (!event) throw ApiError.BadRequest('Івент не знайдено')
		return event
	}

	// 3) Створити івент
	async create(creatorId: number, data: Partial<Event>) {
		try {
			logger.info('Створення івенту:', { ...data, creatorId })

			const {
				title,
				description,
				location,
				eventDate,
				maxParticipants,
				eventType,
				gameType,
				levelOfPlayers,
			} = data

			// створюємо івент
			const created = await Event.create({
				title,
				description,
				location,
				eventDate,
				maxParticipants,
				creatorId,
				eventType,
				gameType,
				levelOfPlayers,
			})

			// одразу підтягуємо повний об’єкт з усіма зв’язками
			const event = await Event.findByPk(created.id, {
				include: [
					{
						association: Event.associations.creator,
						attributes: ['id', 'username'],
						required: false,
						include: [
							{
								model: UserProfile,
								as: 'profile',
								attributes: ['nickname'],
								required: false,
							},
						],
					},
					{
						association: Event.associations.participants,
						attributes: ['id', 'username'],
						through: { attributes: [] },
						required: false,
						include: [
							{
								model: UserProfile,
								as: 'profile',
								attributes: ['nickname'],
								required: false,
							},
						],
					},
				],
			})

			return event
		} catch (e) {
			console.error('Помилка при створенні івенту:', (e as any).errors)
			throw ApiError.InternalServerError('Не вдалося створити івент')
		}
	}

	async update(
		userId: number,
		eventId: number,
		data: Partial<EventAttributes>
	) {
		const event = await Event.findByPk(eventId, {
			include: [
				{
					association: Event.associations.creator,
					attributes: ['id', 'username'],
					required: false,
					include: [
						{
							model: UserProfile,
							as: 'profile',
							attributes: ['nickname'],
							required: false,
						},
					],
				},
				{
					association: Event.associations.participants,
					attributes: ['id', 'username'],
					through: { attributes: [] },
					required: false,
					include: [
						{
							model: UserProfile,
							as: 'profile',
							attributes: ['nickname'],
							required: false,
						},
					],
				},
			],
		})
		if (!event) {
			throw ApiError.BadRequest('Івент не знайдено')
		}
		if (event.creatorId !== userId) {
			throw ApiError.Forbidden('Ви не можете редагувати цей івент')
		}

		// фільтруємо undefined/null
		const cleaned = Object.fromEntries(
			Object.entries(data).filter(([, v]) => v !== undefined && v !== null)
		)
		await event.update(cleaned)
		
		// Reload to get fresh data
		await event.reload({
			include: [
				{
					association: Event.associations.creator,
					attributes: ['id', 'username'],
					required: false,
					include: [
						{
							model: UserProfile,
							as: 'profile',
							attributes: ['nickname'],
							required: false,
						},
					],
				},
				{
					association: Event.associations.participants,
					attributes: ['id', 'username'],
					through: { attributes: [] },
					required: false,
					include: [
						{
							model: UserProfile,
							as: 'profile',
							attributes: ['nickname'],
							required: false,
						},
					],
				},
			],
		})
		
		// Emit websocket event
		emitEventUpdated(event)
		
		return event
	}

	// Видалити івент — тільки його творець
	async remove(userId: number, eventId: number) {
		const event = await Event.findByPk(eventId)
		if (!event) throw ApiError.BadRequest('Івент не знайдено')
		if (event.creatorId !== userId)
			throw ApiError.Forbidden('Ви не можете видалити цей івент')

		const eventIdToEmit = event.id
		await event.destroy()
		
		// Emit websocket event
		emitEventDeleted(eventIdToEmit)
	}
	// 4) Додати учасника
	async addParticipant(eventId: number, userId: number) {
		const event = await Event.findByPk(eventId, {
			include: [
				{
					association: Event.associations.creator,
					attributes: ['id', 'username'],
					required: false,
					include: [
						{
							model: UserProfile,
							as: 'profile',
							attributes: ['nickname'],
							required: false,
						},
					],
				},
				{
					association: Event.associations.participants,
					attributes: ['id', 'username'],
					through: { attributes: [] },
					required: false,
					include: [
						{
							model: UserProfile,
							as: 'profile',
							attributes: ['nickname'],
							required: false,
						},
					],
				},
			],
		})
		if (!event) {
			throw ApiError.NotFound('Івент не знайдено')
		}
		await event.addParticipant(userId)
		
		// Reload to get fresh participant data
		await event.reload({
			include: [
				{
					association: Event.associations.creator,
					attributes: ['id', 'username'],
					required: false,
					include: [
						{
							model: UserProfile,
							as: 'profile',
							attributes: ['nickname'],
							required: false,
						},
					],
				},
				{
					association: Event.associations.participants,
					attributes: ['id', 'username'],
					through: { attributes: [] },
					required: false,
					include: [
						{
							model: UserProfile,
							as: 'profile',
							attributes: ['nickname'],
							required: false,
						},
					],
				},
			],
		})
		
		// Emit websocket event
		emitParticipantJoined(eventId, event)
	}

	// 5) Видалити учасника
	async removeParticipant(eventId: number, userId: number) {
		const event = await Event.findByPk(eventId, {
			include: [
				{
					association: Event.associations.creator,
					attributes: ['id', 'username'],
					required: false,
					include: [
						{
							model: UserProfile,
							as: 'profile',
							attributes: ['nickname'],
							required: false,
						},
					],
				},
				{
					association: Event.associations.participants,
					attributes: ['id', 'username'],
					through: { attributes: [] },
					required: false,
					include: [
						{
							model: UserProfile,
							as: 'profile',
							attributes: ['nickname'],
							required: false,
						},
					],
				},
			],
		})
		if (!event) {
			throw ApiError.NotFound('Івент не знайдено')
		}
		await event.removeParticipant(userId)
		
		// Reload to get fresh participant data
		await event.reload({
			include: [
				{
					association: Event.associations.creator,
					attributes: ['id', 'username'],
					required: false,
					include: [
						{
							model: UserProfile,
							as: 'profile',
							attributes: ['nickname'],
							required: false,
						},
					],
				},
				{
					association: Event.associations.participants,
					attributes: ['id', 'username'],
					through: { attributes: [] },
					required: false,
					include: [
						{
							model: UserProfile,
							as: 'profile',
							attributes: ['nickname'],
							required: false,
						},
					],
				},
			],
		})
		
		// Emit websocket event
		emitParticipantLeft(eventId, event)
	}

	//  @param userId – ID поточного користувача
	// @param type   – 'created' | 'attending'

	async getUserEvents(userId: number, type: 'created' | 'attending' | 'all') {
		// Перевіряємо, що юзер існує
		const user = await User.findByPk(userId)
		if (!user) throw ApiError.NotFound('Користувача не знайдено')

		if (type === 'all') {
			// 1) Отримуємо всі створені івенти
			const created = await this.getUserEvents(userId, 'created')

			// 2) Отримуємо всі івенти, в яких користувач бере участь
			const attending = await this.getUserEvents(userId, 'attending')

			// 3) Зливаємо два масиви та уникаємо дублікатів за id
			const combinedMap = new Map<number, EventModel>()
			for (const evt of created) {
				combinedMap.set(evt.id, evt)
			}
			for (const evt of attending) {
				combinedMap.set(evt.id, evt)
			}

			// 4) Повертаємо сортований за датою масив
			return Array.from(combinedMap.values()).sort(
				(a, b) => (a.eventDate?.getTime() ?? 0) - (b.eventDate?.getTime() ?? 0)
			)
		}

		if (type === 'created') {
			// Всі івенти, де я є creator
			return await Event.findAll({
				where: { creatorId: userId },
				order: [['event_date', 'ASC']],
				include: [
					{
						association: Event.associations.creator,
						attributes: ['id', 'username'],
						include: [
							{
								// Профіль користувача
								model: UserProfile,
								as: 'profile',
								attributes: ['nickname'],
							},
						],
					},
					{
						association: Event.associations.participants,
						attributes: ['id'],
						include: [
							{
								// Профіль користувача
								model: UserProfile,
								as: 'profile',
								attributes: ['nickname'],
							},
						],
					},
				],
			})
		} else {
			// Всі івенти, до яких я приєднався
			return await user.getAttendingEvents({
				order: [['event_date', 'ASC']],
				joinTableAttributes: [], // не тягнути поля з event_participants
				include: [
					{
						association: Event.associations.creator,
						attributes: ['id', 'username'],
						include: [
							{
								// Профіль користувача
								model: UserProfile,
								as: 'profile',
								attributes: ['nickname'],
							},
						],
					},
					{
						association: Event.associations.participants,
						attributes: ['id'],
						include: [
							{
								// Профіль користувача
								model: UserProfile,
								as: 'profile',
								attributes: ['nickname'],
							},
						],
					},
				],
			})
		}
	}
}

export const eventService = new EventService()
