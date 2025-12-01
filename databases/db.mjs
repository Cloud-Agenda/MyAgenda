import { DataTypes, Sequelize } from "sequelize";
import dotenv from "dotenv";
import { UserModel } from "../models/users.mjs";
import { HomeworkModel } from "../models/devoirs.mjs";
import { HomeworkCompletionModel } from "../models/homework_completion.mjs";
import { NotificationModel } from "../models/notification.mjs";
import { CommentModel } from "../models/comment.mjs";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT,
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

const Users = UserModel(sequelize, DataTypes);
const Homeworks = HomeworkModel(sequelize, DataTypes);
const HomeworkCompletions = HomeworkCompletionModel(sequelize, DataTypes);
const Notifications = NotificationModel(sequelize, DataTypes);
const Comments = CommentModel(sequelize, DataTypes);

Users.hasMany(Homeworks, { foreignKey: "creatorId" });
Homeworks.belongsTo(Users, { foreignKey: "creatorId", as: "creator" });

// Relations pour le suivi de complétion
Users.belongsToMany(Homeworks, { through: HomeworkCompletions, foreignKey: 'userId', as: 'completedHomeworks' });
Homeworks.belongsToMany(Users, { through: HomeworkCompletions, foreignKey: 'homeworkId', as: 'completedByUsers' });

HomeworkCompletions.belongsTo(Users, { foreignKey: 'userId' });
HomeworkCompletions.belongsTo(Homeworks, { foreignKey: 'homeworkId' });

// Relations pour les notifications
Users.hasMany(Notifications, { foreignKey: 'userId' });
Notifications.belongsTo(Users, { foreignKey: 'userId' });
Notifications.belongsTo(Homeworks, { foreignKey: 'homeworkId' });

// Relations pour les commentaires
Users.hasMany(Comments, { foreignKey: 'userId' });
Comments.belongsTo(Users, { foreignKey: 'userId' });
Homeworks.hasMany(Comments, { foreignKey: 'homeworkId' });
Comments.belongsTo(Homeworks, { foreignKey: 'homeworkId' });

sequelize.sync({ alter: true }).then((_) => {
  console.log("The database has been synchronized");
}).catch((e) => {
  console.log(`The database couldn't be synchronized`, e);
});

try {
  await sequelize.authenticate({});
  console.log("Connection to database has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

export default sequelize;
export { Users, Homeworks, HomeworkCompletions, Notifications, Comments, sequelize };
