import { format } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import { getSocket } from '../../hooks/useSocket'
import {
	eventService,
	useCreateMessageMutation,
	useGetEventMessagesQuery,
} from '../../services/EventService'
import { IEventMessage } from '../../shared/interfaces/models'
import { useAppDispatch } from '../../store/store'

interface IEventChatProps {
	eventId: number
	currentUserId: number
	currentUsername: string
	currentUserAvatar?: string
}

const EventChat = ({
	eventId,
	currentUserId,
}: Omit<IEventChatProps, 'currentUsername' | 'currentUserAvatar'>) => {
	const [newMessage, setNewMessage] = useState('')
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const dispatch = useAppDispatch()

	// Ensure eventId is a number
	const numericEventId = Number(eventId)

	// Fetch messages from API
	const {
		data: messages = [],
		isLoading,
		error,
	} = useGetEventMessagesQuery(numericEventId)

	// Create message mutation
	const [createMessage, { isLoading: isSending }] = useCreateMessageMutation()

	// Get socket instance
	const socketInstance = getSocket()
	const [isConnected, setIsConnected] = useState(
		socketInstance?.connected ?? false
	)

	// Monitor socket connection status
	useEffect(() => {
		if (!socketInstance) {
			setIsConnected(false)
			return
		}

		setIsConnected(socketInstance.connected)

		const handleConnect = () => {
			setIsConnected(true)
		}

		const handleDisconnect = () => {
			setIsConnected(false)
		}

		socketInstance.on('connect', handleConnect)
		socketInstance.on('disconnect', handleDisconnect)

		return () => {
			socketInstance.off('connect', handleConnect)
			socketInstance.off('disconnect', handleDisconnect)
		}
	}, [socketInstance])

	// WebSocket integration
	useEffect(() => {
		if (!socketInstance) return

		// Wait for connection before joining room
		const joinRoom = () => {
			if (socketInstance && socketInstance.connected) {
				socketInstance.emit('join-event', numericEventId)
			}
		}

		// If already connected, join immediately
		if (socketInstance.connected) {
			joinRoom()
		} else {
			// Otherwise wait for connection
			socketInstance.once('connect', joinRoom)
		}

		// Listen for new messages
		const handleNewMessage = (message: IEventMessage) => {
			// Update cache
			dispatch(
				eventService.util.updateQueryData(
					'getEventMessages',
					numericEventId,
					draft => {
						// Check if message already exists to avoid duplicates
						const exists = draft.find(m => m.id === message.id)
						if (!exists) {
							draft.push(message)
						}
					}
				)
			)
			// Trigger scroll after state update
			setTimeout(scrollToBottom, 100)
		}

		// Listen for deleted messages
		const handleMessageDeleted = (messageId: number) => {
			// Update cache
			dispatch(
				eventService.util.updateQueryData(
					'getEventMessages',
					numericEventId,
					draft => {
						return draft.filter(m => m.id !== messageId)
					}
				)
			)
		}

		socketInstance.on('new-message', handleNewMessage)
		socketInstance.on('message-deleted', handleMessageDeleted)

		// Cleanup
		return () => {
			if (socketInstance) {
				if (socketInstance.connected) {
					socketInstance.emit('leave-event', numericEventId)
				}
				socketInstance.off('new-message', handleNewMessage)
				socketInstance.off('message-deleted', handleMessageDeleted)
				socketInstance.off('connect', joinRoom)
			}
		}
	}, [numericEventId, dispatch, socketInstance])

	// Auto-scroll to bottom when new messages arrive
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newMessage.trim() || isSending) return

		try {
			// Don't update cache manually here, wait for socket event or mutation response
			await createMessage({
				eventId: numericEventId,
				message: newMessage.trim(),
			}).unwrap()
			setNewMessage('')
		} catch (error) {
			console.error('Failed to send message:', error)
		}
	}

	const getDisplayName = (msg: IEventMessage) => {
		return msg.user?.profile?.nickname || msg.user?.username || 'User'
	}

	const getAvatarUrl = (msg: IEventMessage) => {
		return msg.user?.profile?.avatarUrl
	}

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='text-gray-500'>Завантаження повідомлень...</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='text-red-500'>
					Помилка завантаження повідомлень. Спробуйте оновити сторінку.
				</div>
			</div>
		)
	}

	return (
		<div className='flex flex-col h-full'>
			{/* Chat Header */}
			<div className='border-b pb-2 mb-3'>
				<div className='flex justify-between items-center'>
					<h3 className='text-lg font-semibold flex items-center gap-2'>
						💬 Чат події
					</h3>
					<div className='flex items-center gap-2'>
						<span
							className={`w-2 h-2 rounded-full ${
								isConnected ? 'bg-green-500' : 'bg-red-500'
							}`}
							title={isConnected ? 'Connected' : 'Disconnected'}
						/>
						<span className='text-xs text-gray-500'>
							{messages.length}{' '}
							{messages.length === 1 ? 'повідомлення' : 'повідомлень'}
						</span>
					</div>
				</div>
			</div>

			{/* Messages Container */}
			<div className='flex-1 overflow-y-auto mb-3 space-y-3 max-h-64 min-h-[200px]'>
				{messages.length === 0 ? (
					<div className='flex items-center justify-center h-full text-gray-400'>
						<p>Поки що немає повідомлень. Будьте першим! 👋</p>
					</div>
				) : (
					messages.map(msg => (
						<div
							key={msg.id}
							className={`flex gap-2 ${
								msg.userId === currentUserId ? 'flex-row-reverse' : 'flex-row'
							}`}
						>
							{/* Avatar */}
							<div className='flex-shrink-0'>
								{getAvatarUrl(msg) ? (
									<img
										src={getAvatarUrl(msg)!}
										alt={getDisplayName(msg)}
										className='w-8 h-8 rounded-full object-cover'
									/>
								) : (
									<div className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold'>
										{getDisplayName(msg).charAt(0).toUpperCase()}
									</div>
								)}
							</div>

							{/* Message Content */}
							<div
								className={`flex flex-col max-w-[75%] ${
									msg.userId === currentUserId ? 'items-end' : 'items-start'
								}`}
							>
								<div
									className={`rounded-2xl px-4 py-2 ${
										msg.userId === currentUserId
											? 'bg-blue-600 text-white rounded-tr-sm'
											: 'bg-gray-100 text-gray-800 rounded-tl-sm'
									}`}
								>
									{msg.userId !== currentUserId && (
										<p className='text-xs font-semibold mb-1 opacity-70'>
											{getDisplayName(msg)}
										</p>
									)}
									<p className='text-sm break-words'>{msg.message}</p>
								</div>
								<span className='text-xs text-gray-400 mt-1 px-1'>
									{format(new Date(msg.createdAt), 'HH:mm')}
								</span>
							</div>
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Message Input */}
			<form onSubmit={handleSendMessage} className='border-t pt-3'>
				<div className='flex gap-2'>
					<input
						type='text'
						value={newMessage}
						onChange={e => setNewMessage(e.target.value)}
						placeholder='Напишіть повідомлення...'
						className='flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
						disabled={isSending}
					/>
					<button
						type='submit'
						disabled={!newMessage.trim() || isSending}
						className='px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium'
					>
						{isSending ? '⏳' : '📤'}
					</button>
				</div>
			</form>
		</div>
	)
}

export default EventChat
