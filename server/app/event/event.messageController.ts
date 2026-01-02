import { NextFunction, Request, Response } from 'express'
import { eventMessageService } from './event.messageService'

class EventMessageController {
	async getEventMessages(req: Request, res: Response, next: NextFunction) {
		try {
			const eventId = Number(req.params.eventId)
			const messages = await eventMessageService.getEventMessages(eventId)
			res.json(messages)
		} catch (err) {
			next(err)
		}
	}

	async createMessage(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.id
			const eventId = Number(req.params.eventId)
			const { message } = req.body

			if (!message || typeof message !== 'string' || message.trim() === '') {
				return res.status(400).json({ error: 'The message cannot be empty' })
			}

			const newMessage = await eventMessageService.createMessage(
				eventId,
				userId,
				message
			)
			res.status(201).json(newMessage)
		} catch (err) {
			next(err)
		}
	}

	async deleteMessage(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.id
			const messageId = Number(req.params.messageId)

			await eventMessageService.deleteMessage(messageId, userId)
			res.status(204).end()
		} catch (err) {
			next(err)
		}
	}
}

export const eventMessageController = new EventMessageController()
