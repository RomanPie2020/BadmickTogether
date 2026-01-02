import ApiError from '@/exceptions/apiError'
import UserProfile from '@/profile/models/userProfile'
import { logger } from '@/utils/logger/log'
import User from '../auth/models/user'
import { emitMessageDeleted, emitNewMessage } from '../config/socket'
import EventModel from './models/event'
import EventMessage from './models/eventMessage'

class EventMessageService {
	// Get all messages for an event
	async getEventMessages(eventId: number) {
		try {
			const event = await EventModel.findByPk(eventId)
			if (!event) {
				throw ApiError.NotFound('Event not found')
			}

			const messages = await EventMessage.findAll({
				where: { eventId },
				include: [
					{
						model: User,
						as: 'user',
						attributes: ['id', 'username'],
						include: [
							{
								model: UserProfile,
								as: 'profile',
								attributes: ['nickname', 'avatarUrl'],
								required: false,
							},
						],
					},
				],
				order: [['createdAt', 'ASC']],
			})

			return messages
		} catch (error) {
			logger.error('Error fetching event messages:', error)
			if (error instanceof ApiError) throw error
			throw ApiError.InternalServerError('Message could not be received')
		}
	}

	// Create a new message
	async createMessage(eventId: number, userId: number, message: string) {
		try {
			// Check if event exists
			const event = await EventModel.findByPk(eventId)
			if (!event) {
				throw ApiError.NotFound('Івент не знайдено')
			}

			// Check if user is a participant or creator
			const participants = await event.getParticipants()
			const isParticipant = participants.some(p => p.id === userId)
			const isCreator = event.creatorId === userId

			if (!isParticipant && !isCreator) {
				throw ApiError.Forbidden(
					'Тільки учасники події можуть писати повідомлення'
				)
			}

			// Create the message
			const newMessage = await EventMessage.create({
				eventId,
				userId,
				message: message.trim(),
			})

			// Fetch the message with user data
			const messageWithUser = await EventMessage.findByPk(newMessage.id, {
				include: [
					{
						model: User,
						as: 'user',
						attributes: ['id', 'username'],
						include: [
							{
								model: UserProfile,
								as: 'profile',
								attributes: ['nickname', 'avatarUrl'],
								required: false,
							},
						],
					},
				],
			})

			logger.info(`Message created for event ${eventId} by user ${userId}`)

			// Emit WebSocket event
			emitNewMessage(eventId, messageWithUser)

			return messageWithUser
		} catch (error) {
			logger.error('Error creating message:', error)
			if (error instanceof ApiError) throw error
			throw ApiError.InternalServerError('Не вдалося створити повідомлення')
		}
	}

	// Delete a message (only by the author)
	async deleteMessage(messageId: number, userId: number) {
		try {
			const message = await EventMessage.findByPk(messageId)
			if (!message) {
				throw ApiError.NotFound('Повідомлення не знайдено')
			}

			if (message.userId !== userId) {
				throw ApiError.Forbidden('Ви можете видалити тільки свої повідомлення')
			}

			const eventId = message.eventId
			await message.destroy()
			logger.info(`Message ${messageId} deleted by user ${userId}`)

			// Emit WebSocket event
			emitMessageDeleted(eventId, messageId)
		} catch (error) {
			logger.error('Error deleting message:', error)
			if (error instanceof ApiError) throw error
			throw ApiError.InternalServerError('Не вдалося видалити повідомлення')
		}
	}
}

export const eventMessageService = new EventMessageService()
