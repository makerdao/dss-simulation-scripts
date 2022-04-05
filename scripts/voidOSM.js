#!/usr/bin/env node

const assert = require("assert");
const fs = require('fs');
const hre = require("hardhat");
const ethers = hre.ethers;
const cast = require("./cast.js");

const ETH_FROM    = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const PAUSE_PROXY = "0xBE8E3e3618f7474F8cB1d074A26afFef007E98FB";
const PIP_ETH     = "0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763";
const PIP_USDC    = "0x77b68899b99b686F415d074278a9a16b336085A0";

// test voidOSM
async function main() {
  const signer = await ethers.getSigner(ETH_FROM);
  const OSMABI = JSON.parse(fs.readFileSync('./abi/OSM.json').toString());
  const osm = await ethers.getContractAt(OSMABI, PIP_ETH, signer);

  // change the PIP_ETH src to the USDC DSValue which is hardcoded to 1
  // causing the next poke() to pull in a > 50% price drop.
  await cast("change(address,address)", [PIP_ETH, PIP_USDC]);
  assert.equal(await osm.src(), PIP_USDC);

  // time warp
  await hre.network.provider.request({
    method: "evm_increaseTime",
    params: [3600]
  });

  // now we poke() to pull in the new price
  await osm.poke();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
