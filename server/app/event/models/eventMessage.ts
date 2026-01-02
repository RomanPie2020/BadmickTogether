import { DataTypes, Model, Optional } from 'sequelize'
import User from '../../auth/models/user'
import sequelize from '../../config/database'
import EventModel from './event'

// Event message attributes
export interface EventMessageAttributes {
	id: number
	eventId: number
	userId: number
	message: string
	createdAt?: Date
	updatedAt?: Date
}

// Fields needed when creating
interface EventMessageCreationAttributes
	extends Optional<EventMessageAttributes, 'id'> {}

class EventMessage
	extends Model<EventMessageAttributes, EventMessageCreationAttributes>
	implements EventMessageAttributes
{
	declare id: number
	declare eventId: number
	declare userId: number
	declare message: string
	declare readonly createdAt: Date
	declare readonly updatedAt: Date
}

EventMessage.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		eventId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'event_id',
			references: { model: 'events', key: 'id' },
			onDelete: 'CASCADE',
		},
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'user_id',
			references: { model: 'users', key: 'id' },
			onDelete: 'CASCADE',
		},
		message: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'EventMessage',
		tableName: 'event_messages',
		underscored: true,
		timestamps: true,
	}
)

// Relationships
EventMessage.belongsTo(EventModel, { as: 'event', foreignKey: 'eventId' })
EventMessage.belongsTo(User, { as: 'user', foreignKey: 'userId' })
EventModel.hasMany(EventMessage, { as: 'messages', foreignKey: 'eventId' })
User.hasMany(EventMessage, { as: 'eventMessages', foreignKey: 'userId' })

export default EventMessage
