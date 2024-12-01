const Config = require("../models/config");
const { execSync } = require("child_process");

async function assignIpAddress() {
  // Retrieve all assigned IP addresses
  const clients = await Config.findAll({
    attributes: ["allowed_ip"],
    order: [["allowed_ip", "ASC"]],
  });

  // Convert IP addresses to integers for easy comparison
  const assignedIps = clients.map((client) => {
    const lastOctet = parseInt(client.allowed_ip.split(".")[3], 10);
    return lastOctet;
  });

  // Find the lowest available IP in the range
  for (let i = 2; i <= 254; i++) {
    if (!assignedIps.includes(i)) {
      return `10.66.66.${i}`;
    }
  }

  throw new Error("No available IP addresses in the range.");
}

function getPublicIp() {
  try {
    // Use `hostname -I` to get the IP addresses and split by spaces
    const ipAddresses = execSync("hostname -I").toString().trim().split(" ");

    // Return the first IP address (public IP)
    return ipAddresses[0];
  } catch (error) {
    console.error("Error fetching public IP:", error);
    throw new Error("Could not fetch public IP");
  }
}

module.exports = { assignIpAddress, getPublicIp };
