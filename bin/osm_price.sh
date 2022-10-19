#!/bin/sh

export ETH_RPC_URL="http://127.0.0.1:8545/"
export OSM=${1}

rawStorage=$(seth storage "${OSM}" $(seth --to-uint256 3))
currentPrice=$(seth --from-wei "$(seth --to-dec "${rawStorage:34:32}")")

echo "${currentPrice}"
