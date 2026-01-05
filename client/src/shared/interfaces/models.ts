import { MouseEventHandler } from 'react'
import {
	FieldValues,
	Path,
	RegisterOptions,
	UseFormSetError,
} from 'react-hook-form'
import { TEventInput } from '../validations/event.schema'
import { Socket } from 'socket.io-client'

// topBar
export interface IBaseButton {
	title: string
	styles: any
	to: string
	type?: TBaseButtonType
}

export type TBaseButtonClickHandler = MouseEventHandler<
	HTMLButtonElement | HTMLAnchorElement
>

export type TBaseButtonType = 'a' | 'button'

// FormInput
export interface IFormInput<T extends FieldValues> {
	name: Path<T>
	label?: string
	type?: React.HTMLInputTypeAttribute
	placeholder?: string
	rules?: RegisterOptions<T, Path<T>>
	validateWith?: Path<T> //  for a secure password of the user
}

// FormBuilder
export type TFormBuilderSubmitHandler<T extends FieldValues> = (
	data: T,
	helpers?: { setError: UseFormSetError<T> }
) => void | Promise<void>

// LogInForm
export interface ILogInData {
	email: string
	password: string
}
export interface ILogInFormProps {
	onSubmit: (userData: ILogInData) => void
	// errorMessage?: string | null
}

// SignUpForm
export interface ISignUpData {
	email: string
	username: string
	password: string
	passwordConfirmation: string
}
export interface ISignUpFormProps {
	onSubmit: TFormBuilderSubmitHandler<ISignUpData>
	errorMessage?: string
}

// Code verification
export interface ICodeSendAgain {
	user_id: string | number
}

// Auth state
export interface IAuthState {
	isAuthenticated: boolean
}

// ---- Auth service ----
export interface IApiResponse {
	success: boolean
	message: string
}
// SignUp
export interface IResponseSignUp {
	id: number
	email: string
	username: string
	first_name: string
	last_name: string
	password: string
}

export interface IRequestSignUp {
	email: string
	username: string
	password: string
}

// confirmRegistration
export type TResponseConfirmRegistration = IApiResponse

// LogIn
export interface IResponseLogIn {
	accessToken: string
	refreshToken: string
	success: boolean
	user: {
		email: string
		id: number
		username: string
	}
}

export interface IRequestLogIn {
	email: string
	password: string
}

// Refresh Token
export interface IResponseRefreshToken {
	accessToken: string
}

export interface IRequestRefreshToken {
	refreshToken: string
}

// LogOut
export type IResponseLogOut = IApiResponse

export interface IRequestLogOut {
	refreshToken: string
}

// getUsers
export interface IUserGetUsers {
	id: number
	username: string
	email: string
	isActive: boolean
}

export interface IResponseGetUsers {
	success: boolean
	users: IUserGetUsers[]
}

// ForgotPassword
export interface IRequestForgotPassword {
	email: string
}
export type TResponseForgotPassword = IApiResponse

// ResetPassword
export interface IResetPasswordRequest {
	token: string
	body: {
		newPassword: string
		confirmPassword: string
	}
}
export type TResponseResetPassword = IApiResponse

// Profile
export type IResponseGetProfile = IUserProfile
export type IRequestUpdateProfile = TProfileFormData

// ---- Event Service ----
export interface IRequestUpdateEvent {
	eventId: number
	data: TEventInput
}

export interface IResponseJoinLeaveEvent {
	success: boolean
}

export interface IRequestJoinLeaveEvent {
	eventId: number
}

export type TTypeOfUserEvents = 'created' | 'attending' | 'all'
export interface IRequestGetUserEvents {
	userId: number
	type: TTypeOfUserEvents
}

export interface IResponseGetFilteredEvents {
	events: TEventInput[]
	total: number
	limit: number
	offset: number
}

export interface IRequestGetFilteredEvents {
	filters: IFilters
	search?: string
	searchField: TSearchField
	sortBy: TSortBy
	sortOrder: TSortOrder
	limit: number
	offset: number
}

// ---- Components ----
// Enter email
export interface IEnterEmailData {
	email: string
}

export interface IEnterEmailFormProps {
	onSubmit: (userData: IEnterEmailData) => void
}

// Reset password
export interface IResetPasswordData {
	newPassword: string
	confirmPassword: string
}

export interface IResetPasswordFormProps {
	onSubmit: (userData: IResetPasswordData) => void
}

// Events
// export interface EventWithRelations {
// 	id: number
// 	title: string
// 	location: string
// 	eventDate: string
// 	creator: { id: number; username: string; profile?: { nickname: string } }
// 	maxParticipants?: number
// 	participants: { id: number }[]
// }
export interface IParticipant {
	id: number
	username: string
	profile: { nickname: string }
	nickname?: string
	avatarUrl?: string | null
}

// EventList
export type TSearchField = 'title' | 'location' | 'creator'
export type TSortBy = 'eventDate' | 'title' | 'location'
export type TSortOrder = 'asc' | 'desc'
export type TModalState = number | null
export type TTypeOfLoadingEvents = 'mount' | 'search' | 'pagination'

// Date
export type TDateRange = {
	from: string | null
	to: string | null
}

// User profile
export type TGender = 'male' | 'female' | 'other' | null
export type TDominantHand = 'left' | 'right' | null
export type TPreferredFormat = 'singles' | 'doubles' | 'mixed' | null
export interface IUserProfile {
	id: number
	username?: string
	email?: string
	userId: number

	nickname: string
	avatarUrl?: string | null
	city: string | null
	age: number | null
	gender: TGender

	level: string | null
	experienceMonths: number | null
	dominantHand: TDominantHand
	preferredFormat: TPreferredFormat
	playFrequency: string | null
	commonPlaces: string[] | null
	playTime: string | null

	bio: string | null
	contact: string | null

	rating: number
	reviewsCount: number

	createdAt: string
	updatedAt: string
}

export type TProfileFormData = Partial<
	Pick<
		IUserProfile,
		| 'nickname'
		| 'avatarUrl'
		| 'city'
		| 'age'
		| 'gender'
		| 'level'
		| 'experienceMonths'
		| 'dominantHand'
		| 'preferredFormat'
		| 'playFrequency'
		| 'commonPlaces'
		| 'playTime'
		| 'bio'
		| 'contact'
	>
>

export type TProfileFieldType = 'text' | 'number' | 'email' | 'tel' | 'password'

// Filters
export type TTypeOfEvent =
	| 'Турнір'
	| 'Тренування'
	| 'Дружня гра'
	| 'Приватна гра'
	| 'Клубний захід'

export type TTypeOfGame = 'Одиночна' | 'Парна' | 'Змішана' | 'Командна'
export type TLevelOfPlayers = 'Новачок' | 'Середній' | 'Просунутий' | 'Профі'
export interface IFilters {
	events?: TTypeOfEvent[]
	date: TDateRange
	typeOfGame?: TTypeOfGame[]
	levelOfPlayers?: TLevelOfPlayers[]
}

export interface IFiltersState {
	modalOpen: boolean
	values: {
		events: string[]
		date: TDateRange
		typeOfGame: string[]
		levelOfPlayers: string[]
	}
}
export interface IFilterActionPayload {
	category: keyof IFiltersState['values']
	value: string | TDateRange
}

// ---- Chat ----

// Message interface
export interface IEventMessage {
	id: number
	eventId: number
	userId: number
	message: string
	createdAt: string
	updatedAt: string
	user: {
		id: number
		username: string
		profile?: {
			nickname: string
			avatarUrl?: string | null
		}
	}
}

export type TSocket = Socket | null
