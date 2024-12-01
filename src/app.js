const express = require("express");
const apis = require("./api");
const { sequelize } = require("./database");

async function bootstrap() {
  const app = express();
  app.use(express.json());

  try {
    await sequelize.authenticate();

    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  app.use("/api", apis);

  // Ensure the server starts listening
  app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running");
  });
}

bootstrap();
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});
