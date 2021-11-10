# dss-simulation-scripts

## Start the server

```
./start
```

## Running Scripts

### Void the OSM for ETH
```
npx hardhat run scripts/voidOSM.js --network localhost
```

## debug notes

- Set the RPC host to be an archive node in `hardhat.config.js`.

- Set the `ETH_RPC_URL` to be the same archive node.

- Set the block where the error happened in the `hardhat.config.js` file.

- make point client at http://127.0.0.1:8545/

- reproduce error if you can.  You can see the error message in the hardhat
output.  If you get the bytes for the transaction, save it to a file called
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
