// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {MulticallWithPermit} from "../src/MulticallWithPermit.sol";
import {Config} from "../script/Config.sol";
import {ByteCodes} from "./Bytecodes.sol";
import {MockMessenger, SafeERC20} from "./MockMessenger.sol";

contract MulticallWithPermitTest is Test {
    MulticallWithPermit public multicaller;
    Config.NetworkConfig public networkConfig;

    bytes32 private constant PERMIT_TYPEHASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;

    uint256 ownerPrivKey = 0x0b1;
    address owner = vm.addr(ownerPrivKey);

    uint256 userPrivKey = 0xAda;
    address user = vm.addr(userPrivKey);

    uint256 user2PrivKey = 0xEAF;
    address user2 = vm.addr(user2PrivKey);

    address otherToken = vm.addr(0x123);

    function setUp() public {
        networkConfig = Config.getActiveNetworkConfig();
        vm.etch(networkConfig.usdc, ByteCodes.usdcCode);
        vm.etch(address(otherToken), ByteCodes.usdcCode);
        multicaller = new MulticallWithPermit(owner);
        vm.etch(networkConfig.messenger, address(new MockMessenger()).code);
        multicaller.initialize(networkConfig.usdc, networkConfig.messenger);
    }

    function test_Pause() public {
        vm.prank(owner);
        multicaller.pause();
        assertEq(multicaller.paused(), true);
    }

    function test_Unpause() public {
        vm.startPrank(owner);
        multicaller.pause();
        multicaller.unpause();
        vm.stopPrank();
        assertEq(multicaller.paused(), false);
    }

    function test_Withdraw() public {
        vm.startPrank(owner);
        uint256 amount = 100e6;
        deal(networkConfig.usdc, address(multicaller), amount);
        assertEq(IERC20(networkConfig.usdc).balanceOf(address(multicaller)), amount);
        vm.expectRevert(MulticallWithPermit.TokenCannotBeWithdrawnManually.selector);
        multicaller.withdraw(IERC20(networkConfig.usdc), amount);
        vm.stopPrank();
    }

    function test_WithdrawOtherToken() public {
        vm.startPrank(owner);
        uint256 amount = 100e6;
        deal(otherToken, address(multicaller), amount);
        assertEq(IERC20(otherToken).balanceOf(address(multicaller)), amount);
        multicaller.withdraw(IERC20(otherToken), amount);
        vm.stopPrank();
        assertEq(IERC20(otherToken).balanceOf(address(multicaller)), 0);
        assertEq(IERC20(otherToken).balanceOf(address(owner)), amount);
    }

    function test_WithdrawOtherToken_ZeroBalance() public {
        vm.startPrank(owner);
        uint256 amount = 0;
        deal(otherToken, address(multicaller), amount);
        assertEq(IERC20(otherToken).balanceOf(address(multicaller)), amount);
        vm.expectRevert(MulticallWithPermit.AmountCannotBeZero.selector);
        multicaller.withdraw(IERC20(otherToken), amount);
        vm.stopPrank();
    }

    function test_ExecuteCallWithPermit() public {
        address relayer = vm.addr(0xEAE);

        uint256 initialUserBalance = 1_000e6;
        deal(networkConfig.usdc, user, initialUserBalance);
        assertEq(IERC20(networkConfig.usdc).balanceOf(user), initialUserBalance);

        uint96 realDeadline = uint96(block.timestamp + 3600); // 1 hour from now
        uint256 packedDeadline = packDeadlineAndRelayer(realDeadline, relayer);

        uint256 amount = 100e6; // 100 USDC
        uint256 fee = 4e6; // 4 USDC

        (uint8 v, bytes32 r, bytes32 s) = signPermit(amount + fee, packedDeadline, userPrivKey);

        MulticallWithPermit.CallWithPermit memory callData =
            encodeMessage(user, amount, fee, amount, packedDeadline, v, r, s);

        vm.expectEmit(
            true, // check topic for `user` (indexed)
            false, // we won't check topic for `relayer` because it's not indexed
            false, // we won't check topic for `amount` because it's not indexed
            true // check topic for `nonce` (indexed)
        );
        emit MulticallWithPermit.MulticallExecuted(
            user, // pass your expected user address
            relayer, // pass your expected relayer address
            amount + fee, // pass your expected amount
            1 // pass your expected nonce
        );

        vm.prank(relayer);
        uint64 nonce = multicaller.executeCallWithPermit(callData);

        uint256 finalUserBalance = IERC20(networkConfig.usdc).balanceOf(user);
        assertEq(finalUserBalance, initialUserBalance - amount - fee);

        assertGt(nonce, 0);

        uint256 multicallBalance = IERC20(networkConfig.usdc).balanceOf(address(multicaller));
        assertEq(multicallBalance, 0);

        uint256 relayerBalance = IERC20(networkConfig.usdc).balanceOf(relayer);
        assertEq(relayerBalance, fee);
    }

    function test_ExecuteCallWithPermit_ZeroAmount() public {
        address relayer = vm.addr(0xEAE);

        uint96 realDeadline = uint96(block.timestamp + 3600); // 1 hour from now
        uint256 packedDeadline = packDeadlineAndRelayer(realDeadline, relayer);

        (uint8 v, bytes32 r, bytes32 s) = signPermit(0, packedDeadline, userPrivKey);

        MulticallWithPermit.CallWithPermit memory callData = encodeMessage(user, 0, 0, 0, packedDeadline, v, r, s);

        vm.prank(relayer);
        vm.expectRevert(MulticallWithPermit.AmountCannotBeZero.selector);
        multicaller.executeCallWithPermit(callData);
    }

    function test_ExecuteCallWithPermit_InvalidRelayer() public {
        address relayer = vm.addr(0xEAE);
        address invalidRelayer = vm.addr(0xEAF);

        uint96 realDeadline = uint96(block.timestamp + 3600); // 1 hour from now
        uint256 packedDeadline = packDeadlineAndRelayer(realDeadline, relayer);

        uint256 amount = 100e6; // 100 USDC
        uint256 fee = 4e6; // 4 USDC

        (uint8 v, bytes32 r, bytes32 s) = signPermit(amount + fee, packedDeadline, userPrivKey);

        MulticallWithPermit.CallWithPermit memory callData =
            encodeMessage(user, amount, fee, amount, packedDeadline, v, r, s);

        vm.prank(invalidRelayer);
        vm.expectRevert(MulticallWithPermit.UnAuthorizedRelayer.selector);
        multicaller.executeCallWithPermit(callData);
    }

    function test_ExecuteCallWithPermit_InsufficientAllowance() public {
        address relayer = vm.addr(0xEAE);

        uint256 initialUserBalance = 1_000e6;
        deal(networkConfig.usdc, user, initialUserBalance);

        uint96 realDeadline = uint96(block.timestamp + 3600); // 1 hour from now
        uint256 packedDeadline = packDeadlineAndRelayer(realDeadline, relayer);

        uint256 amount = 100e6; // 100 USDC

        (uint8 v, bytes32 r, bytes32 s) = signPermit(amount, packedDeadline, userPrivKey);

        MulticallWithPermit.CallWithPermit memory callData =
            encodeMessage(user, amount, 0, amount + 4e6, packedDeadline, v, r, s);

        vm.prank(relayer);
        vm.expectRevert(MulticallWithPermit.DepositFailed.selector);
        multicaller.executeCallWithPermit(callData);
    }

    function test_ExecuteCallWithPermit_PastDeadline() public {
        address relayer = vm.addr(0xEAE);

        uint256 initialUserBalance = 1_000e6;
        deal(networkConfig.usdc, user, initialUserBalance);

        uint96 realDeadline = uint96(block.timestamp + 3600); // 1 hour from now
        uint256 packedDeadline = packDeadlineAndRelayer(realDeadline, relayer);
        vm.warp(packedDeadline + 1);
        uint256 amount = 100e6; // 100 USDC

        (uint8 v, bytes32 r, bytes32 s) = signPermit(amount, packedDeadline, userPrivKey);

        MulticallWithPermit.CallWithPermit memory callData =
            encodeMessage(user, amount, 0, amount, packedDeadline, v, r, s);

        vm.prank(relayer);
        vm.expectRevert(MulticallWithPermit.PermitDeadlineExpired.selector);
        multicaller.executeCallWithPermit(callData);
    }

    function test_ExecuteMulticallCallWithPermits() public {
        address relayer = vm.addr(0xEAE);
        uint256 initialUserBalance = 1_000e6;

        deal(networkConfig.usdc, user, initialUserBalance);
        deal(networkConfig.usdc, user2, initialUserBalance);

        assertEq(IERC20(networkConfig.usdc).balanceOf(user), initialUserBalance);
        assertEq(IERC20(networkConfig.usdc).balanceOf(user2), initialUserBalance);

        uint96 realDeadline = uint96(block.timestamp + 3600); // 1 hour from now
        uint256 packedDeadline = packDeadlineAndRelayer(realDeadline, relayer);

        uint256 amount = 100e6; // 100 USDC
        uint256 fee = 4e6; // 4 USDC

        (uint8 v, bytes32 r, bytes32 s) = signPermit(amount + fee, packedDeadline, userPrivKey);

        (uint8 v2, bytes32 r2, bytes32 s2) = signPermit(amount + fee, packedDeadline, user2PrivKey);

        MulticallWithPermit.CallWithPermit memory callData1 =
            encodeMessage(user, amount, fee, amount, packedDeadline, v, r, s);
        MulticallWithPermit.CallWithPermit memory callData2 =
            encodeMessage(user2, amount, fee, amount, packedDeadline, v2, r2, s2);

        vm.expectEmit(
            true, // check topic for `user` (indexed)
            false, // we won't check topic for `relayer` because it's not indexed
            false, // we won't check topic for `amount` because it's not indexed
            true // check topic for `nonce` (indexed)
        );
        emit MulticallWithPermit.MulticallExecuted(
            user, // pass your expected user address
            relayer, // pass your expected relayer address
            amount + fee, // pass your expected amount
            1 // pass your expected nonce
        );

        vm.expectEmit(
            true, // check topic for `user` (indexed)
            false, // we won't check topic for `relayer` because it's not indexed
            false, // we won't check topic for `amount` because it's not indexed
            true // check topic for `nonce` (indexed)
        );
        emit MulticallWithPermit.MulticallExecuted(
            user2, // pass your expected user address
            relayer, // pass your expected relayer address
            amount + fee, // pass your expected amount
            1 // pass your expected nonce
        );

        MulticallWithPermit.CallWithPermit[] memory calls = new MulticallWithPermit.CallWithPermit[](2);
        calls[0] = callData1;
        calls[1] = callData2;

        vm.prank(relayer);
        multicaller.executeMulticallWithPermits(calls);

        uint256 finalUserBalance = IERC20(networkConfig.usdc).balanceOf(user);
        assertEq(finalUserBalance, initialUserBalance - amount - fee);

        uint256 finalUser2Balance = IERC20(networkConfig.usdc).balanceOf(user2);
        assertEq(finalUser2Balance, initialUserBalance - amount - fee);

        uint256 multicallBalance = IERC20(networkConfig.usdc).balanceOf(address(multicaller));
        assertEq(multicallBalance, 0);

        uint256 relayerBalance = IERC20(networkConfig.usdc).balanceOf(relayer);
        assertEq(relayerBalance, fee * 2);
    }

    function packDeadlineAndRelayer(uint96 realDeadline, address relayer) internal pure returns (uint256) {
        return (uint256(realDeadline) << 160) | uint160(relayer);
    }

    function signPermit(uint256 value, uint256 deadline, uint256 privKey)
        internal
        view
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        address _user = vm.addr(privKey);
        IERC20Permit token = IERC20Permit(networkConfig.usdc);
        bytes32 domainSeparator = token.DOMAIN_SEPARATOR();
        uint256 nonce = token.nonces(_user);
        bytes32 structHash = keccak256(abi.encode(PERMIT_TYPEHASH, _user, address(multicaller), value, nonce, deadline));
        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);
        (v, r, s) = vm.sign(privKey, digest);
    }

    function encodeMessage(
        address _user,
        uint256 amount,
        uint256 fee,
        uint256 burnAmount,
        uint256 packedDeadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view returns (MulticallWithPermit.CallWithPermit memory callData) {
        return MulticallWithPermit.CallWithPermit({
            user: _user,
            amount: amount + fee,
            message: abi.encodeCall(
                MockMessenger.depositForBurnWithCaller,
                (
                    burnAmount,
                    uint32(4), // fake domain
                    bytes32(uint256(uint160(_user))),
                    networkConfig.usdc,
                    bytes32(uint256(uint160(packedDeadline)))
                )
            ),
            deadline: packedDeadline,
            v: v,
            r: r,
            s: s
        });
    }
}
