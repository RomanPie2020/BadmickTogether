import { useEffect } from 'react'
import { useEventWebSocket } from '../../hooks/useEventWebSocket'
import { useSocket } from '../../hooks/useSocket'
import { useAppSelector } from '../../store/store'

export const GlobalSocket = () => {
	const isAuthenticated = useAppSelector(
		state => state.authStatus.isAuthenticated
	)

	// Get token from localStorage
	const token = localStorage.getItem('access_token')

	// Initialize socket if authenticated
	const { isConnected } = useSocket(isAuthenticated ? token : null)

	// Listen for event-related websocket events
	useEventWebSocket()
	console.log('Render:', { isAuthenticated, isConnected, token })
	// Log connection status for debugging
	useEffect(() => {
		if (isAuthenticated) {
			console.log(
				'Socket connection status:',
				isConnected ? '✅ Connected' : '⏳ Connecting...'
			)
		}
	}, [isAuthenticated, isConnected])

	return null
}
