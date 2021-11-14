#!/usr/bin/env node

const hre = require("hardhat");

const args = process.argv.slice(2);

const SECONDS = parseInt(args[0]) || 3600;

async function warp(seconds) {
  await hre.network.provider.request({
    method: "evm_increaseTime",
    params: [seconds]
  });

  await hre.network.provider.send("evm_mine");
}

warp(SECONDS)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
