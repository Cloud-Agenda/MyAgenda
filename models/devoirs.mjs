export const HomeworkModel = (sequelize, DataTypes) => {
  return sequelize.define("Homework", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    class: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID de l'utilisateur qui a créé le devoir",
    },
  });
};
