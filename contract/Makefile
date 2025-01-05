-include .env

deploy-$(chain) :; @forge script script/MutlicallWithPermit.s.sol:MutlicallWithPermitScript --private-key ${PRIVATE_KEY} --chain ${chain} --broadcast --verify -vvv

verify-$(chain) :; forge verify-contract ${address} src/MutlicallWithPermit.sol:MutlicallWithPermit --chain ${chain} --verifier-url=${$(chain)VERIFIER_URL} --etherscan-api-key=${$(chain)SCAN_API_KEY}