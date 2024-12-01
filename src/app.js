const express = require("express");
const apis = require("./api");
const { sequelize } = require("./database");

async function bootstrap() {
  const app = express();

  try {
    await sequelize.authenticate();

    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  app.use("/api", apis);
}

bootstrap();
