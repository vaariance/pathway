// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Config} from "../script/Config.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockMessenger {
    using SafeERC20 for IERC20;

    uint64 public nextNonce = 0;

    /// @notice Mocks the depositForBurnWithCaller function
    /// @dev Pulls `amount` of `burnToken` from msg.sender and increments nonce
    function depositForBurnWithCaller(
        uint256 amount,
        uint32, /*destinationDomain*/ // unused in mock
        bytes32, /*mintRecipient*/ // unused in mock
        address burnToken,
        bytes32 /*destinationCaller*/ // unused in mock
    ) external returns (uint64 _nonce) {
        address usdc = Config.getActiveNetworkConfig().usdc;
        require(burnToken == usdc, "MockMessenger: unexpected burnToken");

        IERC20(burnToken).safeTransferFrom(msg.sender, address(this), amount);

        _nonce = ++nextNonce;
    }
}
