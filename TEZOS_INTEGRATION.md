# Tezos Integration for 1inch Fusion+ Cross-Chain Resolver

This document explains how Tezos support has been added to the cross-chain resolver example, enabling atomic swaps between EVM chains and Tezos.

## Overview

The Tezos integration follows the same pattern as other non-EVM chains in the 1inch Fusion+ ecosystem:

1. **Smart Contract**: Michelson contract implementing escrow functionality
2. **Client Library**: TypeScript utilities for Tezos interactions
3. **Configuration**: Chain-specific settings and RPC endpoints
4. **Tests**: Comprehensive test suite for EVM-to-Tezos swaps

## Architecture

### Smart Contract (`contracts/src/TezosEscrow.mligo`)

The Tezos escrow contract implements the same core functionality as the EVM contracts:

- **Hashlock Mechanism**: Uses `keccak256` for cross-chain consistency
- **Timelock System**: Coordinated timelocks across chains
- **Order Management**: Create, fund, claim, and cancel escrow orders
- **Security Features**: Access control and emergency functions

Key functions:
- `announce_order`: Create new escrow order
- `fund_dst_escrow`: Fund destination escrow
- `claim_funds`: Withdraw using secret
- `cancel_swap`: Cancel and return funds
- `rescue_funds`: Emergency fund recovery

### Client Library (`tests/tezosUtils.ts`)

The Tezos client provides a unified interface for Tezos operations:

```typescript
const tezosClient = new TezosEscrowClient({
  rpcUrl: 'https://ghostnet.tezos.marigold.dev',
  contractAddress: 'KT1...',
  signerPrivateKey: '...'
});

// Create escrow order
await tezosClient.announceOrder({
  srcAmount: '1000000',
  minDstAmount: '0',
  expirationDuration: 3600,
  secretHash: '0x...'
});

// Claim funds
await tezosClient.claimFunds({
  orderId: 0,
  secret: '0x...'
});
```

### Configuration (`tests/config.ts`)

Tezos configuration is added to the existing config structure:

```typescript
tezos: {
  chainId: 'TEZOS::1',
  url: 'https://ghostnet.tezos.marigold.dev',
  contractAddress: 'KT1...',
  ownerPrivateKey: '...',
  tokens: {
    XTZ: {
      address: '0x0000000000000000000000000000000000000000',
      donor: 'tz1...'
    }
  }
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @taquito/taquito @taquito/signer
```

### 2. Environment Variables

Add to your `.env` file:

```env
TEZOS_RPC_URL=https://ghostnet.tezos.marigold.dev
TEZOS_CONTRACT_ADDRESS=KT1YourContractAddress
TEZOS_PRIVATE_KEY=your_private_key_here
```

### 3. Deploy Tezos Contract

```bash
# Install LIGO compiler
# https://ligolang.org/docs/intro/installation

# Compile the contract
ligo compile contract contracts/src/TezosEscrow.mligo

# Deploy using the deployment script
node scripts/deploy-tezos.js
```

### 4. Run Tests

```bash
# Run Tezos-specific tests
npm run test:tezos

# Run all tests including Tezos
npm test
```

## Cross-Chain Workflow

### EVM to Tezos Swap

1. **Order Creation**: User creates swap order on EVM chain
2. **Source Escrow**: Resolver deploys escrow on EVM chain
3. **Destination Escrow**: Resolver creates escrow on Tezos
4. **Funding**: Both escrows are funded
5. **Secret Reveal**: Secret is revealed, unlocking both chains
6. **Completion**: Swap is complete when both chains confirm

### Example Test Flow

```typescript
// Generate secret and hashlock
const secret = TezosEscrowClient.generateSecret();
const hashlock = TezosEscrowClient.hashSecret(secret);

// Create cross-chain order
const order = Sdk.CrossChainOrder.new(/* ... */);

// Deploy source escrow (EVM)
await resolver.deploySrc(/* ... */);

// Deploy destination escrow (Tezos)
await tezosClient.announceOrder({
  srcAmount: dstImmutables.amount.toString(),
  expirationDuration: Number(dstImmutables.timeLocks.dstCancellation),
  secretHash: dstImmutables.hashLock.toString()
});

// Withdraw from both chains using secret
await tezosClient.claimFunds({ orderId: 0, secret });
await resolver.withdraw(/* ... */);
```

## Key Features

### Hashlock Consistency

Both EVM and Tezos chains use the same `keccak256` hash function:

```typescript
// Same hash function across chains
const secret = '0x...';
const hashlock = keccak256(secret);
```

### Timelock Coordination

Synchronized timelocks ensure atomicity:

```typescript
const timelocks = {
  srcWithdrawal: 10n,
  srcPublicWithdrawal: 120n,
  srcCancellation: 121n,
  dstWithdrawal: 10n,
  dstPublicWithdrawal: 100n,
  dstCancellation: 101n
};
```

### Error Handling

Comprehensive error handling for Tezos-specific operations:

```typescript
try {
  await tezosClient.claimFunds({ orderId, secret });
} catch (error) {
  if (error.message.includes('Order not found')) {
    // Handle missing order
  } else if (error.message.includes('Invalid secret')) {
    // Handle invalid secret
  }
}
```

## Security Considerations

### Private Key Management

- Use environment variables for private keys
- Never commit private keys to version control
- Consider using hardware wallets for production

### Contract Security

- Audit the Michelson contract before deployment
- Test thoroughly on testnet before mainnet
- Implement proper access controls

### Cross-Chain Security

- Verify hashlock consistency across chains
- Ensure timelock synchronization
- Implement proper error recovery mechanisms

## Testing

### Running Tests

```bash
# Run Tezos integration tests
npm run test:tezos

# Run specific test file
npm test -- evm2tezos.spec.ts

# Run with verbose output
npm test -- --verbose evm2tezos.spec.ts
```

### Test Coverage

The test suite covers:

- ✅ Successful EVM-to-Tezos swaps
- ✅ Secret generation and validation
- ✅ Timelock coordination
- ✅ Error handling and recovery
- ✅ Balance verification
- ⏳ Cancellation scenarios (to be implemented)

## Troubleshooting

### Common Issues

1. **RPC Connection**: Ensure Tezos RPC endpoint is accessible
2. **Contract Deployment**: Verify contract is deployed and accessible
3. **Private Key Format**: Ensure private key is in correct format
4. **Gas Estimation**: Tezos operations may require gas estimation

### Debug Mode

Enable debug logging:

```typescript
const tezosClient = new TezosEscrowClient({
  rpcUrl: config.rpcUrl,
  contractAddress: config.contractAddress,
  signerPrivateKey: config.signerPrivateKey,
  debug: true // Enable debug logging
});
```

## Future Enhancements

### Planned Features

- [ ] Support for Tezos tokens (FA1.2, FA2)
- [ ] Batch operations for multiple swaps
- [ ] Advanced timelock configurations
- [ ] Integration with Tezos wallets (Temple, Kukai)

### Performance Optimizations

- [ ] Connection pooling for RPC calls
- [ ] Caching for frequently accessed data
- [ ] Batch transaction processing

## Contributing

To contribute to the Tezos integration:

1. Follow the existing code patterns
2. Add comprehensive tests for new features
3. Update documentation
4. Ensure cross-chain consistency
5. Test on both testnet and mainnet

## Resources

- [Tezos Documentation](https://tezos.gitlab.io/)
- [LIGO Language](https://ligolang.org/)
- [Taquito SDK](https://tezostaquito.io/)
- [1inch Fusion+ Documentation](https://docs.1inch.io/) 