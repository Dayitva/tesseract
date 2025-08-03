# 🚀 SmartPy Tezos Escrow Deployment Guide

## ✅ Contract Status
- **SmartPy contract**: ✅ Compiled successfully
- **Location**: `contracts/src/TezosEscrowDeployable.py`
- **Language**: SmartPy (latest syntax)
- **Target**: Tezos Ghostnet

## 📋 Contract Features

### Core Functions
1. **`announce_order(secret_hash)`**: Create escrow order with sent XTZ
2. **`claim_funds(order_id, secret)`**: Claim funds by revealing secret
3. **`cancel_order(order_id)`**: Cancel order and refund (maker only)

### Storage Structure
```python
{
    orders: big_map[nat, {
        maker_address: address,
        amount: mutez,
        secret_hash: bytes,
        claimed: bool
    }],
    order_counter: nat,
    owner: address
}
```

## 🌐 Deployment Methods

### Option 1: SmartPy Online IDE (Recommended)

1. **Go to**: https://smartpy.io/ide
2. **Copy the contract** from `contracts/src/TezosEscrowDeployable.py`
3. **Paste into the IDE**
4. **Click "Deploy"**
5. **Select "Ghostnet"**
6. **Enter owner address** (your Tezos address)
7. **Confirm deployment**

### Option 2: SmartPy CLI (if available)

```bash
# Compile to Michelson
smartpy compile contracts/src/TezosEscrowDeployable.py output/

# Deploy with tezos-client
tezos-client originate contract escrow \
  transferring 0 from <your-account> \
  running output/TezosEscrow/step_000_cont_0_contract.tz \
  --init '(Pair {} (Pair 0 "<owner-address>"))' \
  --burn-cap 1
```

## 🔧 After Deployment

1. **Get contract address** from deployment output
2. **Update `.env` file**:
   ```bash
   TEZOS_ESCROW_CONTRACT=KT1...  # Your deployed contract address
   TEZOS_RPC_URL=https://ghostnet.tezos.marigold.dev
   ```

## 🧪 Testing the Contract

### Create Order
```javascript
// Using Taquito
await contract.methods.announce_order(secretHash).send({
    amount: 1000000, // 1 XTZ in mutez
    fee: 10000,
    gasLimit: 50000
});
```

### Claim Funds
```javascript
await contract.methods.claim_funds(0, secret).send({
    fee: 10000,
    gasLimit: 50000
});
```

### Cancel Order
```javascript
await contract.methods.cancel_order(0).send({
    fee: 10000,
    gasLimit: 50000
});
```

## 🔗 Integration with Cross-Chain Flow

Once deployed, this contract will:
1. **Accept XTZ deposits** for cross-chain swaps
2. **Lock funds** until secret is revealed
3. **Enable atomic swaps** with EVM chains
4. **Provide refund mechanism** if swap fails

## 🎯 Next Steps

1. ✅ **Deploy to Ghostnet**
2. 🔄 **Test basic functionality**  
3. 🌉 **Integrate with EVM escrow**
4. ⚡ **Test cross-chain atomic swaps**
5. 🚀 **Deploy to mainnet** (when ready)

## 📝 Contract Code

The final contract is available at: `contracts/src/TezosEscrowDeployable.py`

**Key advantages**:
- ✅ **Minimal dependencies**
- ✅ **Gas optimized**
- ✅ **Atomic swap compatible**
- ✅ **Secret hash validation**
- ✅ **Secure refund mechanism**