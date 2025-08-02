import { TezosToolkit, MichelsonMap } from '@taquito/taquito';
import { InMemorySigner } from '@taquito/signer';
import { keccak256 } from 'ethers';

/**
 * Production Tezos utility functions for cross-chain atomic swaps
 * This file uses the actual @taquito libraries for real blockchain interaction
 */

export interface TezosEscrowConfig {
  rpcUrl: string;
  contractAddress: string;
  signerPrivateKey: string;
}

export interface TezosOrder {
  id: number;
  maker_address: string;
  escrow_address: string;
  amount: string;
  secret_hash: string;
  expiration_timestamp: string;
  revealed_secret?: string;
}

export class TezosEscrowClient {
  private tezos: TezosToolkit;
  private contractAddress: string;

  constructor(config: TezosEscrowConfig) {
    this.tezos = new TezosToolkit(config.rpcUrl);
    this.tezos.setProvider({
      signer: new InMemorySigner(config.signerPrivateKey)
    });
    this.contractAddress = config.contractAddress;
  }

  /**
   * Generate a cryptographically secure secret
   */
  static generateSecret(): string {
    return '0x' + Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex');
  }

  /**
   * Hash a secret using keccak256 (equivalent to Solidity)
   */
  static hashSecret(secret: string): string {
    return keccak256(secret);
  }

  /**
   * Create a new escrow order on Tezos
   */
  async announceOrder(params: {
    srcAmount: string;
    minDstAmount: string;
    expirationDuration: number;
    secretHash: string;
  }): Promise<string> {
    try {
      const contract = await this.tezos.contract.at(this.contractAddress);
      
      const operation = await contract.methods.announce_order({
        src_amount: params.srcAmount,
        min_dst_amount: params.minDstAmount,
        expiration_duration: params.expirationDuration,
        secret_hash: params.secretHash
      }).send();

      await operation.confirmation();
      return operation.hash;
    } catch (error) {
      throw new Error(`Failed to announce order: ${error}`);
    }
  }

  /**
   * Fund destination escrow
   */
  async fundDstEscrow(params: {
    dstAmount: string;
    expirationDuration: number;
    secretHash: string;
  }): Promise<string> {
    try {
      const contract = await this.tezos.contract.at(this.contractAddress);
      
      const operation = await contract.methods.fund_dst_escrow({
        dst_amount: params.dstAmount,
        expiration_duration: params.expirationDuration,
        secret_hash: params.secretHash
      }).send();

      await operation.confirmation();
      return operation.hash;
    } catch (error) {
      throw new Error(`Failed to fund destination escrow: ${error}`);
    }
  }

  /**
   * Claim funds using secret
   */
  async claimFunds(params: {
    orderId: number;
    secret: string;
  }): Promise<string> {
    try {
      const contract = await this.tezos.contract.at(this.contractAddress);
      
      const operation = await contract.methods.claim_funds({
        order_id: params.orderId,
        secret: params.secret
      }).send();

      await operation.confirmation();
      return operation.hash;
    } catch (error) {
      throw new Error(`Failed to claim funds: ${error}`);
    }
  }

  /**
   * Cancel swap and return funds
   */
  async cancelSwap(orderId: number): Promise<string> {
    try {
      const contract = await this.tezos.contract.at(this.contractAddress);
      
      const operation = await contract.methods.cancel_swap({
        order_id: orderId
      }).send();

      await operation.confirmation();
      return operation.hash;
    } catch (error) {
      throw new Error(`Failed to cancel swap: ${error}`);
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: number): Promise<TezosOrder | null> {
    try {
      const contract = await this.tezos.contract.at(this.contractAddress);
      const storage = await contract.storage();
      
      // This would need to be implemented based on the actual contract storage structure
      // For now, returning null as placeholder
      return null;
    } catch (error) {
      throw new Error(`Failed to get order: ${error}`);
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.tezos.tz.getBalance(address);
      return balance.toString();
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }
}

/**
 * Create Tezos wallet from Ethereum private key
 */
export function createTezosWalletFromEthKey(ethPrivateKey: string): {
  address: string;
  privateKey: string;
  publicKey: string;
} {
  // Remove 0x prefix if present
  const cleanPrivateKey = ethPrivateKey.startsWith('0x') 
    ? ethPrivateKey.slice(2) 
    : ethPrivateKey;

  if (!/^[0-9a-fA-F]{64}$/.test(cleanPrivateKey)) {
    throw new Error('Invalid private key format. Must be 64 hex characters.');
  }

  // For Tezos, we would typically use a different key derivation
  // This is a simplified version - in production, use proper Tezos key derivation
  const signer = new InMemorySigner(cleanPrivateKey);
  
  return {
    address: '', // Would be derived from the signer
    privateKey: cleanPrivateKey,
    publicKey: '' // Would be derived from the signer
  };
}

/**
 * Pack timelocks into uint256 format (similar to Solidity implementation)
 */
export function packTimelocks(timelocks: Record<number, number>, deployedAt: number): string {
  let packed = BigInt(deployedAt) << 224n;
  
  for (let stage = 0; stage < 7; stage++) {
    if (timelocks[stage] !== undefined) {
      const offset = BigInt(timelocks[stage] - deployedAt);
      packed |= offset << BigInt(stage * 32);
    }
  }
  
  return '0x' + packed.toString(16);
}

/**
 * Unpack timelocks from uint256 format
 */
export function unpackTimelocks(packedTimelocks: string): Record<number, number> {
  const data = BigInt(packedTimelocks);
  const deployedAt = Number((data >> 224n) & 0xFFFFFFFFn);
  const timelocks: Record<number, number> = { deployedAt };
  
  for (let stage = 0; stage < 7; stage++) {
    const bitShift = BigInt(stage * 32);
    const stageOffset = Number((data >> bitShift) & 0xFFFFFFFFn);
    timelocks[stage] = deployedAt + stageOffset;
  }
  
  return timelocks;
}

/**
 * Validate escrow parameters
 */
export function validateEscrowParams(params: {
  orderHash: string;
  hashlock: string;
  maker: string;
  taker: string;
  token: string;
  amount: string;
  safetyDeposit: string;
  timelocks: Record<number, number>;
}): void {
  const required = [
    'orderHash', 'hashlock', 'maker', 'taker', 
    'token', 'amount', 'safetyDeposit', 'timelocks'
  ];

  for (const field of required) {
    if (!params[field as keyof typeof params]) {
      throw new Error(`Missing required parameter: ${field}`);
    }
  }

  // Validate hex strings
  if (!params.orderHash.match(/^0x[0-9a-fA-F]{64}$/)) {
    throw new Error('Invalid orderHash format');
  }

  if (!params.hashlock.match(/^0x[0-9a-fA-F]{64}$/)) {
    throw new Error('Invalid hashlock format');
  }

  // Validate Tezos addresses (t1, t2, t3 prefixes)
  if (!params.maker.match(/^t[1-3][0-9a-zA-Z]{33}$/)) {
    throw new Error('Invalid maker Tezos address');
  }

  if (!params.taker.match(/^t[1-3][0-9a-zA-Z]{33}$/)) {
    throw new Error('Invalid taker Tezos address');
  }

  // Validate amounts
  if (BigInt(params.amount) <= 0) {
    throw new Error('Amount must be positive');
  }

  if (BigInt(params.safetyDeposit) < 0) {
    throw new Error('Safety deposit cannot be negative');
  }
} 