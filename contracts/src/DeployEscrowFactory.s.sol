// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../lib/cross-chain-swap/contracts/EscrowFactory.sol";
import "../lib/cross-chain-swap/contracts/EscrowSrc.sol";
import "../lib/cross-chain-swap/contracts/EscrowDst.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract DeployEscrowFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Get configuration from environment or use defaults
        address limitOrderProtocol = vm.envOr("LIMIT_ORDER_PROTOCOL", address(0x111111125421cA6dc452d289314280a0f8842A65));
        address feeToken = vm.envOr("FEE_TOKEN", address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)); // USDC
        address accessToken = vm.envOr("ACCESS_TOKEN", address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)); // USDC
        address owner = vm.envOr("OWNER", address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8));
        uint32 rescueDelaySrc = uint32(vm.envOr("RESCUE_DELAY_SRC", uint256(3600))); // 1 hour
        uint32 rescueDelayDst = uint32(vm.envOr("RESCUE_DELAY_DST", uint256(3600))); // 1 hour
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the EscrowFactory
        EscrowFactory factory = new EscrowFactory(
            limitOrderProtocol,
            IERC20(feeToken),
            IERC20(accessToken),
            owner,
            rescueDelaySrc,
            rescueDelayDst
        );
        
        console.log("EscrowFactory deployed at:", address(factory));
        console.log("EscrowSrc implementation at:", factory.ESCROW_SRC_IMPLEMENTATION());
        console.log("EscrowDst implementation at:", factory.ESCROW_DST_IMPLEMENTATION());
        
        vm.stopBroadcast();
    }
} 