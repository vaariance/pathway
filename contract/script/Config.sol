// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.23;

library Config {
    struct NetworkConfig {
        address usdc;
        address relayer;
        address messenger;
    }

    function getActiveNetworkConfig() public view returns (NetworkConfig memory conf) {
        uint256 id = block.chainid;
        NetworkConfig memory mainnet = getMainnetConfig();
        NetworkConfig memory arbitrum = getArbitrumConfig();
        NetworkConfig memory base = getBaseConfig();
        NetworkConfig memory polygon = getPolygonConfig();
        NetworkConfig memory avalanche = getAvalancheConfig();
        NetworkConfig memory optimism = getOptimismConfig();
        NetworkConfig memory sepolia = getSepoliaConfig();
        NetworkConfig memory fuji = getFujiConfig();

        assembly {
            switch id
            case 1 { conf := mainnet }
            case 10 { conf := optimism }
            case 137 { conf := polygon }
            case 43114 { conf := avalanche }
            case 42161 { conf := arbitrum }
            case 8453 { conf := base }
            case 11155111 { conf := sepolia }
            case 43113 { conf := fuji }
            default { conf := base }
        }
    }

    function getArbitrumConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            usdc: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831,
            relayer: 0xeB4EaE8072bF3e2608f05B6812CD95133BF71504,
            messenger: 0x19330d10D9Cc8751218eaf51E8885D058642E08A
        });
    }

    function getBaseConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            usdc: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913,
            relayer: 0xeB4EaE8072bF3e2608f05B6812CD95133BF71504,
            messenger: 0x1682Ae6375C4E4A97e4B583BC394c861A46D8962
        });
    }

    function getMainnetConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            usdc: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48,
            relayer: 0xeB4EaE8072bF3e2608f05B6812CD95133BF71504,
            messenger: 0xBd3fa81B58Ba92a82136038B25aDec7066af3155
        });
    }

    function getPolygonConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            usdc: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359,
            relayer: 0xeB4EaE8072bF3e2608f05B6812CD95133BF71504,
            messenger: 0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE
        });
    }

    function getAvalancheConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            usdc: 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E,
            relayer: 0xD54c1628F113dA05bE5048dF948bc8dade604911,
            messenger: 0x6B25532e1060CE10cc3B0A99e5683b91BFDe6982
        });
    }

    function getOptimismConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            usdc: 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85,
            relayer: 0xeB4EaE8072bF3e2608f05B6812CD95133BF71504,
            messenger: 0x2B4069517957735bE00ceE0fadAE88a26365528f
        });
    }

    function getSepoliaConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            usdc: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238,
            relayer: 0xeB4EaE8072bF3e2608f05B6812CD95133BF71504,
            messenger: 0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5
        });
    }

    function getFujiConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({
            usdc: 0x5425890298aed601595a70AB815c96711a31Bc65,
            relayer: 0xD54c1628F113dA05bE5048dF948bc8dade604911,
            messenger: 0xeb08f243E5d3FCFF26A9E38Ae5520A669f4019d0
        });
    }
}
