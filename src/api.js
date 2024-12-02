const express = require("express");
const generateWireGuardKeys = require("./utils/keys");
const Config = require("./models/config");
const router = express.Router();
const fs = require("fs");

const { assignIpAddress, getPublicIp } = require("./utils/ip");
const { updateConfigFile, getPortFromConfig } = require("./utils/config-file");

router.post("/configs", async (req, res) => {
  const { username } = req.body;
  const config = await Config.findOne({ where: { username } });

  if (config) {
    return res.status(400).json({ message: "Config already exists" });
  }

  const allowed_ip = await assignIpAddress();
  const { privateKey, publicKey, presharedKey } = await generateWireGuardKeys();

  const newConfig = await Config.create({
    username,
    private_key: privateKey,
    public_key: publicKey,
    preshared_key: presharedKey,
    allowed_ip,
  });

  await updateConfigFile();
  res.status(201).json(newConfig);
});

router.get("/configs", async (req, res) => {
  const configs = await Config.findAll();
  res.json(configs);
});

router.get("/configs/:username", async (req, res) => {
  const { username } = req.params;
  const config = await Config.findOne({ where: { username } });
  const publicIp = getPublicIp(); // Get public IP using local network interface
  const port = getPortFromConfig(); // Extract port from wg0.conf
  const privateKey = fs.readFileSync("/etc/wireguard/public.key", "utf8");

  // Generate the WireGuard configuration content
  const configContent = `[Interface]
PrivateKey = ${privateKey}
Address = ${config.allowed_ip}/24
DNS = 1.1.1.1,1.0.0.1
MTU = 1340

[Peer]
PublicKey = ${config.public_key}
Endpoint = ${publicIp}:${port}
AllowedIPs = 0.0.0.0`;

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${username}_wg0.conf`
  );
  res.setHeader("Content-Type", "text/plain");
  res.send(configContent);
});

router.delete("/configs/:username", async (req, res) => {
  const { username } = req.params;
  await Config.destroy({ where: { username } });
  await updateConfigFile();
  res.sendStatus(204);
});

module.exports = router;
