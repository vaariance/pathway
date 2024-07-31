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
