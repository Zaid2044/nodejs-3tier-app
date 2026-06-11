const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Title cannot be empty",
        },
        len: {
          args: [1, 255],
          msg: "Title must be between 1 and 255 characters",
        },
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    priority: {
      type: DataTypes.ENUM(
        "Low",
        "Medium",
        "High",
        "Critical"
      ),
      allowNull: false,
      defaultValue: "Medium",
      validate: {
        isIn: {
          args: [["Low", "Medium", "High", "Critical"]],
          msg: "Priority must be Low, Medium, High, or Critical",
        },
      },
    },

    status: {
      type: DataTypes.ENUM(
        "Todo",
        "In Progress",
        "Done"
      ),
      allowNull: false,
      defaultValue: "Todo",
      validate: {
        isIn: {
          args: [["Todo", "In Progress", "Done"]],
          msg: "Status must be Todo, In Progress, or Done",
        },
      },
    },

    estimated_hours: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      defaultValue: null,
      validate: {
        min: {
          args: [0],
          msg: "Estimated hours cannot be negative",
        },
        max: {
          args: [9999.99],
          msg: "Estimated hours too large",
        },
      },
    },
  },
  {
    tableName: "tasks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Task;