import { Menu, X } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { useTopBar } from '../../../hooks/useTopBar'
import { IBaseButton } from '../../../shared/interfaces/models'
import BaseButton from '../../ui/buttons/BaseButton'
import { default as PageLoader } from '../../ui/loaders/PageLoader'
import { GlobalSocket } from '../../ui/GlobalSocket'

const logButtonProps: IBaseButton = {
	title: 'Увійти',
	to: '/login',
	styles: 'log-button',
}
const regButtonProps: IBaseButton = {
	title: 'Зареєструватися',
	to: '/signup',
	styles: 'reg-button',
}
const logoutButtonProps: IBaseButton = {
	title: 'Вийти',
	to: '/login',
	styles: 'reg-button',
}
const profileButtonProps: IBaseButton = {
	title: 'Профіль',
	to: '/profile',
	styles: 'log-button',
}
const eventsButtonProps: IBaseButton = {
	title: 'Події',
	to: '/events',
	styles: 'log-button',
}
const myEventsButtonProps: IBaseButton = {
	title: 'Мої події',
	to: '/myevents',
	styles: 'log-button',
}

function TopBar() {
	const { isAuthenticated, menuOpen, setMenuOpen, handleLogout } = useTopBar()

	const renderAuthButtons = () => (
		<>
			<BaseButton
				button={myEventsButtonProps}
				onButtonClick={() => setMenuOpen(false)}
			/>
			<BaseButton
				button={eventsButtonProps}
				onButtonClick={() => setMenuOpen(false)}
			/>
			<BaseButton
				button={profileButtonProps}
				onButtonClick={() => setMenuOpen(false)}
			/>
			<BaseButton button={logoutButtonProps} onButtonClick={handleLogout} />
		</>
	)
	const renderGuestButtons = () => (
		<>
			<BaseButton
				button={logButtonProps}
				onButtonClick={() => setMenuOpen(false)}
			/>
			<BaseButton
				button={regButtonProps}
				onButtonClick={() => setMenuOpen(false)}
			/>
		</>
	)

	return (
		<>
			<GlobalSocket />
			<PageLoader />
			<header className='fixed top-0 w-full bg-gradient-to-t from-gray-700 to-indigo-500 z-50'>
				<div className='flex items-center justify-between px-5 h-20'>
					{/* Logo */}
					<Link
						to='/'
						onClick={() => setMenuOpen(false)}
						className='flex items-center gap-2'
					>
						<div className='bg-shuttlecock_icon bg-no-repeat bg-left bg-cover h-16 w-16' />
						<span className='text-white text-lg font-semibold md:hidden'>
							BadmickTogether
						</span>
					</Link>

					{/* Desktop menu */}
					<nav className='flex gap-3 md:hidden'>
						{isAuthenticated ? renderAuthButtons() : renderGuestButtons()}
					</nav>

					{/* Burger icon */}
					<button
						type='button'
						aria-label='Toggle menu'
						onClick={() => setMenuOpen(!menuOpen)}
						className='hidden md:flex text-white'
					>
						{menuOpen ? <X size={32} /> : <Menu size={32} />}
					</button>
				</div>

				<nav
					className={`
						fixed inset-x-0 top-20 z-40
						flex flex-col gap-4
						px-5 pb-6 pt-20
						bg-gradient-to-b from-indigo-500 to-gray-700
						overflow-y-auto h-[calc(100vh-5rem)]
						transition-all duration-300 ease-in-out
						transform ${
							menuOpen
								? 'translate-y-0 opacity-100'
								: '-translate-y-4 opacity-0 pointer-events-none'
						}
						hidden md:flex
					`}
				>
					{isAuthenticated ? renderAuthButtons() : renderGuestButtons()}
				</nav>
			</header>
			<div className='pt-20'>
				<Outlet />
			</div>
		</>
	)
}

export default TopBar
