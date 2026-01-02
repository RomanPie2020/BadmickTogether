import { logger } from '@/utils/logger/log'
import cors from 'cors'
import express, { urlencoded } from 'express'
import { createServer } from 'http'

import { authRouter } from '@/auth/auth.routes'
import { oAuthService } from '@/auth/services/auth.oAuthService'
import sequelizeConnect from '@/config/database'
import { errorHandler } from '@/middleware/auth.errorMiddleware'

import { FRONT_URL } from '@/config/url'
import { eventRouter } from '@/event/event.routes'
import { profileRouter } from '@/profile/profile.routes'
import compression from 'compression'
import helmet from 'helmet'
import passport from 'passport'
import { initializeSocket } from './config/socket'

const app = express()
const httpServer = createServer(app)

// Initialize Socket.IO
const io = initializeSocket(httpServer)
logger.info('Socket.IO initialized')

// Middleware
app.use(
	cors({
		origin: FRONT_URL,
		credentials: true,
	})
)

app.use(express.json())
app.use(urlencoded({ extended: false }))
app.use(helmet())
app.use(compression())
//  Перевірка підключення до бази даних
const testDbConnection = async () => {
	try {
		await sequelizeConnect.authenticate()
		logger.info('Database connection has been established successfully12.')
	} catch (error) {
		logger.error('Unable to connect to the database:', error)
	}
}

// Тестовий роут
app.get('/api/health', (req, res) => {
	res.json({ message: 'Server is running' })
	logger.info('Health check endpoint was called')
})

oAuthService.configureGoogleStrategy(passport)
app.use(passport.initialize())

app.use(authRouter)
app.use(profileRouter)
app.use(eventRouter)

app.use(errorHandler)
app.all('*', (req, res) => {
	res.status(404).json({ message: 'Not found' })
})

const PORT = process.env.PORT || 3000

// logger.info(`database password is: ${typeof process.env.DB_PASSWORD}`)
httpServer.listen(PORT, async () => {
	logger.info(`Server is running on1 port ${PORT}`)
	await testDbConnection()
})
