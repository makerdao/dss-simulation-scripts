const fs = require('fs');
const hre = require("hardhat");
const ethers = hre.ethers;

const ETH_FROM    = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const SECONDS     = (2 * 3600) + 600;

// test voidOSM
async function warp(seconds) {
  let signer = await ethers.getSigner(ETH_FROM);
  let signerAddress = await signer.getAddress();

  //
  // check balances for pause proxy and give it some ETH to run transactions
  //

  await hre.network.provider.request({
    method: "evm_increaseTime",
    params: [seconds]
  });
}

warp(SECONDS)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
