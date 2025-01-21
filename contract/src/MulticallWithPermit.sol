// SPDX-License-Identifier: BSD-3-Clause
pragma solidity 0.8.26;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title  MulticallWithPermit - A contract for batched USDC token permit and CCTP message execution
/// @notice This contracts enables efficient cross-chain transfers via CCTP,
///         by enabling the user to only sign a single permit message for each cross-chain transfer
///         the relayer takes the responsibilty of executing the CCTP message alongside the permit
///         for batch calls, the relayer can execute multiple permit and CCTP messages in a single transaction.
///         however, since there is a fee for each CallWithPermit, the cost of one TX pays for all in the batch
///         and the associated fees included in other items in the batch is sent to the relayer.
/// @dev    Implements reentry protection, pausability, and owner controls
///         For future improvements, consider registering multiple relayers; allowing gamified relayer selection
contract MulticallWithPermit is Initializable, Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public usdc;
    address public messenger;

    /// @notice Struct containing all parameters needed for a permit and message call
    /// @param user The user address whose tokens will be transferred
    /// @param amount The amount of tokens to transfer
    /// @param message The message to be sent to the cctp messenger contract
    /// @param deadline The deadline for the permit signature which is a combination of the deadline
    ///                 for the signature and relayer address permitted to execute the call
    /// @param v The v component of the permit signature
    /// @param r The r component of the permit signature
    /// @param s The s component of the permit signature
    struct CallWithPermit {
        address user;
        uint256 amount;
        bytes message;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    /// @notice Thrown when an invalid address (zero address) is provided
    error InvalidAddress(address);
    /// @notice Thrown when trying to process a zero amount
    error AmountCannotBeZero();
    /// @notice Thrown when the call to cctp messenger fails
    error DepositFailed();
    /// @notice Thrown when non-relayer tries to execute calls
    error UnAuthorizedRelayer();
    /// @notice Thrown when trying to withdraw USDC
    error TokenCannotBeWithdrawnManually();
    /// @notice Thrown when the permit deadline has expired
    error PermitDeadlineExpired();

    /// @notice Emitted when a multicall is successfully executed
    /// @param user The user whose tokens were transferred
    /// @param relayer The address that executed the call
    /// @param amount The amount of tokens transferred
    /// @param nonce The unique nonce returned by the messenger
    event MulticallExecuted(address indexed user, address relayer, uint256 amount, uint64 indexed nonce);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Initializes the contract
    /// @dev Approves the messenger contract to spend (MAX) of it's USDC tokens
    /// @param _token The USDC token address
    /// @param _messenger The messenger contract address
    function initialize(address _token, address _messenger) external initializer {
        require(_token != address(0), InvalidAddress(_token));
        require(_messenger != address(0), InvalidAddress(_messenger));
        IERC20(_token).approve(_messenger, type(uint256).max);
        usdc = IERC20(_token);
        messenger = _messenger;
    }

    /// @notice Executes a single permit and message call
    /// @dev Can be called by any relayer if and only if -
    ///      the relayer is authorized by the user in the permit deadline field
    /// @param call The CallWithPermit struct containing all parameters
    /// @return nonce The unique nonce from the messenger
    function executeCallWithPermit(CallWithPermit calldata call)
        external
        whenNotPaused
        nonReentrant
        returns (uint64 nonce)
    {
        address self = address(this);
        permit(call.user, self, call.amount, call.deadline, call.v, call.r, call.s);
        nonce = sendMessage(call.user, self, call.amount, call.message);
        drain(usdc, self, msg.sender);
    }

    /// @notice Executes multiple permit and message calls in batch
    /// @dev Processes all permits first, then messages, for gas efficiency
    /// @param calls Array of CallWithPermit structs to process
    function executeMulticallWithPermits(CallWithPermit[] calldata calls)
        external
        whenNotPaused
        nonReentrant
        returns (uint64[] memory nonces)
    {
        address self = address(this);
        nonces = new uint64[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            CallWithPermit calldata call = calls[i];
            permit(call.user, self, call.amount, call.deadline, call.v, call.r, call.s);
        }
        for (uint256 i = 0; i < calls.length; i++) {
            CallWithPermit calldata call = calls[i];
            nonces[i] = sendMessage(call.user, self, call.amount, call.message);
        }
        drain(usdc, self, msg.sender);
    }

    function withdraw(IERC20 _token, uint256 amount) external onlyOwner {
        require(amount > 0, AmountCannotBeZero());
        require(_token != usdc, TokenCannotBeWithdrawnManually());
        _token.safeTransfer(owner(), amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function addMessengerAllowance(uint256 _value) external onlyOwner {
        usdc.approve(messenger, _value);
    }

    function revokeMessengerAllowance() external onlyOwner {
        usdc.approve(messenger, 0);
    }

    /// @notice Internal function to process permit
    /// @dev Verifies amount and executes the ERC20 permit
    /// @param user The user address
    /// @param self The contract address
    /// @param amount The amount to permit
    /// @param deadline The permit deadline
    /// @param v The v component of the signature
    /// @param r The r component of the signature
    /// @param s The s component of the signature
    function permit(address user, address self, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
        internal
    {
        require(amount > 0, AmountCannotBeZero());
        (uint96 _deadline, address _relayer) = decodeDeadlineField(deadline);
        require(block.timestamp <= _deadline, PermitDeadlineExpired());
        require(msg.sender == _relayer, UnAuthorizedRelayer());
        IERC20Permit(address(usdc)).permit(user, self, amount, deadline, v, r, s);
    }

    /// @notice Internal function to send a `DepositForBurnWithCaller` message to CCTP messenger
    /// @dev Transfers burn token (USDC) amount from user and calls messenger
    /// @param user The user address
    /// @param self The contract address
    /// @param amount The amount to transfer
    /// @param message The message to send
    /// @return nonce The unique nonce from the messenger
    function sendMessage(address user, address self, uint256 amount, bytes calldata message)
        internal
        returns (uint64 nonce)
    {
        usdc.safeTransferFrom(user, self, amount);
        (bool success, bytes memory _nonce) = messenger.call(message);
        require(success, DepositFailed());
        nonce = abi.decode(_nonce, (uint64));
        require(nonce > 0, DepositFailed());
        emit MulticallExecuted(user, msg.sender, amount, nonce);
    }

    /// @notice Prevents any remaining balance from being left in the contract post execution
    /// @param token The token to transfer
    /// @param from Source address
    /// @param to Destination address
    function drain(IERC20 token, address from, address to) internal {
        uint256 remaining = token.balanceOf(from);
        if (remaining > 0) {
            token.safeTransfer(to, remaining);
        }
    }

    function decodeDeadlineField(uint256 field) internal pure returns (uint96 deadline, address relayer) {
        relayer = address(uint160(field));
        deadline = uint96(field >> 160);
    }
}
