#!/usr/bin/env node

const assert = require("assert");
const hre = require("hardhat");
const ethers = hre.ethers;
const cast = require("./cast.js");
const chainlog = require("./chainlog.js");


// test cageMCD
async function main() {
  const endAbi = [
    "function live() external view returns (uint256)"
  ];
  const endAddr = await chainlog("MCD_END");
  const end = await ethers.getContractAt(endAbi, endAddr);

  // This will cage MCD
  await cast("cage(address)", [endAddr]);
  assert.equal(await end.live(), 0);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
