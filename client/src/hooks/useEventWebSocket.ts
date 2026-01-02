import { useEffect } from 'react'
import { eventService } from '../services/EventService'
import { TEventInput } from '../shared/validations/event.schema'
import { useAppDispatch } from '../store/store'
import { getSocket } from './useSocket'

/**
 * Global hook to listen for event-related websocket events
 * This should be used once at the app level (e.g., in App.tsx or GlobalSocket)
 */
export const useEventWebSocket = () => {
	const dispatch = useAppDispatch()

	useEffect(() => {
		const socket = getSocket()
		if (!socket) return

		// Handle event updated (edit, join, leave)
		const handleEventUpdated = (event: TEventInput) => {
			console.log('📢 Event updated via websocket:', event.id)
			
			// Update getEventById cache
			dispatch(
				eventService.util.updateQueryData('getEventById', event.id, () => event)
			)

			// Update getUserEvents cache for all users who might have this event
			// We update all cached getUserEvents queries
			dispatch(
				eventService.util.updateQueryData(
					'getUserEvents',
					{ userId: event.creatorId, type: 'created' },
					(draft) => {
						const index = draft.findIndex(e => e.id === event.id)
						if (index !== -1) {
							draft[index] = event
						}
						return draft
					}
				)
			)

			// Update attending events for all participants
			event.participants?.forEach((participant: any) => {
				dispatch(
					eventService.util.updateQueryData(
						'getUserEvents',
						{ userId: participant.id, type: 'attending' },
						(draft) => {
							const index = draft.findIndex(e => e.id === event.id)
							if (index !== -1) {
								draft[index] = event
							}
							return draft
						}
					)
				)
			})

			// Invalidate queries that might be affected
			dispatch(eventService.util.invalidateTags([{ type: 'Event' }]))
		}

		// Handle event deleted
		const handleEventDeleted = (eventId: number) => {
			console.log('🗑️ Event deleted via websocket:', eventId)
			
			// Remove from getEventById cache
			dispatch(
				eventService.util.updateQueryData('getEventById', eventId, () => {
					// Return undefined to remove from cache
					return undefined as any
				})
			)

			// Remove from all getUserEvents caches
			// We can't easily know all user IDs, so we invalidate instead
			dispatch(eventService.util.invalidateTags([{ type: 'UserEvents' }]))

			// Invalidate all event-related queries
			dispatch(eventService.util.invalidateTags([{ type: 'Event' }]))
		}

		// Handle participant joined
		const handleParticipantJoined = (event: TEventInput) => {
			console.log('👋 Participant joined via websocket:', event.id)
			handleEventUpdated(event)
		}

		// Handle participant left
		const handleParticipantLeft = (event: TEventInput) => {
			console.log('👋 Participant left via websocket:', event.id)
			handleEventUpdated(event)
		}

		// Register event listeners
		socket.on('event-updated', handleEventUpdated)
		socket.on('event-deleted', handleEventDeleted)
		socket.on('participant-joined', handleParticipantJoined)
		socket.on('participant-left', handleParticipantLeft)

		// Cleanup
		return () => {
			socket.off('event-updated', handleEventUpdated)
			socket.off('event-deleted', handleEventDeleted)
			socket.off('participant-joined', handleParticipantJoined)
			socket.off('participant-left', handleParticipantLeft)
		}
	}, [dispatch])
}
