import { useEffect } from 'react'
import { eventService } from '../services/EventService'
import { TEventInput } from '../shared/validations/event.schema'
import { useAppDispatch } from '../store/store'
import { getSocket } from './useSocket'

export const useEventWebSocket = () => {
	const dispatch = useAppDispatch()

	useEffect(() => {
		const socket = getSocket()
		if (!socket) return

		const handleEventUpdated = (event: TEventInput) => {
			console.log('📢 Event updated via websocket:', event.id)

			dispatch(
				eventService.util.updateQueryData('getEventById', event.id, () => event)
			)

			dispatch(
				eventService.util.updateQueryData(
					'getUserEvents',
					{ userId: event.creator.id, type: 'created' },
					draft => {
						const index = draft.findIndex(e => e.id === event.id)
						if (index !== -1) {
							draft[index] = event
						}
						return draft
					}
				)
			)

			event.participants?.forEach((participant: any) => {
				dispatch(
					eventService.util.updateQueryData(
						'getUserEvents',
						{ userId: participant.id, type: 'attending' },
						draft => {
							const index = draft.findIndex(e => e.id === event.id)
							if (index !== -1) {
								draft[index] = event
							}
							return draft
						}
					)
				)
			})

			dispatch(eventService.util.invalidateTags([{ type: 'Event' }]))
		}

		const handleEventDeleted = (eventId: number) => {
			console.log('🗑️ Event deleted via websocket:', eventId)

			dispatch(
				eventService.util.updateQueryData('getEventById', eventId, () => {
					return undefined
				})
			)

			dispatch(eventService.util.invalidateTags([{ type: 'UserEvents' }]))

			dispatch(eventService.util.invalidateTags([{ type: 'Event' }]))
		}

		const handleParticipantJoined = (event: TEventInput) => {
			console.log('Participant joined via websocket:', event.id)
			handleEventUpdated(event)
		}

		const handleParticipantLeft = (event: TEventInput) => {
			console.log('Participant left via websocket:', event.id)
			handleEventUpdated(event)
		}

		socket.on('event-updated', handleEventUpdated)
		socket.on('event-deleted', handleEventDeleted)
		socket.on('participant-joined', handleParticipantJoined)
		socket.on('participant-left', handleParticipantLeft)

		return () => {
			socket.off('event-updated', handleEventUpdated)
			socket.off('event-deleted', handleEventDeleted)
			socket.off('participant-joined', handleParticipantJoined)
			socket.off('participant-left', handleParticipantLeft)
		}
	}, [dispatch])
}
