import {z} from 'zod'
import * as process from 'node:process'

const bool = z
    .string()
    .transform((v) => v.toLowerCase() === 'true')
    .pipe(z.boolean())

const ForkConfigSchema = z.object({
    ENABLE_FORK_TESTING: bool.default('true'),
    ANVIL_EXECUTABLE: z.string().default('anvil'),
    GANACHE_EXECUTABLE: z.string().default('ganache'),
    FORK_BLOCK_NUMBER: z.string().optional(),
    USE_HARDHAT_NETWORK: bool.default('false'),
    SEPOLIA_FORK_URL: z.string().url().optional(),
    TEZOS_SANDBOX_URL: z.string().url().optional()
})

const forkConfig = ForkConfigSchema.parse(process.env)

export const FORK_CONFIG = {
    enabled: forkConfig.ENABLE_FORK_TESTING,
    
    ethereum: {
        // Fork Sepolia testnet for EVM testing
        forkUrl: forkConfig.SEPOLIA_FORK_URL || 'https://eth-sepolia.g.alchemy.com/v2/WddzdzI2o9S3COdT73d5w6AIogbKq4X-',
        chainId: 11155111, // Sepolia
        blockNumber: forkConfig.FORK_BLOCK_NUMBER ? parseInt(forkConfig.FORK_BLOCK_NUMBER) : undefined,
        localPort: 8545,
        accounts: [
            {
                privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
                balance: '10000000000000000000000' // 10,000 ETH
            },
            {
                privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
                balance: '10000000000000000000000' // 10,000 ETH
            }
        ],
        contracts: {
            escrowFactory: process.env.SEPOLIA_ESCROW_FACTORY || '0x1111111111111111111111111111111111111111',
            weth: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
            usdc: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238'
        }
    },
    
    tezos: {
        // Use Tezos sandbox or Ghostnet fork
        sandboxUrl: forkConfig.TEZOS_SANDBOX_URL || 'http://localhost:20000',
        ghostnetUrl: 'https://ghostnet.tezos.marigold.dev',
        useGhostnet: true, // Set to false to use local sandbox
        accounts: [
            {
                privateKey: 'spsk1ZLm5rZzVhqg4Wvo8EL2Zqk1yUhBKKgwhbh8W8Y6JJ1z5y3CkJu',
                address: 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb',
                balance: '10000000000' // 10,000 XTZ in mutez
            },
            {
                privateKey: 'spsk2rBDDeWr3MKwX7Kz5Z9y2MHzk2Z8Y6JJ1z5y3CkJu4Wvo8EL2Z',
                address: 'tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6',
                balance: '10000000000' // 10,000 XTZ in mutez
            }
        ],
        contracts: {
            escrow: process.env.TEZOS_ESCROW_CONTRACT || 'KT1TestEscrowContract'
        }
    },
    
    // Test scenarios configuration
    scenarios: {
        swapAmounts: {
            small: {
                eth: '0.01', // 0.01 ETH
                xtz: '100000' // 0.1 XTZ in mutez
            },
            medium: {
                eth: '0.1', // 0.1 ETH  
                xtz: '1000000' // 1 XTZ in mutez
            },
            large: {
                eth: '1.0', // 1 ETH
                xtz: '10000000' // 10 XTZ in mutez
            }
        },
        timeouts: {
            short: 300, // 5 minutes
            medium: 1800, // 30 minutes
            long: 3600 // 1 hour
        },
        secrets: {
            valid: 'test_secret_12345',
            invalid: 'wrong_secret_67890',
            empty: ''
        }
    },
    
    // Performance testing thresholds
    performance: {
        maxTransactionTime: 30000, // 30 seconds
        maxBlockConfirmation: 60000, // 1 minute
        maxSwapCompletionTime: 300000, // 5 minutes
        gasLimits: {
            announce: 200000,
            claim: 150000,
            cancel: 100000
        }
    },
    
    // Security testing parameters
    security: {
        enableReentrancyTests: true,
        enableFrontRunningTests: true,
        enableTimingAttackTests: true,
        maxSecretLength: 1000,
        minExpirationTime: 60 // 1 minute minimum
    }
}

// Utility functions for fork management
export class ForkManager {
    static async startEthereumFork(): Promise<{url: string, cleanup: () => Promise<void>}> {
        if (!FORK_CONFIG.enabled) {
            throw new Error('Fork testing is disabled')
        }
        
        console.log('🔧 Starting Ethereum fork...')
        
        // In a real implementation, this would start anvil or hardhat network
        const mockCleanup = async () => {
            console.log('🛑 Stopping Ethereum fork...')
        }
        
        return {
            url: `http://localhost:${FORK_CONFIG.ethereum.localPort}`,
            cleanup: mockCleanup
        }
    }
    
    static async startTezosSandbox(): Promise<{url: string, cleanup: () => Promise<void>}> {
        if (!FORK_CONFIG.enabled) {
            throw new Error('Fork testing is disabled')
        }
        
        console.log('🔧 Starting Tezos sandbox...')
        
        // In a real implementation, this would start Flextesa sandbox
        const mockCleanup = async () => {
            console.log('🛑 Stopping Tezos sandbox...')
        }
        
        return {
            url: FORK_CONFIG.tezos.sandboxUrl,
            cleanup: mockCleanup
        }
    }
    
    static async deployTestContracts(): Promise<{
        ethEscrowFactory: string,
        tezosEscrow: string
    }> {
        console.log('📄 Deploying test contracts...')
        
        // Mock contract deployment
        return {
            ethEscrowFactory: '0x' + '1'.repeat(40),
            tezosEscrow: 'KT1' + 'T'.repeat(34)
        }
    }
    
    static async fundTestAccounts(): Promise<void> {
        console.log('💰 Funding test accounts...')
        
        // In real implementation, this would:
        // 1. Send ETH to test accounts on Ethereum fork
        // 2. Send XTZ to test accounts on Tezos sandbox
        // 3. Deploy and mint test tokens if needed
    }
    
    static generateTestSecret(): {secret: string, hash: string} {
        const secret = 'test_secret_' + Math.random().toString(36).substring(7)
        const crypto = require('crypto')
        const hash = '0x' + crypto.createHash('sha256').update(secret).digest('hex')
        
        return {secret, hash}
    }
    
    static async waitForConfirmation(
        chain: 'ethereum' | 'tezos',
        txHash: string,
        confirmations: number = 1
    ): Promise<boolean> {
        console.log(`⏳ Waiting for ${confirmations} confirmations on ${chain} for tx: ${txHash}`)
        
        // Mock confirmation wait
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        return true
    }
}

export default FORK_CONFIG