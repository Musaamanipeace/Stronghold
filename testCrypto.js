// testCrypto.js
const bitcoin = require('bitcoinjs-lib');
const { ECPairFactory } = require('ecpair');
const ecc = require('tiny-secp256k1');

// Initialize the keypair factory using the secp256k1 library
const ECPair = ECPairFactory(ecc);

// Use Testnet rules
const network = bitcoin.networks.testnet;

try {
    console.log("--- Starting StrongHold Cryptographic Pre-flight Test ---");

    // 1. Generate standard compressed test keys for our arbiters
    const sponsorPubKey = Buffer.from("02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2", "hex");
    const patientPubKey = Buffer.from("03b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3", "hex");
    
    // Simulate the StrongHold Server Private Key (000...001)
    const serverKeyPair = ECPair.fromPrivateKey(
        Buffer.from("0000000000000000000000000000000000000000000000000000000000000001", "hex"), 
        { network }
    );
    const serverPubKey = serverKeyPair.publicKey;

    // Output server key using clean string interpolation
    console.log(`Server PubKey Generated: ${Buffer.from(serverPubKey).toString('hex')}\n`);

    // 2. Compile the public keys into an ordered array
    const pubkeys = [sponsorPubKey, patientPubKey, serverPubKey];

    // 3. Programmatically build the 2-of-3 P2SH Address structure
    const multisigPayment = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2ms({ m: 2, pubkeys, network }),
        network
    });

    console.log("\x1b[32m%s\x1b[0m", "✔ CRYPTO SCRIPT SUCCESSFUL!");
    console.log(`Generated Multisig Address: ${multisigPayment.address}`);
    console.log(`Redeem Script Hex: ${Buffer.from(multisigPayment.redeem.output).toString('hex')}`);

} catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "✖ CRYPTO CRASH:");
    console.error(error.stack);
}