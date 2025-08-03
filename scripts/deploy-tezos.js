#!/usr/bin/env node

/**
 * Tezos Contract Deployment Script
 * This script compiles and deploys the Tezos escrow contract to Ghostnet
 */

const {execSync} = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🌿 Tezos Contract Deployment Script')
console.log('====================================\n')

// Check if LIGO is installed
function checkLigoInstallation() {
    try {
        execSync('ligo --version', {stdio: 'pipe'})
        return true
    } catch (error) {
        return false
    }
}

// Compile Tezos contract
function compileTezosContract() {
    const sourceFile = path.join(__dirname, '..', 'contracts', 'src', 'TezosEscrow.mligo')
    const outputFile = path.join(__dirname, '..', 'contracts', 'src', 'TezosEscrow.tz')

    if (!fs.existsSync(sourceFile)) {
        console.log('❌ Tezos contract source file not found:', sourceFile)
        return false
    }

    console.log('🔧 Compiling Tezos contract...')
    console.log(`   Source: ${sourceFile}`)
    console.log(`   Output: ${outputFile}\n`)

    try {
        const command = `ligo compile contract ${sourceFile} --output-file ${outputFile}`
        console.log(`Running: ${command}\n`)

        const output = execSync(command, {encoding: 'utf8'})
        console.log('✅ Tezos contract compiled successfully!')
        console.log(output)

        // Verify the compiled file exists
        if (fs.existsSync(outputFile)) {
            const stats = fs.statSync(outputFile)
            console.log(`📄 Compiled contract size: ${stats.size} bytes`)
            return true
        } else {
            console.log('❌ Compiled contract file not found')
            return false
        }
    } catch (error) {
        console.log('❌ Tezos contract compilation failed!')
        console.log('Error:', error.message)

        if (error.message.includes('command not found')) {
            console.log('\n💡 Solution: Install LIGO first:')
            console.log('   npm run install:ligo')
            console.log('   or visit: https://ligolang.org/docs/intro/installation')
        }

        return false
    }
}

// Deploy to Tezos Ghostnet
function deployToTezos() {
    console.log('🚀 Deploying to Tezos Ghostnet...')
    console.log('   RPC: https://ghostnet.tezos.marigold.dev')
    console.log('   Network: Ghostnet (Testnet)\n')

    const compiledFile = path.join(__dirname, '..', 'contracts', 'src', 'TezosEscrow.tz')

    if (!fs.existsSync(compiledFile)) {
        console.log('❌ Compiled Tezos contract not found. Please compile first.')
        return false
    }

    console.log('📋 Deployment Information:')
    console.log('   Contract: TezosEscrow')
    console.log('   Network: Ghostnet')
    console.log('   Explorer: https://ghostnet.tzkt.io/')
    console.log('   Faucet: https://faucet.ghostnet.teztnets.xyz/\n')

    console.log('⚠️  Manual Deployment Required')
    console.log('=============================')
    console.log('Due to the complexity of Tezos deployment, you need to:')
    console.log('')
    console.log('1. Get testnet XTZ from the faucet:')
    console.log('   https://faucet.ghostnet.teztnets.xyz/')
    console.log('')
    console.log('2. Use a Tezos wallet (like Temple or Kukai) to deploy:')
    console.log('   - Connect to Ghostnet')
    console.log('   - Import the compiled contract: contracts/src/TezosEscrow.tz')
    console.log('   - Deploy with initial storage')
    console.log('')
    console.log('3. Update your configuration with the deployed address:')
    console.log('   - Add TEZOS_CONTRACT_ADDRESS to .env file')
    console.log('   - Update tests/config.ts with the new address')
    console.log('')
    console.log('4. Test the deployment:')
    console.log('   npm run test:testnet')
    console.log('')

    return true
}

// Main execution
function main() {
    console.log('🔍 Checking LIGO installation...')

    if (!checkLigoInstallation()) {
        console.log('❌ LIGO not found!')
        console.log('\n💡 Installing LIGO...\n')

        try {
            execSync('npm run install:ligo', {stdio: 'inherit'})
        } catch (error) {
            console.log('❌ LIGO installation failed. Please install manually:')
            console.log('   Visit: https://ligolang.org/docs/intro/installation')
            process.exit(1)
        }
    } else {
        console.log('✅ LIGO is installed!\n')
    }

    // Compile the contract
    if (!compileTezosContract()) {
        process.exit(1)
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Deploy to Tezos
    deployToTezos()

    console.log('🎉 Tezos deployment setup complete!')
    console.log('\nNext steps:')
    console.log('1. Get testnet XTZ from faucet')
    console.log('2. Deploy contract manually using a Tezos wallet')
    console.log('3. Update configuration with deployed address')
    console.log('4. Test the deployment')
}

// Run the script
main()
