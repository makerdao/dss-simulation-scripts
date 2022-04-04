#!/usr/bin/env node

const fs = require('fs');
const hre = require("hardhat");
const ethers = hre.ethers;

const args = process.argv.slice(2);

const ETH_FROM    = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const PAUSE_PROXY = "0xBE8E3e3618f7474F8cB1d074A26afFef007E98FB";
const PIP_ETH     = "0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763";
const PIP_USDC    = "0x77b68899b99b686F415d074278a9a16b336085A0";

const sendEth = async (address, amount) => {
  await hre.network.provider.send("hardhat_setCoinbase", [address]);
  for (let i = 0; i < Math.floor(Math.ceil(amount + 1) / 2); i ++) {
    await hre.network.provider.send("evm_mine");
  }
  await hre.network.provider.send(
    "hardhat_setCoinbase",
    [ethers.constants.AddressZero]
  );
}

const impersonate = async (address, callback) => {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address]
  });
  const signer = await ethers.getSigner(PAUSE_PROXY);
  await sendEth(address, 1);
  await callback(signer);
  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [address]
  });
}

// test voidOSM
async function main() {
  const signer = await ethers.getSigner(ETH_FROM);

  // balance PAUSE_PROXY
  balance = await ethers.provider.getBalance(PAUSE_PROXY);
  console.log(PAUSE_PROXY + ': ' + ethers.utils.formatEther(balance));

  await impersonate(PAUSE_PROXY, async signer => {
    // balance PAUSE_PROXY
    balance = await ethers.provider.getBalance(PAUSE_PROXY);
    console.log(PAUSE_PROXY + ': ' + ethers.utils.formatEther(balance));

    const OSMABI = JSON.parse(fs.readFileSync('./abi/OSM.json').toString());
    const osm = await ethers.getContractAt(OSMABI, PIP_ETH, signer);

    // change the PIP_ETH src to the USDC DSValue which is hardcoded to 1
    // causing the next poke() to pull in a > 50% price drop.
    await osm.change(PIP_USDC);

    // time warp
    await hre.network.provider.request({
      method: "evm_increaseTime",
      params: [3600]
    });

    // now we poke() to pull in the new price
    await osm.poke();
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
