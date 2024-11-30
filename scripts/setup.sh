#!/bin/bash

# Prompt the user for the port number if not passed as an argument
if [ -z "$PORT" ]; then
  # Prompt user just like sudo asks for password
  while true; do
    read -p "Enter the port number for the Node.js application to listen on: " PORT
    # Validate the port number is within the correct range
    if [[ "$PORT" =~ ^[0-9]+$ ]] && [ "$PORT" -ge 1 ] && [ "$PORT" -le 65535 ]; then
      break
    else
      echo "Invalid port number. Please enter a number between 1 and 65535."
    fi
  done
fi

# Update package list and install WireGuard, Node.js, and necessary dependencies
echo "Installing required packages..."
sudo apt update
sudo apt install -y wireguard curl nodejs git pm2

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
