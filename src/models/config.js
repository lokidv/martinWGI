const { DataTypes } = require("sequelize");
const { sequelize } = require("../database");

const Config = sequelize.define(
  "Config",
  {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    private_key: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    preshared_key: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    public_key: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    allowed_ip: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    port: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Config;
