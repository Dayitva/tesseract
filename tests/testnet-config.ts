import {z} from 'zod'
import Sdk from '@1inch/cross-chain-sdk'
import * as process from 'node:process'

const bool = z
    .string()
    .transform((v) => v.toLowerCase() === 'true')
    .pipe(z.boolean())

const TestnetConfigSchema = z.object({
    SEPOLIA_RPC: z.string().url().optional(),
    BSC_TESTNET_RPC: z.string().url().optional(),
    TEZOS_GHOSTNET_RPC: z.string().url().optional(),
    SEPOLIA_PRIVATE_KEY: z.string().optional(),
    BSC_TESTNET_PRIVATE_KEY: z.string().optional(),
    TEZOS_PRIVATE_KEY: z.string().optional(),
    TEZOS_CONTRACT_ADDRESS: z.string().optional()
})

const fromEnv = TestnetConfigSchema.parse(process.env)

export const testnetConfig = {
    sepolia: {
        chainId: Sdk.NetworkEnum.ETHEREUM, // Use mainnet enum but testnet URL
        url: fromEnv.SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/WddzdzI2o9S3COdT73d5w6AIogbKq4X-',
        createFork: false,
        limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65', // Sepolia LOP address
        wrappedNative: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9', // Sepolia WETH
        ownerPrivateKey: fromEnv.SEPOLIA_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        tokens: {
            USDC: {
                address: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', // Sepolia USDC
                donor: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
            }
        }
    },
    bscTestnet: {
        chainId: Sdk.NetworkEnum.BINANCE, // Use mainnet enum but testnet URL
        url: fromEnv.BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545',
        createFork: false,
        limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65', // BSC Testnet LOP address
        wrappedNative: '0xae13d989dac2f0debff460ac112a837c89baa7cd', // BSC Testnet WBNB
        ownerPrivateKey: fromEnv.BSC_TESTNET_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        tokens: {
            USDC: {
                address: '0x64544969ed7ebf5f083679233325356ebe738930', // BSC Testnet USDC
                donor: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
            }
        }
    },
    tezosGhostnet: {
        chainId: 'TEZOS::1',
        url: fromEnv.TEZOS_GHOSTNET_RPC || 'https://ghostnet.tezos.marigold.dev',
        contractAddress: fromEnv.TEZOS_CONTRACT_ADDRESS || 'KT1TestContractAddress',
        ownerPrivateKey: fromEnv.TEZOS_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        tokens: {
            XTZ: {
                address: '0x0000000000000000000000000000000000000000', // Native XTZ
                donor: 'tz1TestDonorAddress'
            },
            USDC: {
                address: 'KT1TestUSDCAddress',
                donor: 'tz1TestUSDCDonor'
            }
        }
    }
} as const

export type TestnetChainConfig = (typeof testnetConfig)['sepolia' | 'bscTestnet' | 'tezosGhostnet'] 