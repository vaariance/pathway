## MultiCallerWithPermit

**MultcallerWithPermit is an meta-tx forwarder for cross-chain transactions using CCTP**

MultcallerWithPermit:

- **one-click**: Users can easily send cross-chain transactions with a single permit.
- **forawarding**: User specified forwarder can execute on behalf of the user, and automactically receive the transaction fee.
- **multicall**: Allows a forwarder to bundle multiple cross-chain transactions in a single call.
- **92% test coverage**: Rigorously Tested
- **Audited**: Audited by the security team at [guild audits](https://guildaudits.com/)

## Usage

### Build

```shell
forge build
```

### Test

```shell
forge test
```

### Format

```shell
forge fmt
```

### Simulate

```shell
$ make dry-run chain=<cahin> # e.g chain=fuji
## chains include mainnet, fuji, sepolia, avalanche, optimism, base, arbitrum, polygon
```

### Deploy

```shell
$ make deploy chain=<cahin> # e.g chain=fuji
## chains include mainnet, fuji, sepolia, avalanche, optimism, base, arbitrum, polygon
```

### Verify

```shell
$ make verify address=<deployed-contract-address> chain=<cahin> # e.g chain=fuji
## chains include mainnet, fuji, sepolia, avalanche, optimism, base, arbitrum, polygon
```
