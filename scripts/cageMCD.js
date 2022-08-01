#!/usr/bin/env node

const assert = require("assert");
const hre = require("hardhat");
const ethers = hre.ethers;
const cast = require("./cast");
const chainlog = require("./chainlog");


// test cageMCD
async function main() {
  const vatAbi = ["function live() external view returns (uint256)"];
  const vatAddr = await chainlog("MCD_VAT");
  const vat = await ethers.getContractAt(vatAbi, vatAddr);
  const endAddr = await chainlog("MCD_END");

  // This will cage MCD
  assert.equal(await vat.live(), 1);
  await cast("cage(address)", [endAddr]);
  assert.equal(await vat.live(), 0);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
