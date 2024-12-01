const { Sequelize } = require("sequelize");
const path = require("path");

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "..", "data", "database.sqlite"),
});
