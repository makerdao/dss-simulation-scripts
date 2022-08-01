#!/usr/bin/env node

const assert = require("assert");
const hre = require("hardhat");
const ethers = hre.ethers;
const cast = require("./cast");
const chainlog = require("./chainlog");


// test voidOSM
async function main() {
  const [signer] = await ethers.getSigners();
  const osmAbi = [
    "function src() external view returns (address)",
    "function poke() external"
  ];
  const pipEthAddr = await chainlog("PIP_ETH");
  const osm = await ethers.getContractAt(osmAbi, pipEthAddr, signer);

  // change the PIP_ETH src to the USDC DSValue which is hardcoded to 1
  // causing the next poke() to pull in a > 50% price drop.
  const pipUsdcAddr = await chainlog("PIP_USDC");
  await cast("change(address,address)", [pipEthAddr, pipUsdcAddr]);
  assert.equal(await osm.src(), pipUsdcAddr);

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
