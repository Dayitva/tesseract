import {z} from 'zod'
import Sdk from '@1inch/cross-chain-sdk'
import * as process from 'node:process'

const bool = z
    .string()
    .transform((v) => v.toLowerCase() === 'true')
    .pipe(z.boolean())

const ConfigSchema = z.object({
    SRC_CHAIN_RPC: z.string().url(),
    DST_CHAIN_RPC: z.string().url(),
    SRC_CHAIN_CREATE_FORK: bool.default('false'),
    DST_CHAIN_CREATE_FORK: bool.default('false'),
    TEZOS_RPC_URL: z.string().url().optional(),
    TEZOS_CONTRACT_ADDRESS: z.string().optional(),
    USE_TESTNETS: bool.default('true'),
    SEPOLIA_RPC: z.string().url().optional(),
    TEZOS_GHOSTNET_RPC: z.string().url().optional()
})

const fromEnv = ConfigSchema.parse(process.env)

const testnetConfig = {
    sepolia: {
        chainId: Sdk.NetworkEnum.ETHEREUM, // Use mainnet enum but testnet URL
        url: fromEnv.SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/WddzdzI2o9S3COdT73d5w6AIogbKq4X-',
        createFork: false,
        limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65', // Sepolia LOP address
        wrappedNative: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9', // Sepolia WETH
        ownerPrivateKey: process.env.SEPOLIA_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        tokens: {
            USDC: {
                address: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', // Sepolia USDC
                donor: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
            }
        }
    },
    tezosGhostnet: {
        chainId: 'TEZOS::1',
        url: fromEnv.TEZOS_GHOSTNET_RPC || 'https://ghostnet.tezos.marigold.dev',
        contractAddress: fromEnv.TEZOS_CONTRACT_ADDRESS || 'KT1TestContractAddress',
        ownerPrivateKey: process.env.TEZOS_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
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
}

export const config = {
    chain: {
        // Use testnet configs when USE_TESTNETS is true
        source: fromEnv.USE_TESTNETS ? testnetConfig.sepolia : {
            chainId: Sdk.NetworkEnum.ETHEREUM,
            url: fromEnv.SRC_CHAIN_RPC,
            createFork: fromEnv.SRC_CHAIN_CREATE_FORK,
            limitOrderProtocol: '0x111111125421ca6dc452d289314280a0f8842a65',
            wrappedNative: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            ownerPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            tokens: {
                USDC: {
                    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    donor: '0xd54F23BE482D9A58676590fCa79c8E43087f92fB'
                }
            }
        },
        destination: fromEnv.USE_TESTNETS ? testnetConfig.tezosGhostnet : {
            chainId: 'TEZOS::1',
            url: fromEnv.TEZOS_RPC_URL || 'https://ghostnet.tezos.marigold.dev',
            contractAddress: fromEnv.TEZOS_CONTRACT_ADDRESS || 'KT1TestContractAddress',
            ownerPrivateKey: process.env.TEZOS_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            tokens: {
                XTZ: {
                    address: '0x0000000000000000000000000000000000000000',
                    donor: 'tz1TestDonorAddress'
                },
                USDC: {
                    address: 'KT1TestUSDCAddress',
                    donor: 'tz1TestUSDCDonor'
                }
            }
        },
        tezos: fromEnv.USE_TESTNETS ? testnetConfig.tezosGhostnet : {
            chainId: 'TEZOS::1',
            url: fromEnv.TEZOS_RPC_URL || 'https://ghostnet.tezos.marigold.dev',
            contractAddress: fromEnv.TEZOS_CONTRACT_ADDRESS || 'KT1TestContractAddress',
            ownerPrivateKey: process.env.TEZOS_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            tokens: {
                XTZ: {
                    address: '0x0000000000000000000000000000000000000000',
                    donor: 'tz1TestDonorAddress'
                },
                USDC: {
                    address: 'KT1TestUSDCAddress',
                    donor: 'tz1TestUSDCDonor'
                }
            }
        }
    }
}

export type ChainConfig = (typeof config.chain)['source' | 'destination' | 'tezos']
