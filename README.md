# Welcome to pathway

## Development

Run the dev server:

```sh
bun run dev
```

## Deployment

### Using worker sites

First, build your app for production:

```sh
bun run build
```

Then run the app in production mode:

```sh
bun run preview
```

deploy to cf workers

```sh
bun run release
```

### Using CF pages

First, build your app for production:

```sh
bun run pages:build
```

Then run the app in production mode:

```sh
bun run pages:preview
```

deploy to cf pages

```sh
bun run pages:release
```

### contracts

you'd need to have [foundry](https://foundry.sh) installed first

to build contracts

```sh
bun run forge:build
```

to build deployer script

```sh
bun run build:contract
```

to deploy contracts

```sh
# add PRIVATE_KEY="0x..." to .env
# then run

bun run deploy:contract [mode]
```

there are three modes:

- ethereum
- arbitrum
- base

to deploy to multiple modes

```sh
bun run deploy:contract <mode1> <mode2> <mode3>
```

### installing packages

```sh
bun install <package>
# or
bun add <package>
```

<!-- <https://dribbble.com/shots/24571357-Create-account>
<https://dribbble.com/shots/22633345-BPO-Website-Business-Optimization>
<https://dribbble.com/shots/21269243-Landing-Page-for-Web3-Project>
<https://dribbble.com/shots/17267041-Blockchain-Landing-Page>

<https://dribbble.com/shots/20204752-Dex-Network-Crypto-Marketplace> nav
<https://dribbble.com/shots/23643891-Crypto-Landing-Page> -->
