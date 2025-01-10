import {
  mainnet,
  arbitrum,
  base,
  avalanche,
  polygon,
  optimism,
  Chain,
  sepolia,
  avalancheFuji
} from 'viem/chains'

import { Address } from 'viem'
import { AssetInfo, CrossChainAddress, Mode } from './types'

export enum Chains {
  noble = 'noble',
  ethereum = 'ethereum',
  arbitrum = 'arbitrum',
  base = 'base',
  avalanche = 'avalanche',
  polygon = 'polygon',
  optimism = 'optimism',
  // testnets
  grand = 'grand',
  sepolia = 'sepolia',
  fuji = 'fuji'
}

export enum USDC_CONTRACTS {
  ethereum = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  noble = 'uusdc',
  arbitrum = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  base = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  avalanche = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  optimism = '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
  polygon = '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
  // testnets
  grand = 'uusdc',
  sepolia = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  fuji = '0x5425890298aed601595a70ab815c96711a31bc65'
}

export enum TOKEN_MESSENGERS {
  arbitrum = '0x19330d10D9Cc8751218eaf51E8885D058642E08A',
  ethereum = '0xbd3fa81b58ba92a82136038b25adec7066af3155',
  noble = '0x57d4eaf1091577a6b7d121202afbd2808134f117',
  base = '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962',
  avalanche = '0x6b25532e1060ce10cc3b0a99e5683b91bfde6982',
  optimism = '0x2B4069517957735bE00ceE0fadAE88a26365528f',
  polygon = '0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE',
  // testnets
  grand = '0x57d4eaf1091577a6b7d121202afbd2808134f117',
  sepolia = '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
  fuji = '0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0'
}

export enum MESSAGE_TRANSMITTERS {
  arbitrum = '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca',
  ethereum = '0x0a992d191deec32afe36203ad87d7d289a738f81',
  base = '0xAD09780d193884d503182aD4588450C416D6F9D4',
  noble = '0x',
  optimism = '0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8',
  polygon = '0xF3be9355363857F3e001be68856A2f96b4C39Ba9',
  avalanche = '0x8186359af5f57fbb40c6b14a588d2a59c0c29880',
  // testnets
  grand = '0x',
  sepolia = '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
  fuji = '0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79'
}

export const DESTINATION_CALLERS: Record<Chains, CrossChainAddress> = {
  [Chains.noble]: 'noble1nejktfwd47h9hsku6fxtgaxe5hf4pjzz3rq6ek',
  [Chains.ethereum]: '0xeB4EaE8072bF3e2608f05B6812CD95133BF71504',
  [Chains.arbitrum]: '0xeB4EaE8072bF3e2608f05B6812CD95133BF71504',
  [Chains.base]: '0xeb4eae8072bf3e2608f05b6812cd95133bf71504',
  [Chains.polygon]: '0xeB4EaE8072bF3e2608f05B6812CD95133BF71504',
  [Chains.optimism]: '0xeB4EaE8072bF3e2608f05B6812CD95133BF71504',
  [Chains.avalanche]: '0xD54c1628F113dA05bE5048dF948bc8dade604911',
  // testnets
  [Chains.grand]: 'noble1nejktfwd47h9hsku6fxtgaxe5hf4pjzz3rq6ek',
  [Chains.sepolia]: '0xeB4EaE8072bF3e2608f05B6812CD95133BF71504',
  [Chains.fuji]: '0xD54c1628F113dA05bE5048dF948bc8dade604911'
}

export const NATIVE_USD_PRICE_FEEDS: Record<Chains, Address> = {
  ethereum: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
  arbitrum: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612',
  base: '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70',
  polygon: '0x82BA56a2fADF9C14f17D08bc51bDA0bDB83A8934', // pol feed on arbitrum
  avalanche: '0x0A77230d17318075983913bC2145DB16C7366156', // avax/usd
  optimism: '0x13e3Ee699D1909E989722E753853AE30b17e08c5',
  noble: '0x',
  // testnets
  grand: '0x',
  sepolia: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
  fuji: '0x5498BB86BC934c8D34FDA08E81D444153d0D06aD'
}

export const LA_FACTORIES = Object.values(Chains).reduce((acc, key) => {
  if (key === Chains.avalanche || key === Chains.fuji) {
    acc[key] = '0x37e25c06bf19e2d1cd0499c9eb4f941475b78271'
  } else {
    acc[key] = '0x0000000000400CdFef5E2714E63d8040b700BC24'
  }
  return acc
}, {} as Record<Chains, Address>)

export const RPC_TRANSPORTS: Record<Chains, string> = {
  [Chains.ethereum]: 'https://rpc.ankr.com/eth',
  [Chains.arbitrum]: 'https://rpc.ankr.com/arbitrum',
  [Chains.base]: 'https://rpc.ankr.com/base',
  [Chains.noble]: 'https://noble-rpc.polkachu.com:443',
  [Chains.optimism]: 'https://rpc.ankr.com/optimism',
  [Chains.polygon]: 'https://rpc.ankr.com/polygon',
  [Chains.avalanche]: 'https://rpc.ankr.com/avalanche',
  // testnets
  [Chains.grand]: 'https://noble-testnet-rpc.polkachu.com:443',
  [Chains.sepolia]: 'https://rpc.ankr.com/eth_sepolia',
  [Chains.fuji]: 'https://rpc.ankr.com/avalanche_fuji'
}

export const AA_TRANSPORT = (chainId?: number) => `https://${chainId}.bundler.thirdweb.com/v2`
export const AA_TRANSPORT_HEADERS = () => {
  const secret = process.env.THIRDWEB_SECRET as string | undefined
  const headers = {
    'x-client-id': process.env.THIRDWEB_CLIENT_ID,
    'Content-Type': 'application/json'
  } as Record<string, string>

  if (secret) headers['x-secret-key'] = secret

  return { headers }
}

export const MULLTICALLER_WITH_PERMIT: Record<Chains, Address | undefined> = {
  [Chains.ethereum]: '0x',
  [Chains.arbitrum]: '0x',
  [Chains.base]: '0x',
  [Chains.polygon]: '0x',
  [Chains.avalanche]: '0x',
  [Chains.optimism]: '0x',
  [Chains.noble]: undefined,
  // testnets
  [Chains.grand]: undefined,
  [Chains.sepolia]: '0x',
  [Chains.fuji]: '0x'
}

export enum DOMAINS {
  ethereum = 0,
  avalanche = 1,
  optimism = 2,
  arbitrum = 3,
  noble = 4,
  base = 6,
  polygon = 7,
  // testnets
  grand = 4,
  sepolia = 0,
  fuji = 1
}

export const REVERSE_DOMAINS: Record<number, Chains> = {
  0: Chains.ethereum,
  1: Chains.avalanche,
  2: Chains.optimism,
  3: Chains.arbitrum,
  4: Chains.noble,
  6: Chains.base,
  7: Chains.polygon
}

export const REVERSE_DOMAINS_TESTNETS: Record<number, Chains> = {
  4: Chains.grand,
  0: Chains.sepolia,
  1: Chains.fuji
}

export const AssetsList: { [key: string]: AssetInfo } = {
  '1': {
    chain: 'ethereum',
    address: USDC_CONTRACTS.ethereum,
    url: 'https://etherscan.io/token/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  },
  '42161': {
    chain: 'arbitrum',
    address: USDC_CONTRACTS.arbitrum,
    url: 'https://arbiscan.io/token/0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
  },
  '8453': {
    chain: 'base',
    address: USDC_CONTRACTS.base,
    url: 'https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  },
  'noble-1': {
    chain: 'noble',
    address: USDC_CONTRACTS.noble,
    url: 'https://www.mintscan.io/noble/assets/native/dXVzZGM='
  },
  '10': {
    chain: 'optimism',
    address: USDC_CONTRACTS.optimism,
    url: 'https://optimistic.etherscan.io/token/0x0b2c639c533813f4aa9d7837caf62653d097ff85'
  },
  '43114': {
    chain: 'avalanche',
    address: USDC_CONTRACTS.avalanche,
    url: 'https://snowtrace.io/token/0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
  },
  '137': {
    chain: 'polygon',
    address: USDC_CONTRACTS.polygon,
    url: 'https://polygonscan.com/token/0x3c499c542cef5e3811e1192ce70d8cc03d5c3359'
  },
  // testnets
  'grand-1': {
    chain: 'grand',
    address: USDC_CONTRACTS.grand,
    url: 'https://www.mintscan.io/noble-testnet/assets/native/dXVzZGM='
  },
  '11155111': {
    chain: 'sepolia',
    address: USDC_CONTRACTS.sepolia,
    url: 'https://sepolia.etherscan.io/token/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  },
  '43113': {
    chain: 'fuji',
    address: USDC_CONTRACTS.fuji,
    url: 'https://testnet.snowtrace.io/token/0x5425890298aed601595a70ab815c96711a31bc65'
  }
}

export const VIEM_NETWORKS: Record<Mode, Chain | undefined> = {
  ethereum: mainnet,
  arbitrum: arbitrum,
  base: base,
  noble: undefined,
  avalanche: avalanche,
  polygon: polygon,
  optimism: optimism,
  // testnets
  grand: undefined,
  sepolia: sepolia,
  fuji: avalancheFuji
}

const minute = 60 * 1000

export const SOURCE_CHAIN_CONFIRMATIONS: Record<Mode, number> = {
  ethereum: 13 * minute,
  noble: 0.1 * minute,
  arbitrum: 13 * minute,
  base: 13 * minute,
  avalanche: 0.1 * minute,
  polygon: 8 * minute,
  optimism: 13 * minute,
  // testnets
  grand: 0.1 * minute,
  sepolia: 1 * minute,
  fuji: 0.1 * minute
}
