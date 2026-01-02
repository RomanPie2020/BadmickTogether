import { DataTypes } from 'sequelize'

export default {
	up: async queryInterface => {
		await queryInterface.createTable('event_messages', {
			id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			event_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: { model: 'events', key: 'id' },
				onDelete: 'CASCADE',
			},
			user_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				references: { model: 'users', key: 'id' },
				onDelete: 'CASCADE',
			},
			message: {
				type: DataTypes.TEXT,
				allowNull: false,
			},
			created_at: {
				allowNull: false,
				type: DataTypes.DATE,
			},
			updated_at: {
				allowNull: false,
				type: DataTypes.DATE,
			},
		})

		// Add indexes for better query performance
		await queryInterface.addIndex('event_messages', ['event_id'])
		await queryInterface.addIndex('event_messages', ['user_id'])
		await queryInterface.addIndex('event_messages', ['created_at'])
	},
	down: async queryInterface => {
		await queryInterface.dropTable('event_messages')
	},
}
