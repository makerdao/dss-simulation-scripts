#!/usr/bin/env node

const assert = require("assert");
const fs = require('fs');
const hre = require("hardhat");
const ethers = hre.ethers;
const cast = require("./cast.js");

const MCD_END     = "0xBB856d1742fD182a90239D7AE85706C2FE4e5922";

// test cageMCD
async function main() {
  const ENDABI = JSON.parse(fs.readFileSync('./abi/end.json').toString());
  const end = await ethers.getContractAt(ENDABI, MCD_END);

  // This will cage MCD
  await cast("cage(address)", [MCD_END]);
  assert.equal(await end.live(), 0);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
