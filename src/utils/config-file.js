const fs = require("fs");
const Config = require("../models/config");
const { exec } = require("child_process");
const { getNetworkInterface } = require("./ip");

async function updateConfigFile() {
  try {
    const networkInterface = getNetworkInterface();
    const configPath = "/etc/wireguard/wg0.conf";
    const baseInterface = `[Interface]
Address = 10.66.66.1/24
ListenPort = 12345
PrivateKey = QKvZXuVexhPLLqGQsOrZiPauK/iVc3bSLwxmaJ4Srng=
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ${
      networkInterface || "eth0"
    } -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ${
      networkInterface || "eth0"
    } -j MASQUERADE`;

    const configs = await Config.findAll();

    const newConfigs = [];
    for (const config of configs) {
      const newConfig = `### Client ${config.username}_${config.id}
[Peer]
PublicKey = ${config.public_key}
AllowedIPs = ${config.allowed_ip}`;
      newConfigs.push(newConfig);
    }

    const configContent = [baseInterface, ...newConfigs].join("\n");

    // Stop the WireGuard service
    await new Promise((resolve, reject) => {
      exec("sudo systemctl stop wg-quick@wg0.service", (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Write the updated configuration to the file
    await new Promise((resolve, reject) => {
      fs.writeFile(configPath, configContent, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Start the WireGuard service
    await new Promise((resolve, reject) => {
      exec("sudo systemctl start wg-quick@wg0.service", (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log("WireGuard configuration updated successfully.");
  } catch (err) {
    console.error("Error updating WireGuard configuration:", err);
  }
}

function getPortFromConfig() {
  try {
    const configPath = "/etc/wireguard/wg0.conf"; // Adjust the path to your wg0.conf file
    const config = fs.readFileSync(configPath, "utf8");

    const portMatch = config.match(/ListenPort\s*=\s*(\d+)/); // Regex to extract the port
    if (portMatch) {
      return portMatch[1];
    } else {
      throw new Error("Port not found in wg0.conf");
    }
  } catch (error) {
    console.error("Error reading wg0.conf:", error);
    throw new Error("Could not read wg0.conf");
  }
}

module.exports = { updateConfigFile, getPortFromConfig };
