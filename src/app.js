const express = require("express");
const apis = require("./api");
const { sequelize } = require("./database");
const { updateConfigFile } = require("./utils/config-file");
const checkPassword = require("./middleware/checkPassword");

async function bootstrap() {
  const app = express();
  app.use(express.json());
  app.use(checkPassword);

  try {
    await sequelize.authenticate();
    await sequelize.sync();

    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  await updateConfigFile();
  app.use("/", apis);

  // Ensure the server starts listening
  app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running");
  });
}

bootstrap();
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});
