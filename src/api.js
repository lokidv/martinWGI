const express = require("express");
const generateWireGuardKeys = require("./utils/keys");
const Config = require("./models/config");
const router = express.Router();
const fs = require("fs");

const { assignIpAddress, getPublicIp } = require("./utils/ip");
const {
  updateConfigFile,
  getPortFromConfig,
  generateRandomPort,
} = require("./utils/config-file");

router.get("/create", async (req, res) => {
  const { publicKey: username } = req.query;
  let config = await Config.findOne({ where: { username } });

  if (config) {
    await Config.destroy({ where: { username } });
    await updateConfigFile();
  }

  const allowed_ip = await assignIpAddress();
  const { privateKey, publicKey, presharedKey } = await generateWireGuardKeys();

  config = await Config.create({
    username,
    private_key: privateKey,
    public_key: publicKey,
    preshared_key: presharedKey,
    allowed_ip,
    port,
  });

  await updateConfigFile();

  const publicIp = getPublicIp(); // Get public IP using local network interface
  const port = generateRandomPort(); // Extract port from wg0.conf
  const serverPublicKey = fs.readFileSync("/etc/wireguard/public.key", "utf8");

  const configContent = `[Interface]
PrivateKey = ${config.private_key}
Address = ${config.allowed_ip}/24
DNS = 1.1.1.1,1.0.0.1

[Peer]
PublicKey = ${serverPublicKey.replaceAll("\n", "")}
Endpoint = ${publicIp}:${port}
AllowedIPs = 0.0.0.0/0, ::/0`;

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${username}_wg0.conf`
  );
  res.setHeader("Content-Type", "text/plain");
  res.send(configContent);
});

router.get("/list", async (req, res) => {
  try {
    const configs = await Config.findAll({
      attributes: ["username"],
    });
    res.json(configs);
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.get("/list/:username", async (req, res) => {
  const { username } = req.params;
  const config = await Config.findOne({ where: { username } });

  //   const publicIp = getPublicIp(); // Get public IP using local network interface
  //   const port = getPortFromConfig(); // Extract port from wg0.conf
  //   const serverPublicKey = fs.readFileSync("/etc/wireguard/public.key", "utf8");

  //   // Generate the WireGuard configuration content
  //   const configContent = `[Interface]
  // PrivateKey = ${config.private_key}
  // Address = ${config.allowed_ip}/24
  // DNS = 1.1.1.1,1.0.0.1
  // MTU = 1340

  // [Peer]
  // PublicKey = ${serverPublicKey}
  // Endpoint = ${publicIp}:${port}
  // AllowedIPs = 0.0.0.0/0, ::/0`;

  //   res.setHeader(
  //     "Content-Disposition",
  //     `attachment; filename=${username}_wg0.conf`
  //   );
  //   res.setHeader("Content-Type", "text/plain");
  //   res.send(configContent);

  res.json({ exist: !!config });
});

router.get("/remove", async (req, res) => {
  try {
    const { publicKey: username } = req.query;
    const config = await Config.destroy({ where: { username } });
    if (!config) {
      res.json({ deleted: false });
      return;
    }
    await updateConfigFile();
    res.json({ deleted: true });
  } catch {
    res.json({ deleted: false });
  }
});

module.exports = router;
