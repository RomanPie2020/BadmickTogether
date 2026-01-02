import { logger } from '@/utils/logger/log'
import { Server as HttpServer } from 'http'
import jwt from 'jsonwebtoken'
import { Socket, Server as SocketIOServer } from 'socket.io'
import { FRONT_URL } from './url'

interface AuthenticatedSocket extends Socket {
	userId?: number
}

let io: SocketIOServer | null = null

export const initializeSocket = (httpServer: HttpServer): SocketIOServer => {
	io = new SocketIOServer(httpServer, {
		cors: {
			origin: FRONT_URL,
			credentials: true,
		},
	})

	// Authentication middleware
	io.use((socket: any, next) => {
		const token = socket.handshake.auth.token

		if (!token) {
			return next(new Error('Authentication error'))
		}

		try {
			// Use the same fallback as tokenService to ensure consistency
			const secret = process.env.JWT_SECRET || 'abar'
			const decoded = jwt.verify(token, secret) as {
				id: number
			}
			socket.userId = decoded.id
			next()
		} catch (err) {
			logger.error('Socket authentication failed:', err)
			next(new Error('Authentication error'))
		}
	})

	io.on('connection', (socket: AuthenticatedSocket) => {
		logger.info(`User connected: ${socket.userId}`)

		// Join event room
		socket.on('join-event', (eventId: number) => {
			const roomName = `event-${eventId}`
			socket.join(roomName)
			logger.info(`User ${socket.userId} joined event room: ${roomName}`)
		})

		// Leave event room
		socket.on('leave-event', (eventId: number) => {
			const roomName = `event-${eventId}`
			socket.leave(roomName)
			logger.info(`User ${socket.userId} left event room: ${roomName}`)
		})

		// Handle disconnect
		socket.on('disconnect', () => {
			logger.info(`User disconnected: ${socket.userId}`)
		})
	})

	return io
}

export const getIO = (): SocketIOServer => {
	if (!io) {
		throw new Error('Socket.io not initialized!')
	}
	return io
}

// Emit new message to event room
export const emitNewMessage = (eventId: number, message: any) => {
	if (io) {
		io.to(`event-${eventId}`).emit('new-message', message)
		logger.info(`Emitted new message to event-${eventId}. MsgID: ${message.id}`)
	} else {
        logger.warn('Socket.IO not ready, cannot emit message')
    }
}

// Emit message deleted to event room
export const emitMessageDeleted = (eventId: number, messageId: number) => {
	if (io) {
		io.to(`event-${eventId}`).emit('message-deleted', messageId)
		logger.info(`Emitted message deleted to event-${eventId}. MsgID: ${messageId}`)
	} else {
        logger.warn('Socket.IO not ready, cannot emit delete event')
    }
}

// Emit event updated to event room and all users
export const emitEventUpdated = (event: any) => {
	if (io) {
		// Emit to the specific event room
		io.to(`event-${event.id}`).emit('event-updated', event)
		// Also emit to all connected clients for list updates
		io.emit('event-updated', event)
		logger.info(`Emitted event updated: ${event.id}`)
	} else {
		logger.warn('Socket.IO not ready, cannot emit event update')
	}
}

// Emit event deleted to event room and all users
export const emitEventDeleted = (eventId: number) => {
	if (io) {
		// Emit to the specific event room
		io.to(`event-${eventId}`).emit('event-deleted', eventId)
		// Also emit to all connected clients for list updates
		io.emit('event-deleted', eventId)
		logger.info(`Emitted event deleted: ${eventId}`)
	} else {
		logger.warn('Socket.IO not ready, cannot emit event delete')
	}
}

// Emit participant joined to event room
export const emitParticipantJoined = (eventId: number, event: any) => {
	if (io) {
		io.to(`event-${eventId}`).emit('participant-joined', event)
		// Also emit to all connected clients for list updates
		io.emit('event-updated', event)
		logger.info(`Emitted participant joined event: ${eventId}`)
	} else {
		logger.warn('Socket.IO not ready, cannot emit participant joined')
	}
}

// Emit participant left to event room
export const emitParticipantLeft = (eventId: number, event: any) => {
	if (io) {
		io.to(`event-${eventId}`).emit('participant-left', event)
		// Also emit to all connected clients for list updates
		io.emit('event-updated', event)
		logger.info(`Emitted participant left event: ${eventId}`)
	} else {
		logger.warn('Socket.IO not ready, cannot emit participant left')
	}
}
