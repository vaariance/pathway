// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 value) external returns (bool);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);
}

interface ICCTP {
    event DepositForBurn(
        uint64 indexed nonce,
        address indexed burnToken,
        uint256 amount,
        address indexed depositor,
        bytes32 mintRecipient,
        uint32 destinationDomain,
        bytes32 destinationTokenMessenger,
        bytes32 destinationCaller
    );

    event MessageReceived(
        address indexed caller,
        uint32 sourceDomain,
        uint64 indexed nonce,
        bytes32 sender,
        bytes messageBody
    );

    event MintAndWithdraw(
        address indexed mintRecipient,
        uint256 amount,
        address indexed mintToken
    );

    event MessageSent(bytes message);

    function depositForBurnWithCaller(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken,
        bytes32 destinationCaller
    ) external returns (uint64 _nonce);

    function receiveMessage(
        bytes calldata message,
        bytes calldata attestation
    ) external returns (bool success);
}

/// delegates calls to light-account
/// forwards calls to token messenger with meta-transaction
/// forwards calls to token trasnmitter on-behalf of receiver
/// we don't care about deterministic behavior.
/// but we obviosly need to subtract the gas for destination domain
/// trade-off we can't upgrade the proxy.
contract Proxy {
    struct ProxyConfig {
        address messenger;
        address trasmitter;
        address usdc;
    }

    constructor(
        address implementation,
        address messenger,
        address trasmitter,
        address usdc
    ) {
        (
            ProxyConfig storage conf,
            bytes32 impl_slot
        ) = get_proxy_config_state();

        assembly {
            sstore(conf.slot, messenger)
            sstore(add(conf.slot, 1), trasmitter)
            sstore(add(conf.slot, 2), usdc)
            sstore(impl_slot, shr(96, shl(96, implementation)))
        }
    }

    /// @dev - same EIP1967 IMPLEMENTATION_SLOT
    function get_proxy_config_state()
        internal
        pure
        returns (ProxyConfig storage config, bytes32 impl_slot)
    {
        assembly ("memory-safe") {
            impl_slot := 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
            config.slot := 0x46e5b76fa5812da972ac2243cafd26236a072d9ff0770f97bad20263935dd600
        }
    }

    fallback() external payable {
        (, bytes32 impl_slot) = get_proxy_config_state();

        assembly {
            let implementation := sload(impl_slot)
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(
                gas(),
                implementation,
                0,
                calldatasize(),
                0,
                0
            )
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    /// entrypoint(call) -> proxy(delegate) -> impl(call) -> proxy(call) -> usdc/transmitter
    function receiveMessage(
        address receiver,
        bytes calldata message,
        bytes calldata attestation,
        uint256 fee_in_usdc
    ) public returns (bool received) {
        require(msg.sender == address(this), "Unauthorized");
        (ProxyConfig memory config, ) = get_proxy_config_state();

        bool success = ICCTP(config.trasmitter).receiveMessage(
            message,
            attestation
        );
        require(success, "Receive failed");

        bytes calldata msg_body = message[116:];
        uint256 amount = uint256(bytes32(msg_body[68:68 + 32]));

        uint256 mgc_in_usd = 5 * 1e6;
        uint256 fee_markup = fee_in_usdc / 2;
        uint256 agc_in_usd = fee_markup > mgc_in_usd
            ? mgc_in_usd + fee_in_usdc
            : fee_markup + fee_in_usdc;

        require(amount > agc_in_usd, "Insufficient amount");

        return IERC20(config.usdc).transfer(receiver, amount - agc_in_usd);
    }

    /// here users don't have to depend on our auto calling
    /// they get to pay the fees
    /// but since the destination caller is us, we have to route it.
    function receiveMessage(
        bytes calldata message,
        bytes calldata attestation
    ) public returns (bool received) {
        (ProxyConfig memory config, ) = get_proxy_config_state();
        return ICCTP(config.trasmitter).receiveMessage(message, attestation);
    }

    receive() external payable {}
}
