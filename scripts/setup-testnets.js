#!/usr/bin/env node

/**
 * Testnet Setup Script
 * This script helps users configure environment variables for testnet testing
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Testnet Configuration');
console.log('=====================================\n');

// Only keep Sepolia and Tezos Ghostnet in testnetConfigs
const testnetConfigs = {
    sepolia: {
        name: 'Sepolia (Ethereum Testnet)',
        rpc: 'https://eth-sepolia.g.alchemy.com/v2/WddzdzI2o9S3COdT73d5w6AIogbKq4X-',
        faucet: 'https://sepoliafaucet.com/',
        explorer: 'https://sepolia.etherscan.io/',
        chainId: 11155111
    },
    tezosGhostnet: {
        name: 'Tezos Ghostnet',
        rpc: 'https://ghostnet.tezos.marigold.dev',
        faucet: 'https://faucet.ghostnet.teztnets.xyz/',
        explorer: 'https://ghostnet.tzkt.io/',
        chainId: 'TEZOS::1'
    }
};

console.log('📋 Available Testnets:');
Object.entries(testnetConfigs).forEach(([key, config]) => {
    console.log(`   ${key}: ${config.name}`);
    console.log(`      RPC: ${config.rpc}`);
    console.log(`      Faucet: ${config.faucet}`);
    console.log(`      Explorer: ${config.explorer}`);
    console.log(`      Chain ID: ${config.chainId}\n`);
});

// Create .env.example file
const envExample = `# Testnet Configuration
# Set USE_TESTNETS=true to enable testnet testing

# Sepolia (Ethereum Testnet)
SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/WddzdzI2o9S3COdT73d5w6AIogbKq4X-
SEPOLIA_PRIVATE_KEY=your_sepolia_private_key_here

# Tezos Ghostnet
TEZOS_GHOSTNET_RPC=https://ghostnet.tezos.marigold.dev
TEZOS_PRIVATE_KEY=your_tezos_private_key_here
TEZOS_CONTRACT_ADDRESS=your_deployed_tezos_contract_address

# Enable testnet mode
USE_TESTNETS=true

# Optional: Override default RPC URLs
# SRC_CHAIN_RPC=https://eth.merkle.io
# DST_CHAIN_RPC=https://bsc-rpc.publicnode.com
`;

const envPath = path.join(__dirname, '..', '.env.example');
fs.writeFileSync(envPath, envExample);

console.log('📝 Created .env.example file with testnet configuration');
console.log('   Copy .env.example to .env and fill in your private keys\n');

// Create testnet setup instructions
const setupInstructions = `# Testnet Setup Instructions

## 1. Get Testnet Tokens

### Sepolia (Ethereum Testnet)
- Visit: ${testnetConfigs.sepolia.faucet}
- Get test ETH for gas fees
- Get test USDC for swaps

### Tezos Ghostnet
- Visit: ${testnetConfigs.tezosGhostnet.faucet}
- Get test XTZ for gas fees and swaps

## 2. Deploy Contracts

### EVM Chains (Sepolia)
The Limit Order Protocol contracts need to be deployed on testnets:
\`\`\`bash
# Deploy to Sepolia
forge script contracts/src/DeployEscrowFactory.s.sol --rpc-url https://eth-sepolia.g.alchemy.com/v2/WddzdzI2o9S3COdT73d5w6AIogbKq4X- --broadcast --verify
\`\`\`

### Tezos Ghostnet
Deploy the Tezos escrow contract:
\`\`\`bash
# Compile Michelson contract
ligo compile contract contracts/src/TezosEscrow.mligo --output-file contracts/src/TezosEscrow.tz

# Deploy using Taquito (see deploy-tezos.js for details)
node scripts/deploy-tezos.js
\`\`\`

## 3. Configure Environment

1. Copy .env.example to .env
2. Add your private keys
3. Update contract addresses after deployment

## 4. Run Tests

\`\`\`bash
# Test testnet connectivity
npm run test:testnet

# Run full testnet demo
npm run demo:testnet
\`\`\`

## 5. Monitor Transactions

- Sepolia: ${testnetConfigs.sepolia.explorer}
- Tezos Ghostnet: ${testnetConfigs.tezosGhostnet.explorer}
`;

const instructionsPath = path.join(__dirname, '..', 'TESTNET_SETUP.md');
fs.writeFileSync(instructionsPath, setupInstructions);

console.log('📖 Created TESTNET_SETUP.md with detailed instructions\n');

console.log('✅ Testnet setup complete!');
console.log('\nNext steps:');
console.log('1. Copy .env.example to .env');
console.log('2. Get testnet tokens from faucets');
console.log('3. Deploy contracts to testnets');
console.log('4. Update .env with your private keys and contract addresses');
console.log('5. Run: npm run test:testnet'); 