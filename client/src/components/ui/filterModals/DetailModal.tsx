import { format } from 'date-fns'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IParticipant } from '../../../shared/interfaces/models'
import { TEventInput } from '../../../shared/validations/event.schema'
import EventChat from '../EventChat'

interface IDetailModalProps {
	event: TEventInput
	currentUserId: number
	onClose: () => void
	onJoin: () => void
	onLeave: () => void
}

type TabType = 'details' | 'chat'

const DetailModal = ({
	event,
	currentUserId,
	onClose,
	onJoin,
	onLeave,
}: IDetailModalProps) => {
	const navigate = useNavigate()
	const [activeTab, setActiveTab] = useState<TabType>('details')
	
	const joined = event.participants.some(
		(u: IParticipant) => u.id === currentUserId
	)
	const isFull =
		typeof event.maxParticipants === 'number' &&
		event.participants.length >= event.maxParticipants

	// Get current user info for chat
	const currentUser = event.participants.find(
		(u: IParticipant) => u.id === currentUserId
	)

	console.log(event)
	return (
		<div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50 text-justify hyphens-auto p-4'>
			<div className='bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col relative'>
				<button
					onClick={onClose}
					className='absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition'
				>
					✕
				</button>
				
				{/* Header */}
				<div className='p-6 pb-0'>
					<h2 className='text-2xl font-semibold mb-4 mt-4 break-words pr-8'>
						{event.title}
					</h2>
					
					{/* Tabs */}
					<div className='flex gap-4 border-b'>
						<button
							onClick={() => setActiveTab('details')}
							className={`pb-3 px-2 font-medium transition-colors relative ${
								activeTab === 'details'
									? 'text-blue-600'
									: 'text-gray-500 hover:text-gray-700'
							}`}
						>
							📋 Деталі
							{activeTab === 'details' && (
								<div className='absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600' />
							)}
						</button>
						<button
							onClick={() => setActiveTab('chat')}
							className={`pb-3 px-2 font-medium transition-colors relative ${
								activeTab === 'chat'
									? 'text-blue-600'
									: 'text-gray-500 hover:text-gray-700'
							}`}
						>
							💬 Чат
							{activeTab === 'chat' && (
								<div className='absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600' />
							)}
						</button>
					</div>
				</div>

				{/* Content */}
				<div className='flex-1 overflow-y-auto p-6'>
					{activeTab === 'details' ? (
						<div>
							<div className='mb-4 text-xl text-gray-600'>
								<p>📅 {format(new Date(event.eventDate), 'dd.MM.yyyy HH:mm')}</p>
								<p>📍 {event.location}</p>
							</div>
							<p className='text-gray-600 mb-2'>
								🏷️ <span className='font-medium'>Тип події:</span> {event.eventType}
							</p>
							<p className='text-gray-600 mb-2'>
								🎮 <span className='font-medium'>Формат гри:</span> {event.gameType}
							</p>
							<p className='text-gray-600 mb-4'>
								⭐ <span className='font-medium'>Рівень гравців:</span>{' '}
								{event.levelOfPlayers}
							</p>

							<p className='text-gray-700 mb-4 break-words'>
								{event.description || '— немає опису —'}
							</p>

							<div className='flex justify-end gap-3 mb-6'>
								{!joined && !isFull && (
									<button
										onClick={() => onJoin()}
										className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition'
									>
										Приєднатися
									</button>
								)}
								{joined && (
									<button
										onClick={() => onLeave()}
										className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition'
									>
										Вийти
									</button>
								)}
								{isFull && !joined && (
									<span className='block text-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg'>
										Усі місця зайнято
									</span>
								)}
							</div>

							<h3 className='text-lg font-medium mt-6 mb-2'>
								Учасники ({event.participants.length}
								{event.maxParticipants != null && <> / {event.maxParticipants}</>})
							</h3>
							{event.participants.length === 0 ? (
								<p className='text-gray-500'>Ще ніхто не приєднався.</p>
							) : (
								<ul className='list-disc list-inside space-y-1 max-h-64 overflow-auto'>
									{event.participants.map((user: IParticipant) => (
										<li
											key={user.id}
											className='flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition'
										>
											{user.avatarUrl ? (
												<img
													src={user.avatarUrl}
													alt={user.nickname || user.username}
													className='w-8 h-8 rounded-full object-cover'
												/>
											) : (
												<div className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold'>
													{(user.nickname || user.username || 'U').charAt(0).toUpperCase()}
												</div>
											)}

											<button
												onClick={() => {
													onClose()
													navigate(`/users/${user.id}/profile`)
												}}
												className='text-blue-600 hover:underline font-medium'
											>
												{user.profile?.nickname ?? user.username ?? 'Unknown user'}
											</button>
										</li>
									))}
								</ul>
							)}
						</div>
					) : (
						<EventChat
							eventId={event.id}
							currentUserId={currentUserId}
							currentUsername={currentUser?.username || 'User'}
							currentUserAvatar={currentUser?.avatarUrl}
						/>
					)}
				</div>
			</div>
		</div>
	)
}

export default DetailModal
