#!/bin/bash

FOLDER_PATH="wireguard-manager"

echo "Enter the port number for the Node.js application to listen on:"
read PORT
echo "using $PORT"

# Ask for the API_PASSWORD
read -s -p "Enter API_PASSWORD (no default, required): " API_PASSWORD
echo
if [ -z "$API_PASSWORD" ]; then
  echo "API_PASSWORD cannot be empty."
  exit 1
fi

export PORT=$PORT
export API_PASSWORD=$API_PASSWORD

# Update package list and install WireGuard, Node.js, and necessary dependencies
echo "Installing required packages..."
sudo apt update
sudo apt install -y wireguard curl git

curl -sL https://deb.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh
sudo bash /tmp/nodesource_setup.sh
sudo apt-get install -y nodejs

sudo npm install pm2 -g

wg genkey | sudo tee /etc/wireguard/private.key
sudo chmod go= /etc/wireguard/private.key
sudo cat /etc/wireguard/private.key | wg pubkey | sudo tee /etc/wireguard/public.key

# Enable IPv4 forwarding for WireGuard
echo "Enabling IPv4 forwarding..."
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Check if the folder exists
if [ -d "$FOLDER_PATH" ]; then
  echo "Folder exists. Deleting..."
  rm -rf "$FOLDER_PATH"
else
  echo "Folder does not exist."
fi

# Clone the WireGuard manager repository
echo "Cloning WireGuard Manager repository..."
git clone https://github.com/lokidv/martinWGI.git wireguard-manager

# Navigate into the cloned directory
cd wireguard-manager

# Install npm dependencies
echo "Installing Node.js dependencies..."
npm install

# Start the app using pm2
echo "Starting the Node.js app with pm2..."
pm2 start ./src/app.js --name wireguard-manager --env PORT=$PORT

# Set pm2 to restart on reboot
pm2 startup
pm2 save

# Confirmation
echo "WireGuard Manager is running on port $PORT."
