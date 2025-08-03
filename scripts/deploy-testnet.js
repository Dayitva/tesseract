#!/usr/bin/env node

/**
 * Testnet Deployment Script
 * This script helps deploy contracts to testnets with proper environment setup
 */

const {execSync} = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Testnet Deployment Script')
console.log('=============================\n')

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env')
if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!')
    console.log('Please run: npm run setup:testnet')
    console.log('Then edit .env with your private keys and contract addresses\n')
    process.exit(1)
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach((line) => {
    const [key, value] = line.split('=')
    if (key && value && !key.startsWith('#')) {
        envVars[key.trim()] = value.trim()
    }
})

// Check required environment variables
const requiredVars = ['PRIVATE_KEY']
const missingVars = requiredVars.filter((varName) => !envVars[varName])

if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:')
    missingVars.forEach((varName) => console.log(`   - ${varName}`))
    console.log('\nPlease edit .env file and add these variables.\n')
    process.exit(1)
}

console.log('✅ Environment variables loaded successfully\n')

// Only keep Sepolia in testnets
const testnets = {
    sepolia: {
        name: 'Sepolia (Ethereum Testnet)',
        rpc: envVars.SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/WddzdzI2o9S3COdT73d5w6AIogbKq4X-',
        chainId: 11155111,
        explorer: 'https://sepolia.etherscan.io/',
        faucet: 'https://sepoliafaucet.com/'
    }
}

console.log('📋 Available Testnets for Deployment:')
Object.entries(testnets).forEach(([key, config]) => {
    console.log(`   ${key}: ${config.name}`)
    console.log(`      RPC: ${config.rpc}`)
    console.log(`      Chain ID: ${config.chainId}`)
    console.log(`      Explorer: ${config.explorer}`)
    console.log(`      Faucet: ${config.faucet}\n`)
})

// Function to deploy to a specific testnet
function deployToTestnet(testnetKey) {
    const testnet = testnets[testnetKey]
    if (!testnet) {
        console.log(`❌ Unknown testnet: ${testnetKey}`)
        return
    }

    console.log(`🚀 Deploying to ${testnet.name}...`)
    console.log(`   RPC: ${testnet.rpc}`)
    console.log(`   Chain ID: ${testnet.chainId}\n`)

    try {
        // Set environment variables
        process.env.PRIVATE_KEY = envVars.PRIVATE_KEY

        // Run deployment command
        const command = `forge script contracts/src/DeployEscrowFactory.s.sol --rpc-url ${testnet.rpc} --broadcast --verify`

        console.log(`Running: ${command}\n`)

        const output = execSync(command, {
            encoding: 'utf8',
            stdio: 'pipe'
        })

        console.log('✅ Deployment successful!')
        console.log(output)

        // Extract contract addresses from output
        const addressMatch = output.match(/EscrowFactory deployed at: (0x[a-fA-F0-9]{40})/)
        if (addressMatch) {
            const contractAddress = addressMatch[1]
            console.log(`\n📋 Contract Information:`)
            console.log(`   Contract Address: ${contractAddress}`)
            console.log(`   Explorer: ${testnet.explorer}/address/${contractAddress}`)
            console.log(`   Network: ${testnet.name}`)
        }
    } catch (error) {
        console.log('❌ Deployment failed!')
        console.log('Error:', error.message)

        if (error.message.includes('insufficient funds')) {
            console.log('\n💡 Solution: Get testnet tokens from the faucet:')
            console.log(`   ${testnet.faucet}`)
        }

        if (error.message.includes('PRIVATE_KEY')) {
            console.log('\n💡 Solution: Set your private key in .env file')
        }
    }
}

// Main execution
const testnetToDeploy = process.argv[2]

if (!testnetToDeploy) {
    console.log('Usage: node scripts/deploy-testnet.js <testnet>')
    console.log('Available testnets:')
    Object.keys(testnets).forEach((key) => console.log(`   - ${key}`))
    console.log('\nExample: node scripts/deploy-testnet.js sepolia')
    process.exit(1)
}

deployToTestnet(testnetToDeploy)
