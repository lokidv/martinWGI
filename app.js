const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Connect to SQLite database
const db = new sqlite3.Database("./wireguard-configs.db");

// Utility function to check if an IP address is already in use (ping test)
function isIpAvailable(ip) {
  return new Promise((resolve, reject) => {
    try {
      execSync(`ping -c 1 -w 1 ${ip}`, { stdio: "ignore" }); // Ping once, timeout after 1 second
      reject(new Error(`IP ${ip} is already in use`));
    } catch (err) {
      resolve(true); // If the ping fails, it means the IP is available
    }
  });
}

// Function to get the next available IP from a range (e.g., 10.0.0.2 - 10.0.0.254)
async function getAvailableIp(start = 2, end = 254) {
  for (let i = start; i <= end; i++) {
    const ip = `10.66.66.${i}`;
    try {
      await isIpAvailable(ip);
      return ip; // Return the first available IP
    } catch (err) {
      continue;
    }
  }
  throw new Error("No available IPs in the range");
}

// Generate WireGuard server configuration
function generateServerConfig() {
  return `
[Interface]
Address = 10.66.66.1/24
ListenPort = 12345
PrivateKey = <server_private_key>
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
  `;
}

// Generate client WireGuard config
function generateClientConfig(username, privateKey, publicKey, allowedIp) {
  return `
[Interface]
PrivateKey = ${privateKey}
Address = ${allowedIp}/32

[Peer]
PublicKey = ${publicKey}
Endpoint = <server_ip>:12345
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
  `;
}

// Utility function to generate WireGuard keys using `wg` command-line tool
function generateWireGuardKeys() {
  const privateKey = execSync("wg genkey").toString().trim();
  const publicKey = execSync(`echo "${privateKey}" | wg pubkey`)
    .toString()
    .trim();
  return { privateKey, publicKey };
}

// POST /api/configs - Create a new WireGuard configuration
app.post("/api/configs", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).send({ message: "Username is required" });
  }

  // Generate keys
  const { privateKey, publicKey } = generateWireGuardKeys();

  // Get an available IP for the new user
  let allowedIp;
  try {
    allowedIp = await getAvailableIp();
    console.log(`Assigned IP: ${allowedIp}`);
  } catch (err) {
    return res.status(400).send({ message: "No available IPs in the range" });
  }

  // Insert new configuration into the database
  const query = `INSERT INTO configs (username, public_key, private_key, allowed_ip) VALUES (?, ?, ?, ?)`;
  db.run(query, [username, publicKey, privateKey, allowedIp], function (err) {
    if (err) {
      return res
        .status(500)
        .send({ message: "Error creating configuration", error: err });
    }
    res.status(201).send({
      message: "Configuration created",
      id: this.lastID,
      username,
      publicKey,
      privateKey,
      allowedIp,
    });
  });
});

// GET /api/configs - Get all WireGuard configurations
app.get("/api/configs", (req, res) => {
  const query = `SELECT * FROM configs`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res
        .status(500)
        .send({ message: "Error retrieving configurations", error: err });
    }
    res.status(200).json(rows);
  });
});

// GET /api/configs/:username - Get a single WireGuard configuration by username
app.get("/api/configs/:username", (req, res) => {
  const { username } = req.params;
  const query = `SELECT * FROM configs WHERE username = ?`;

  db.get(query, [username], (err, row) => {
    if (err || !row) {
      return res.status(404).send({ message: "Configuration not found" });
    }

    // Generate the client config based on stored data
    const clientConfig = generateClientConfig(
      username,
      row.private_key,
      row.public_key,
      row.allowed_ip
    );

    // Send the client config as a downloadable file
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${username}-wg-client.conf"`
    );
    res.setHeader("Content-Type", "text/plain");
    res.send(clientConfig);
  });
});

// Serve the server-side WireGuard config (to be used in WireGuard manager setup)
app.get("/api/server-config", (req, res) => {
  const serverConfig = generateServerConfig();

  // Send the server config as a downloadable file
  res.setHeader("Content-Disposition", `attachment; filename="wg-server.conf"`);
  res.setHeader("Content-Type", "text/plain");
  res.send(serverConfig);
});

// Start the Express server
app.listen(port, () => {
  console.log(`WireGuard Manager app listening at http://localhost:${port}`);
});
