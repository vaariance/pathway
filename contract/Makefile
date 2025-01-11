-include .env

deploy :; @forge script script/MulticallWithPermit.s.sol:MulticallWithPermitScript --private-key ${PRIVATE_KEY} --chain ${chain} --rpc-url ${RPC_URL_$(chain)} --broadcast --verify -vvv

verify :; forge verify-contract ${address} src/MulticallWithPermit.sol:MulticallWithPermit --chain ${chain}

dry-run :; forge script script/MulticallWithPermit.s.sol:MulticallWithPermitScript --rpc-url ${RPC_URL_$(chain)} --chain ${chain} -vvv