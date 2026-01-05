import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { apiUrl } from '../configs/url.config'
import { TSocket } from '../shared/interfaces/models'

let socket: TSocket = null

export const useSocket = (token: string | null) => {
	const socketRef = useRef<TSocket>(null)
	const [isConnected, setIsConnected] = useState(false)

	useEffect(() => {
		if (!token) {
			if (socket) {
				socket.disconnect()
				socket = null
				socketRef.current = null
				setIsConnected(false)
			}
			return
		}

		// Connect or Reconnect if token changed
		if (socket) {
			const currentAuthValues = socket.auth as any
			if (currentAuthValues?.token !== token) {
				socket.disconnect()
				socket = null
				socketRef.current = null
				setIsConnected(false)
			}
		}

		if (!socket) {
			socket = io(apiUrl, {
				auth: {
					token,
				},
				autoConnect: true,
				transports: ['websocket', 'polling'],
				reconnection: true,
				reconnectionAttempts: 5,
				reconnectionDelay: 1000,
			})

			socket.on('connect', () => {
				console.log('✅ Connected to WebSocket server')
				setIsConnected(true)
			})

			socket.on('disconnect', () => {
				console.log('❌ Disconnected from WebSocket server')
				setIsConnected(false)
			})

			socket.on('connect_error', error => {
				console.error('WebSocket connection error:', error.message)
				setIsConnected(false)
			})

			setIsConnected(socket.connected)
		}

		socketRef.current = socket
	}, [token])

	return { socket: socketRef.current, isConnected }
}

export const getSocket = (): TSocket => {
	return socket
}

export const isSocketConnected = (): boolean => {
	return socket?.connected ?? false
}
