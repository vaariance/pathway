export const IERC20 = [
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'spender', type: 'address', internalType: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'value', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'value', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address', internalType: 'address' },
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'value', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    inputs: [],
    stateMutability: 'view',
    type: 'function',
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ]
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function',
    name: 'nonces',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ]
  },
  {
    inputs: [],
    name: 'version',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export const ICCTP = [
  {
    type: 'function',
    name: 'depositForBurnWithCaller',
    inputs: [
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'destinationDomain', type: 'uint32', internalType: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32', internalType: 'bytes32' },
      { name: 'burnToken', type: 'address', internalType: 'address' },
      { name: 'destinationCaller', type: 'bytes32', internalType: 'bytes32' }
    ],
    outputs: [{ name: '_nonce', type: 'uint64', internalType: 'uint64' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'receiveMessage',
    inputs: [
      { name: 'message', type: 'bytes', internalType: 'bytes' },
      { name: 'attestation', type: 'bytes', internalType: 'bytes' }
    ],
    outputs: [{ name: 'success', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    name: 'MessageSent',
    inputs: [{ name: 'message', type: 'bytes', indexed: false, internalType: 'bytes' }],
    anonymous: false
  },
  {
    type: 'event',
    name: 'MessageReceived',
    inputs: [
      {
        name: 'caller',
        type: 'address',
        indexed: true,
        internalType: 'address'
      },
      {
        name: 'sourceDomain',
        type: 'uint32',
        indexed: false,
        internalType: 'uint32'
      },
      { name: 'nonce', type: 'uint64', indexed: true, internalType: 'uint64' },
      {
        name: 'sender',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32'
      },
      {
        name: 'messageBody',
        type: 'bytes',
        indexed: false,
        internalType: 'bytes'
      }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'DepositForBurn',
    inputs: [
      { name: 'nonce', type: 'uint64', indexed: true, internalType: 'uint64' },
      {
        name: 'burnToken',
        type: 'address',
        indexed: true,
        internalType: 'address'
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256'
      },
      {
        name: 'depositor',
        type: 'address',
        indexed: true,
        internalType: 'address'
      },
      {
        name: 'mintRecipient',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32'
      },
      {
        name: 'destinationDomain',
        type: 'uint32',
        indexed: false,
        internalType: 'uint32'
      },
      {
        name: 'destinationTokenMessenger',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32'
      },
      {
        name: 'destinationCaller',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32'
      }
    ],
    anonymous: false
  }
] as const

export const AGGREGATOR_V3_INTERFACE = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'description',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint80', name: '_roundId', type: 'uint80' }],
    name: 'getRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'version',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export const MULLTICALLER_WITH_PERMIT_ABI = [
  {
    type: 'function',
    name: 'executeCallWithPermit',
    inputs: [
      {
        name: 'call',
        type: 'tuple',
        internalType: 'struct MulticallWithPermit.CallWithPermit',
        components: [
          { name: 'user', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'message', type: 'bytes', internalType: 'bytes' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' },
          { name: 'v', type: 'uint8', internalType: 'uint8' },
          { name: 'r', type: 'bytes32', internalType: 'bytes32' },
          { name: 's', type: 'bytes32', internalType: 'bytes32' }
        ]
      }
    ],
    outputs: [{ name: 'nonce', type: 'uint64', internalType: 'uint64' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'executeMulticallWithPermits',
    inputs: [
      {
        name: 'calls',
        type: 'tuple[]',
        internalType: 'struct MulticallWithPermit.CallWithPermit[]',
        components: [
          { name: 'user', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'message', type: 'bytes', internalType: 'bytes' },
          { name: 'deadline', type: 'uint256', internalType: 'uint256' },
          { name: 'v', type: 'uint8', internalType: 'uint8' },
          { name: 'r', type: 'bytes32', internalType: 'bytes32' },
          { name: 's', type: 'bytes32', internalType: 'bytes32' }
        ]
      }
    ],
    outputs: [{ name: 'nonces', type: 'uint64[]', internalType: 'uint64[]' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    name: 'MulticallExecuted',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      {
        name: 'relayer',
        type: 'address',
        indexed: false,
        internalType: 'address'
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256'
      },
      { name: 'nonce', type: 'uint64', indexed: true, internalType: 'uint64' }
    ],
    anonymous: false
  },
  { type: 'error', name: 'AmountCannotBeZero', inputs: [] },
  { type: 'error', name: 'DepositFailed', inputs: [] },
  {
    type: 'error',
    name: 'InvalidAddress',
    inputs: [{ name: '', type: 'address', internalType: 'address' }]
  },
  { type: 'error', name: 'PermitDeadlineExpired', inputs: [] },
  {
    type: 'error',
    name: 'SafeERC20FailedOperation',
    inputs: [{ name: 'token', type: 'address', internalType: 'address' }]
  },
  { type: 'error', name: 'TokenCannotBeWithdrawnManually', inputs: [] },
  { type: 'error', name: 'UnAuthorizedRelayer', inputs: [] }
] as const
