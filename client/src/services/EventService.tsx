import { createApi } from '@reduxjs/toolkit/query/react'
import {
    IEventMessage,
    IRequestGetFilteredEvents,
    IRequestGetUserEvents,
    IRequestUpdateEvent,
    IResponseGetFilteredEvents,
    IResponseJoinLeaveEvent,
} from '../shared/interfaces/models'
import { TEventInput } from '../shared/validations/event.schema'
import { baseQueryWithReauth } from './baseQueryWithReauth'

export const eventService = createApi({
	reducerPath: 'event',
	baseQuery: baseQueryWithReauth,
	tagTypes: ['Event', 'UserEvents'],
	endpoints: build => ({
		getEvents: build.query<TEventInput[], void>({
			query: () => ({ url: '/api/events', method: 'GET' }),
		}),

		getEventById: build.query<TEventInput, number>({
			query: id => ({ url: `/api/events/${id}`, method: 'GET' }),
		}),

		createEvent: build.mutation<TEventInput, TEventInput>({
			query: body => ({ url: '/api/events', method: 'POST', body }),
		}),

		updateEvent: build.mutation<TEventInput, IRequestUpdateEvent>({
			query: ({ eventId, data }) => ({
				url: `/api/events/${eventId}`,
				method: 'PUT',
				body: data,
			}),
		}),

		deleteEvent: build.mutation<void, number>({
			query: id => ({ url: `/api/events/${id}`, method: 'DELETE' }),
		}),

		joinEvent: build.mutation<IResponseJoinLeaveEvent, number>({
			query: eventId => ({
				url: `/api/events/${eventId}/join`,
				method: 'POST',
			}),
		}),

		leaveEvent: build.mutation<IResponseJoinLeaveEvent, number>({
			query: eventId => ({
				url: `/api/events/${eventId}/leave`,
				method: 'POST',
			}),
		}),

		getUserEvents: build.query<TEventInput[], IRequestGetUserEvents>({
			query: ({ userId, type = 'created' }) => ({
				url: `/api/events/user/${userId}?type=${type}`,
				method: 'GET',
			}),
		}),

			getFilteredEvents: build.query<
			IResponseGetFilteredEvents,
			IRequestGetFilteredEvents
		>({
			query: ({
				filters,
				search,
				searchField,
				sortBy,
				sortOrder,
				limit,
				offset,
			}) => {
				const params = new URLSearchParams()

				if (filters.events?.length) {
					params.set('events', filters.events.join(','))
				}
				if (filters.date.from && filters.date.to) {
					params.set('dateFrom', filters.date.from)
					params.set('dateTo', filters.date.to)
				}
				if (filters.typeOfGame?.length) {
					params.set('typeOfGame', filters.typeOfGame.join(','))
				}
				if (filters.levelOfPlayers?.length) {
					params.set('levelOfPlayers', filters.levelOfPlayers.join(','))
				}
				if (search?.trim()) {
					params.set('search', search.trim())
				}
				if (searchField) {
					params.set('searchField', searchField)
				}
				if (sortBy) {
					params.set('sortBy', sortBy)
					params.set('sortOrder', sortOrder || 'asc')
				}
				if (typeof limit === 'number') {
					params.set('limit', String(limit))
				}
				if (typeof offset === 'number') {
					params.set('offset', String(offset))
				}

				const queryString = params.toString()
				return queryString ? `/api/events?${queryString}` : '/api/events'
			},
		}),

		// ===== Message Endpoints =====
		getEventMessages: build.query<IEventMessage[], number>({
			query: eventId => ({
				url: `/api/events/${eventId}/messages`,
				method: 'GET',
			}),
			providesTags: (result, error, eventId) => [
				{ type: 'Event', id: `messages-${eventId}` },
			],
		}),

		createMessage: build.mutation<
			IEventMessage,
			{ eventId: number; message: string }
		>({
			query: ({ eventId, message }) => ({
				url: `/api/events/${eventId}/messages`,
				method: 'POST',
				body: { message },
			}),
			invalidatesTags: (result, error, { eventId }) => [
				{ type: 'Event', id: `messages-${eventId}` },
			],
		}),

		deleteMessage: build.mutation<
			void,
			{ eventId: number; messageId: number }
		>({
			query: ({ eventId, messageId }) => ({
				url: `/api/events/${eventId}/messages/${messageId}`,
				method: 'DELETE',
			}),
			invalidatesTags: (result, error, { eventId }) => [
				{ type: 'Event', id: `messages-${eventId}` },
			],
		}),
	}),
})

export const {
	useGetEventsQuery,
	useGetEventByIdQuery,
	useLazyGetEventByIdQuery,
	useCreateEventMutation,
	useUpdateEventMutation,
	useDeleteEventMutation,
	useJoinEventMutation,
	useLeaveEventMutation,
	useGetUserEventsQuery,
	useGetFilteredEventsQuery,
	useLazyGetFilteredEventsQuery,
	useGetEventMessagesQuery,
	useCreateMessageMutation,
	useDeleteMessageMutation,
} = eventService
