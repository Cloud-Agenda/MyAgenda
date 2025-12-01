export const CommentModel = (sequelize, DataTypes) => {
    return sequelize.define("Comment", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
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
            allowNull: false,
            references: {
                model: 'Homework',
                key: 'id'
            }
        },
    });
};
