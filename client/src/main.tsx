import { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import TopBar from './components/layout/TopBar/TopBar'
import EnterEmail from './components/screens/EnterEmail'
import { ErrorPage } from './components/screens/ErrorPage'
import EventList from './components/screens/EventList'
import GoogleSuccess from './components/screens/GoogleSuccess'
import Home from './components/screens/Home'
import LogIn from './components/screens/LogIn'
import { RegisterConfirm } from './components/screens/RegisterConfirm'
import ResetPassword from './components/screens/ResetPassword'
import SignUp from './components/screens/SignUp'
import Loader from './components/ui/loaders/Loader'
import './index.css'
import { store } from './store/store'
import App from './App'

const MyProfile = lazy(() => import('./components/screens/MyProfile'))
const MyEvents = lazy(() => import('./components/screens/MyEvents'))
const UserProfile = lazy(() => import('./components/screens/UserProfile'))

const withSuspense = (element: JSX.Element) => (
	<Suspense
		fallback={
			<div className='mt-48'>
				<Loader />
			</div>
		}
	>
		{element}
	</Suspense>
)
const router = createBrowserRouter([
	{
		path: '/',
		element: <TopBar />,
		errorElement: <ErrorPage />,
		children: [
			{
				index: true,
				element: <Home />,
			},
			{
				path: '/login',
				element: <LogIn />,
			},
			{
				path: '/signup',
				element: <SignUp />,
			},
			{
				path: '/auth/confirm',
				element: <RegisterConfirm />,
			},
			{
				path: '/google/success',
				element: <GoogleSuccess />,
			},
			{
				path: '/enter-email',
				element: <EnterEmail />,
			},
			{
				path: '/auth/reset-password',
				element: <ResetPassword />,
			},
			{
				path: '/events',
				element: <EventList />,
			},

			{ path: '/profile', element: withSuspense(<MyProfile />) },
			{ path: '/myevents', element: withSuspense(<MyEvents />) },
			{ path: '/users/:id/profile', element: withSuspense(<UserProfile />) },
		],
	},
])

ReactDOM.createRoot(document.getElementById('root')!).render(
	<Provider store={store}>
		<RouterProvider router={router} />
	</Provider>
)
