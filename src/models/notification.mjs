export const NotificationModel = (sequelize, DataTypes) => {
    return sequelize.define("Notification", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 't_users',
                key: 'id'
            }
        },
        homeworkId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Homework',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.ENUM('reminder', 'new_homework', 'comment'),
            allowNull: false,
        },
        message: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    });
};
