import { DataTypes, Sequelize } from "sequelize";
import dotenv from "dotenv";
import { UserModel } from "../models/users.mjs";
import { HomeworkModel } from "../models/devoirs.mjs";

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
  }
);

const Users = UserModel(sequelize, DataTypes);
const Homeworks = HomeworkModel(sequelize, DataTypes)

sequelize.sync().then((_) => {
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
export { Users, Homeworks, sequelize };
