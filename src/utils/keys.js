const { exec } = require("child_process");

/**
 * Generates a set of wireguard keys: private, public, and preshared keys.
 * @returns {Promise<object>} A promise that resolves with an object containing the generated keys.
 * @property {string} privateKey - The private key.
 * @property {string} publicKey - The public key.
 * @property {string} presharedKey - The preshared key.
 */
const generateWireGuardKeys = () => {
  return new Promise((resolve, reject) => {
    // Generate private key
    exec("wg genkey", (err, privateKey, stderr) => {
      if (err) {
        return reject(`Error generating private key: ${stderr}`);
      }
      privateKey = privateKey.trim();

      // Generate public key from private key
      exec(`echo ${privateKey} | wg pubkey`, (err, publicKey, stderr) => {
        if (err) {
          return reject(`Error generating public key: ${stderr}`);
        }
        publicKey = publicKey.trim();

        // Generate preshared key
        exec("wg genpsk", (err, presharedKey, stderr) => {
          if (err) {
            return reject(`Error generating preshared key: ${stderr}`);
          }
          presharedKey = presharedKey.trim();

          // Resolve the promise with the generated keys
          resolve({ privateKey, publicKey, presharedKey });
        });
      });
    });
  });
};

module.exports = generateWireGuardKeys;
