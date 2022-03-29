require("hardhat-change-network");
require("@nomiclabs/hardhat-waffle");

const { ETH_RPC_URL } = process.env;

if (!ETH_RPC_URL) {
  console.log("Missing ETH_RPC_URL env var.");
  process.exit();
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: false
          }
        },
      }
    ],
    overrides: {
      "contracts/SendEthDamnit.sol": {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      mining: {
        auto: true,
        interval: [3000, 6000]
      },
      forking: {
        url: ETH_RPC_URL,
        // blockNumber: 12684860 // 1624376308
        // blockNumber: 12684984 // 1624377849
        // blockNumber: 12708938 // ETH-A
        // blockNumber: 12709199 // 1624704103
        // blockNumber: 12683581 // LRC-A
        // blockNumber: 12969928 // WBTC-A
        // blockNumber: 13078678 // testing original tests from univ3-lp-oracle
        // blockNumber: 13323323 // pre-COMP sploit
        // blockNumber: 13656594 // debug wstETH Vault 26279
        // blockNumber: 13779176 // testing last spell with forge
        // blockNumber: 14051900 // simulate Flappy Friday
      }
    },
    fork: {
      url: "http://127.0.0.1:8545/",
    }
  }
};

