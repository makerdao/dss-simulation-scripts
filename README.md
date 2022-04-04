# dss-simulation-scripts

## Installation

```
yarn
```

## Inital steps

### Set environment variables

```
export ETH_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/...
export HARDHAT_NETWORK=localhost
```

### Start the forked mainnet server

```
./bin/start.sh
```

## Running Scripts

### set the OSM price for an asset

```
export PIP_ETH=0x81fe72b5a8d1a857d176c3e7d5bd2679a9b85763
./scripts/setOSMPrice.js "ETH-A" ${PIP_ETH} 4000
```

### Void the OSM for ETH
```
./scripts/voidOSM.js
```

### warp ahead by seconds
```
./scripts/warp.js 7200
```

### Trigger ES
```
./scripts/cageMCD.js
```

## debug notes

- Set the block where the error happened in the `hardhat.config.js` file.

- make client point at http://127.0.0.1:8545/

- reproduce error if you can. You can see the error message in the hardhat
output. If you get the bytes for the transaction, save it to a file called
`calldata` and then you can send it with `seth`:
```
seth send <TO> $(cat ./calldata)
```

- Once you have the failed transaction, you can either step through the debug
console with:
```
seth debug <tx hash>
```

or look at the trace output with:
```
seth run-tx 0x6ecf099be8178c9a2e7d67f57f3a141e13f2393f15fff35e577fd1b3f3fc697d --trace
```
