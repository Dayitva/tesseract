import 'dotenv/config'
import {expect, jest} from '@jest/globals'

import {createServer, CreateServerReturnType} from 'prool'
import {anvil} from 'prool/instances'

import Sdk from '@1inch/cross-chain-sdk'
import {
    computeAddress,
    ContractFactory,
    JsonRpcProvider,
    MaxUint256,
    parseEther,
    parseUnits,
    randomBytes,
    Wallet as SignerWallet
} from 'ethers'
import {uint8ArrayToHex, UINT_40_MAX} from '@1inch/byte-utils'
import assert from 'node:assert'
import {ChainConfig, config} from './config'
import {Wallet} from './wallet'
import {Resolver} from './resolver'
import {EscrowFactory} from './escrow-factory'
import {TezosEscrowClient, createTezosWalletFromEthKey, packTimelocks} from './tezosUtils'
import factoryContract from '../dist/contracts/TestEscrowFactory.sol/TestEscrowFactory.json'
import resolverContract from '../dist/contracts/Resolver.sol/Resolver.json'

const {Address} = Sdk

jest.setTimeout(1000 * 60)

const userPk = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const resolverPk = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'

// eslint-disable-next-line max-lines-per-function
describe('Tezos to EVM Cross-Chain Atomic Swap', () => {
    const srcChainId = config.chain.tezos.chainId
    const dstChainId = config.chain.source.chainId

    type Chain = {
        node?: CreateServerReturnType | undefined
        provider: JsonRpcProvider
        escrowFactory: string
        resolver: string
    }

    let dst: Chain
    let tezosClient: TezosEscrowClient

    let dstChainUser: Wallet
    let dstChainResolver: Wallet
    let tezosUser: ReturnType<typeof createTezosWalletFromEthKey>
    let tezosResolver: ReturnType<typeof createTezosWalletFromEthKey>

    let dstFactory: EscrowFactory
    let dstResolverContract: Wallet

    let dstTimestamp: bigint

    async function increaseTime(t: number): Promise<void> {
        await dst.provider.send('evm_increaseTime', [t])
    }

    beforeAll(async () => {
        // Initialize EVM chain (destination)
        dst = await initChain(config.chain.source)

        // Initialize Tezos client (source)
        tezosClient = new TezosEscrowClient({
            rpcUrl: config.chain.tezos.url,
            contractAddress: config.chain.tezos.contractAddress,
            signerPrivateKey: config.chain.tezos.ownerPrivateKey
        })

        // Initialize wallets
        dstChainUser = new Wallet(userPk, dst.provider)
        dstChainResolver = new Wallet(resolverPk, dst.provider)
        
        tezosUser = createTezosWalletFromEthKey(userPk)
        tezosResolver = createTezosWalletFromEthKey(resolverPk)

        dstFactory = new EscrowFactory(dst.provider, dst.escrowFactory)
        
        // Fund user with USDC on destination chain (EVM)
        await dstChainUser.topUpFromDonor(
            config.chain.source.tokens.USDC.address,
            config.chain.source.tokens.USDC.donor,
            parseUnits('1000', 6)
        )
        await dstChainUser.approveToken(
            config.chain.source.tokens.USDC.address,
            config.chain.source.limitOrderProtocol,
            MaxUint256
        )

        // Initialize resolver contracts
        dstResolverContract = await Wallet.fromAddress(dst.resolver, dst.provider)
        await dstChainResolver.transfer(dst.resolver, parseEther('1'))
        await dstResolverContract.unlimitedApprove(config.chain.source.tokens.USDC.address, dst.escrowFactory)

        dstTimestamp = BigInt((await dst.provider.getBlock('latest'))!.timestamp)
    })

    async function getBalances(): Promise<{
        tezos: {user: string; resolver: string}; 
        dst: {user: bigint; resolver: bigint}
    }> {
        return {
            tezos: {
                user: await tezosClient.getBalance(tezosUser.address),
                resolver: await tezosClient.getBalance(tezosResolver.address)
            },
            dst: {
                user: await dstChainUser.tokenBalance(config.chain.source.tokens.USDC.address),
                resolver: await dstResolverContract.tokenBalance(config.chain.source.tokens.USDC.address)
            }
        }
    }

    afterAll(async () => {
        dst.provider.destroy()
        await dst.node?.stop()
    })

    describe('Tezos to EVM Atomic Swap', () => {
        it('should complete swap Tezos XTZ -> Ethereum USDC', async () => {
            const initialBalances = await getBalances()

            // Generate secret and hashlock
            const secret = TezosEscrowClient.generateSecret()
            const hashlock = TezosEscrowClient.hashSecret(secret)

            console.log('Generated secret:', secret)
            console.log('Generated hashlock:', hashlock)

            // Create cross-chain order on EVM side (destination)
            const order = Sdk.CrossChainOrder.new(
                new Address(dst.escrowFactory),
                {
                    salt: Sdk.randBigInt(1000n),
                    maker: new Address(await dstChainUser.getAddress()),
                    makingAmount: parseUnits('1', 6), // 1 USDC
                    takingAmount: parseUnits('1', 6), // 1 USDC equivalent in XTZ
                    makerAsset: new Address(config.chain.source.tokens.USDC.address),
                    takerAsset: new Address("0x0000000000000000000000000000000000000000") // Native XTZ
                },
                {
                    hashLock: Sdk.HashLock.forSingleFill(secret),
                    timeLocks: Sdk.TimeLocks.new({
                        srcWithdrawal: 10n, // 10sec finality lock for test
                        srcPublicWithdrawal: 120n, // 2m for private withdrawal
                        srcCancellation: 121n, // 1sec public withdrawal
                        srcPublicCancellation: 122n, // 1sec private cancellation
                        dstWithdrawal: 10n, // 10sec finality lock for test
                        dstPublicWithdrawal: 100n, // 100sec private withdrawal
                        dstCancellation: 101n // 1sec public withdrawal
                    }),
                    srcChainId,
                    dstChainId,
                    srcSafetyDeposit: parseUnits('1', 5),
                    dstSafetyDeposit: parseUnits('1', 5)
                },
                {
                    auction: new Sdk.AuctionDetails({
                        initialRateBump: 0,
                        points: [],
                        duration: 120n,
                        startTime: dstTimestamp
                    }),
                    whitelist: [
                        {
                            address: new Address(dst.resolver),
                            allowFrom: 0n
                        }
                    ],
                    resolvingStartTime: 0n
                },
                {
                    nonce: Sdk.randBigInt(UINT_40_MAX),
                    allowPartialFills: false,
                    allowMultipleFills: false
                }
            )

            const signature = await dstChainUser.signOrder(dstChainId, order)
            const orderHash = order.getOrderHash(dstChainId)

            console.log('Order created with hash:', orderHash)

            // Create source escrow on Tezos
            const srcImmutables = order.getSrcImmutables()
            const tezosOrderHash = await tezosClient.announceOrder({
                srcAmount: srcImmutables.amount.toString(),
                minDstAmount: '0',
                expirationDuration: Number(srcImmutables.timeLocks.srcCancellation),
                secretHash: srcImmutables.hashLock.toString()
            })

            console.log('Tezos escrow created:', tezosOrderHash)

            // Resolver fills the order and deploys destination escrow
            const resolver = new Resolver(dst.provider, dst.resolver)
            
            // Deploy destination escrow on EVM
            await resolver.deployDst(
                order.getDstImmutables(),
                Number(srcImmutables.timeLocks.srcCancellation)
            )

            console.log('Destination escrow deployed')

            // Wait for withdrawal window
            await increaseTime(15) // Wait for srcWithdrawal time

            // Withdraw from Tezos escrow using secret
            const tezosWithdrawHash = await tezosClient.claimFunds({
                orderId: 0, // First order
                secret: secret
            })

            console.log('Tezos withdrawal completed:', tezosWithdrawHash)

            // Withdraw from EVM escrow
            const dstEscrowAddress = await dstFactory.addressOfEscrowDst(order.getDstImmutables())
            await resolver.withdraw(
                {address: dstEscrowAddress} as any,
                secret,
                order.getDstImmutables()
            )

            console.log('EVM withdrawal completed')

            // Verify final balances
            const finalBalances = await getBalances()

            // Verify that the swap was successful
            expect(finalBalances.tezos.user).toBeLessThan(initialBalances.tezos.user)
            expect(finalBalances.dst.user).toBeGreaterThan(initialBalances.dst.user)

            console.log('Tezos to EVM cross-chain atomic swap completed successfully!')
        })

        it('should handle failed swap and allow cancellation', async () => {
            // This test would verify that if the swap fails, funds can be recovered
            // Implementation would be similar to the success case but with intentional failure
            console.log('Cancellation test - to be implemented')
        })
    })
})

async function initChain(
    cnf: ChainConfig
): Promise<{node?: CreateServerReturnType; provider: JsonRpcProvider; escrowFactory: string; resolver: string}> {
    const {node, provider} = await getProvider(cnf)
    
    const deployer = new SignerWallet(cnf.ownerPrivateKey, provider)
    
    const factory = await deploy(factoryContract, [], provider, deployer)
    const resolver = await deploy(resolverContract, [factory, '0x111111125421ca6dc452d289314280a0f8842a65', deployer.address], provider, deployer)
    
    return {node, provider, escrowFactory: factory, resolver}
}

async function getProvider(cnf: ChainConfig): Promise<{node?: CreateServerReturnType; provider: JsonRpcProvider}> {
    if (cnf.createFork) {
        const node = await createServer(anvil({
            forkUrl: cnf.url,
            forkBlockNumber: 20000000n
        }))
        return {node, provider: new JsonRpcProvider(node.url)}
    } else {
        return {provider: new JsonRpcProvider(cnf.url)}
    }
}

async function deploy(
    json: {abi: any; bytecode: any},
    params: unknown[],
    provider: JsonRpcProvider,
    deployer: SignerWallet
): Promise<string> {
    const factory = new ContractFactory(json.abi, json.bytecode, deployer)
    const contract = await factory.deploy(...params)
    await contract.waitForDeployment()
    return await contract.getAddress()
} 