# Quick Start - Sepolia ↔ Tezos Atomic Swaps

Since you have ETH on Sepolia and XTZ on Tezos Ghostnet, here's how to run real testnet swaps:

## ⚡ Immediate Steps

### 1. Set Environment Variables
```bash
export USE_TESTNETS=true
export SRC_CHAIN_RPC=https://ethereum-sepolia-rpc.publicnode.com  
export DST_CHAIN_RPC=https://ghostnet.tezos.marigold.dev
export PRIVATE_KEY=0xYourEthereumPrivateKey
export TEZOS_PRIVATE_KEY=yourTezosPrivateKey
```

### 2. Test Connectivity  
```bash
npm run test:testnet
```
This should show:
- ✅ Sepolia connected - Block: [current block]
- ✅ Tezos Ghostnet connected - Balance: [balance] XTZ

### 3. Deploy Contracts

**Deploy on Sepolia:**
```bash
npm run deploy:testnet
```
Copy the contract address and set:
```bash
export SEPOLIA_ESCROW_FACTORY_ADDRESS=0xDeployedContractAddress
```

**Deploy on Tezos:**
We have a compiled contract at `contracts/src/TezosEscrow.tz`. Deploy it manually and set:
```bash
export TEZOS_CONTRACT_ADDRESS=KT1YourTezosContractAddress
```

### 4. Run Bidirectional Swaps
```bash
# Test both directions
npm run test:bidirectional

# Or test individually  
npm run test:tezos      # EVM → Tezos
npm run test:tezos2evm  # Tezos → EVM
```

## 🎯 What You'll See

**Working Demo:**
```bash
npm run demo:full
```
Shows complete atomic swap flows with:
- ✅ Hashlock security (secret validation)
- ✅ Timelock functionality (expiration handling)  
- ✅ Bidirectional swaps (both directions)
- ✅ On-chain execution simulation

## 📋 Requirements Verification

Run the verification script:
```bash
npm run verify
```

This checks that the implementation has:
- ✅ Hashlock preservation 
- ✅ Timelock preservation
- ✅ Bidirectional swap capability
- ✅ On-chain execution readiness

## 🔧 Troubleshooting

**If contract deployment fails:**
- Make sure you have enough ETH for gas on Sepolia
- Try a different RPC URL if one is slow

**If Tezos connection fails:**
- The mock implementation will still work for testing
- Real Tezos deployment requires manual contract deployment

**If tests time out:**
- Increase timeout in Jest config
- Check RPC connectivity

## 🚀 Next Steps

Once both contracts are deployed:
1. Update `.env` with actual contract addresses
2. Run real atomic swaps on testnets 
3. Verify all functionality works with actual tokens
4. Demo the complete flow

The project is now simplified to focus **only on Sepolia ↔ Tezos** bidirectional swaps!