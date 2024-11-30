#!/bin/bash

echo "Enter the port number for the Node.js application to listen on:"
read PORT
echo "using $PORT"

# Update package list and install WireGuard, Node.js, and necessary dependencies
echo "Installing required packages..."
sudo apt update
sudo apt install -y wireguard curl git

curl -sL https://deb.nodesource.com/setup_20.x -o /tmp/nodesource_setup.sh
sudo bash /tmp/nodesource_setup.sh
sudo apt-get install -y nodejs

node -v
npm -v

npm install pm2 -g

# Enable IPv4 forwarding for WireGuard
echo "Enabling IPv4 forwarding..."
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Clone the WireGuard manager repository
echo "Cloning WireGuard Manager repository..."
git clone https://github.com/lokidv/martinWGI.git wireguard-manager

# Navigate into the cloned directory
cd wireguard-manager

# Install npm dependencies
echo "Installing Node.js dependencies..."
npm install

# Set the port as an environment variable
export PORT=$PORT

# Start the app using pm2
echo "Starting the Node.js app with pm2..."
pm2 start app.js --name wireguard-manager --env PORT=$PORT

# Set pm2 to restart on reboot
pm2 startup
pm2 save

# Confirmation
echo "WireGuard Manager is running on port $PORT."
