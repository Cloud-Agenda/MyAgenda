import { DataTypes } from 'sequelize';
import { sequelize } from '../database/database.js';

const Devoir = sequelize.define('Devoir', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  time: {
    type: DataTypes.STRING,
    allowNull: true
  },
  class: {
    type: DataTypes.STRING,
    allowNull: true
  },
  attachment: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

export default Devoir;