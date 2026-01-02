import { isAuthorized } from '@/middleware/authMiddleware'
import { validateBody } from '@/middleware/validateBody'
import { Router } from 'express'
import { eventController } from './event.controller'
import { eventMessageController } from './event.messageController'
import { eventSchema } from './schemas/event.schema'

const router = Router()

router.get('/api/events', eventController.getFilteredEvents)

router.get('/api/events/:id', eventController.getEventById)

router.post(
	'/api/events',
	isAuthorized,
	// validateBody(eventSchema),
	eventController.createEvent
)
router.put(
	'/api/events/:id',
	isAuthorized,
	validateBody(eventSchema.partial()),
	eventController.updateEvent
)

router.delete('/api/events/:id', isAuthorized, eventController.deleteEvent)

router.post('/api/events/:id/join', isAuthorized, eventController.joinEvent)

router.post('/api/events/:id/leave', isAuthorized, eventController.leaveEvent)

router.get('/api/events/user/:id', isAuthorized, eventController.getUserEvents)

// ===== Chat and message routes =====
router.get(
	'/api/events/:eventId/messages',
	isAuthorized,
	eventMessageController.getEventMessages
)
router.post(
	'/api/events/:eventId/messages',
	isAuthorized,
	eventMessageController.createMessage
)
router.delete(
	'/api/events/:eventId/messages/:messageId',
	isAuthorized,
	eventMessageController.deleteMessage
)

export const eventRouter = router
