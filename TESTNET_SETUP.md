# Testnet Setup Instructions

## 1. Get Testnet Tokens

### Sepolia (Ethereum Testnet)
- Visit: https://sepoliafaucet.com/
- Get test ETH for gas fees
- Get test USDC for swaps

### BSC Testnet
- Visit: https://testnet.binance.org/faucet-smart
- Get test BNB for gas fees
- Get test USDC for swaps

### Tezos Ghostnet
- Visit: https://faucet.ghostnet.teztnets.xyz/
- Get test XTZ for gas fees and swaps

## 2. Deploy Contracts

### EVM Chains (Sepolia, BSC Testnet)
The Limit Order Protocol contracts need to be deployed on testnets:
```bash
# Deploy to Sepolia
forge script script/DeployEscrowFactory.s.sol --rpc-url https://eth-sepolia.g.alchemy.com/v2/WddzdzI2o9S3COdT73d5w6AIogbKq4X- --broadcast --verify

# Deploy to BSC Testnet
forge script script/DeployEscrowFactory.s.sol --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545 --broadcast --verify
```

### Tezos Ghostnet
Deploy the Tezos escrow contract:
```bash
# Compile Michelson contract
ligo compile contract contracts/src/TezosEscrow.mligo --output-file contracts/src/TezosEscrow.tz

# Deploy using Taquito (see deploy-tezos.js for details)
node scripts/deploy-tezos.js
```

## 3. Configure Environment

1. Copy .env.example to .env
2. Add your private keys
3. Update contract addresses after deployment

## 4. Run Tests

```bash
# Test testnet connectivity
npm run test:testnet

# Run full testnet demo
npm run demo:testnet
```

## 5. Monitor Transactions

- Sepolia: https://sepolia.etherscan.io/
- BSC Testnet: https://testnet.bscscan.com/
- Tezos Ghostnet: https://ghostnet.tzkt.io/
