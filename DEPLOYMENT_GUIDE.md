# 🚀 Deployment Guide for Tezos Cross-Chain Integration

This guide will help you deploy the Tezos cross-chain integration to real testnets.

## 📋 Prerequisites

1. **Node.js and npm** installed
2. **Foundry** installed (`curl -L https://foundry.paradigm.xyz | bash`)
3. **A wallet with testnet tokens** (see faucet links below)

## 🔧 Setup

### 1. Initialize the project
```bash
# Clone and setup
git clone <repository-url>
cd cross-chain-resolver-example
npm install
```

### 2. Setup testnet configuration
```bash
npm run setup:testnet
```

### 3. Configure environment variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your private keys
nano .env
```

**Required variables in .env:**
```bash
# Your wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Optional: Override default RPC URLs
SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/your-api-key
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
TEZOS_GHOSTNET_RPC=https://ghostnet.tezos.marigold.dev
```

## 💰 Get Testnet Tokens

### Sepolia (Ethereum Testnet)
- **Faucet**: https://sepoliafaucet.com/
- **Get**: ETH for gas fees
- **Explorer**: https://sepolia.etherscan.io/

### BSC Testnet
- **Faucet**: https://testnet.binance.org/faucet-smart
- **Get**: BNB for gas fees
- **Explorer**: https://testnet.bscscan.com/

### Tezos Ghostnet
- **Faucet**: https://faucet.ghostnet.teztnets.xyz/
- **Get**: XTZ for gas fees and swaps
- **Explorer**: https://ghostnet.tzkt.io/

## 🚀 Deploy Contracts

### Option 1: Automated Deployment (Recommended)
```bash
# Deploy to Sepolia
npm run deploy:testnet sepolia

# Deploy to BSC Testnet
npm run deploy:testnet bscTestnet
```

### Option 2: Manual Deployment
```bash
# Set your private key
export PRIVATE_KEY=your_private_key_here

# Deploy to Sepolia
forge script contracts/src/DeployEscrowFactory.s.sol \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/your-api-key \
  --broadcast --verify

# Deploy to BSC Testnet
forge script contracts/src/DeployEscrowFactory.s.sol \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 \
  --broadcast --verify
```

## 🧪 Test the Deployment

### 1. Test connectivity
```bash
npm run test:testnet
```

### 2. Run individual tests
```bash
# Test EVM to Tezos swaps
npm run test:tezos

# Test Tezos to EVM swaps
npm run test:tezos2evm

# Test bidirectional swaps
npm run test:bidirectional
```

### 3. Run full demo
```bash
npm run demo:full
```

## 📊 Expected Output

### Successful Deployment
```
🚀 Deploying to Sepolia (Ethereum Testnet)...
   RPC: https://eth-sepolia.g.alchemy.com/v2/your-api-key
   Chain ID: 11155111

Running: forge script contracts/src/DeployEscrowFactory.s.sol --rpc-url https://eth-sepolia.g.alchemy.com/v2/your-api-key --broadcast --verify

✅ Deployment successful!
EscrowFactory deployed at: 0x1234567890123456789012345678901234567890
EscrowSrc implementation at: 0x2345678901234567890123456789012345678901
EscrowDst implementation at: 0x3456789012345678901234567890123456789012

📋 Contract Information:
   Contract Address: 0x1234567890123456789012345678901234567890
   Explorer: https://sepolia.etherscan.io/address/0x1234567890123456789012345678901234567890
   Network: Sepolia (Ethereum Testnet)
```

### Successful Test Run
```
🔗 Connected to testnets:
   Sepolia: https://eth-sepolia.g.alchemy.com/v2/your-api-key
   BSC Testnet: https://data-seed-prebsc-1-s1.binance.org:8545
   Tezos Ghostnet: https://ghostnet.tezos.marigold.dev

✅ Sepolia connected - Block: 8898566
✅ BSC Testnet connected - Block: 60436642
✅ Tezos Ghostnet connected - Balance: 1000000 XTZ

🔐 Generated cryptographic elements:
   Secret: 118,27,71,31,103,118,41,213,106,113,209,88,133,58,220,58,47,101,132,37,179,173,35,131,150,50,185,144,155,91,254,184
   Hashlock: 0x44863587fa9994df9fd869b5568676cc8f1a71cccaa084a1ffc9a3cbc6dbee63

✅ EVM to Tezos swap simulation completed
✅ Tezos to EVM swap simulation completed
✅ Testnet configuration verified
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "insufficient funds for gas * price + value"
**Solution**: Get testnet tokens from the faucet
```bash
# Sepolia
open https://sepoliafaucet.com/

# BSC Testnet
open https://testnet.binance.org/faucet-smart

# Tezos Ghostnet
open https://faucet.ghostnet.teztnets.xyz/
```

#### 2. "environment variable PRIVATE_KEY not found"
**Solution**: Set your private key in .env file
```bash
# Edit .env file
nano .env

# Add your private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here
```

#### 3. "RPC endpoint not responding"
**Solution**: Check your RPC URL or use a different provider
```bash
# Try alternative RPC URLs
SEPOLIA_RPC=https://rpc.sepolia.org
BSC_TESTNET_RPC=https://bsc-testnet.public.blastapi.io
```

#### 4. "Contract verification failed"
**Solution**: This is normal for testnets, contracts are still deployed
```bash
# Check deployment on explorer
open https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

## 📈 Next Steps

### 1. Update Configuration
After deployment, update your configuration with the deployed contract addresses:
```bash
# Edit config files with new addresses
nano tests/config.ts
nano tests/testnet-config.ts
```

### 2. Test Real Transactions
```bash
# Run tests with real contract addresses
npm run test:testnet
```

### 3. Monitor Transactions
- **Sepolia**: https://sepolia.etherscan.io/
- **BSC Testnet**: https://testnet.bscscan.com/
- **Tezos Ghostnet**: https://ghostnet.tzkt.io/

### 4. Deploy to Mainnet
When ready for production:
1. Update RPC URLs to mainnet endpoints
2. Use mainnet token addresses
3. Deploy with real funds
4. Update configuration files

## 🎯 Verification Checklist

- [ ] Environment variables configured
- [ ] Testnet tokens obtained
- [ ] Contracts deployed successfully
- [ ] Contract addresses recorded
- [ ] Connectivity tests passing
- [ ] Swap simulations working
- [ ] Bidirectional functionality verified
- [ ] Hashlock and timelock working
- [ ] On-chain execution demonstrated

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your environment setup
3. Ensure you have sufficient testnet tokens
4. Check network connectivity
5. Review the logs for specific error messages

---

**🎉 Congratulations!** You've successfully deployed the Tezos cross-chain integration to testnets! 