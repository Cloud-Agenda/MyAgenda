export const HomeworkCompletionModel = (sequelize, DataTypes) => {
    return sequelize.define("HomeworkCompletion", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        homeworkId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Homework',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 't_users',
                key: 'id'
            }
        },
        completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    }, {
        indexes: [
            {
                unique: true,
                fields: ['homeworkId', 'userId']
            }
        ]
    });
};
