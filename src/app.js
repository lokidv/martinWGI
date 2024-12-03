const express = require("express");
const apis = require("./api");
const ovpn = require("./ovpn");
const { sequelize } = require("./database");
const { updateConfigFile } = require("./utils/config-file");

async function bootstrap() {
  const app = express();
  app.use(express.json());

  try {
    await sequelize.authenticate();

    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  await updateConfigFile();
  app.use("/api", apis);
  app.use("/ovpn", ovpn);

  // Ensure the server starts listening
  app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running");
  });
}

bootstrap();
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});
