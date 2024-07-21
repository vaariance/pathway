# Welcome to pathway

## Development

Run the dev server:

```sh
bun run dev
```

## Deployment

First, build your app for production:

```sh
bun run build
```

Then run the app in production mode:

```sh
bun run start
```

### contracts

you'd need to have [foundry](https://foundry.sh) installed first

to build contracts

```sh
bun run forge:build
```

to deploy contracts

```sh
# add PRIVATE_KEY="0x..." to .env
# then run

bun run deploy [mode]
```

there are three modes:

- ethereum
- arbitrum
- base

to deploy to multiple modes

```sh
bun run deploy <mode1> <mode2> <mode3>
```

### installing packages

```sh
bun install <package>
# or
bun add <package>
```
