#!/usr/bin/env node

const assert = require("assert");
const hre = require("hardhat");
const ethers = hre.ethers;
const cast = require("./cast.js");
const chainlog = require("./chainlog.js");
const priceFeed = require("./priceFeed");
const vaults = require("./vaults.js");
const auctions = require("./auctions");


const ES = async () => {
  const endAbi = [
    "function live() external view returns (uint256)",
    "function tag(bytes32) external view returns (uint256)",
    "function cage(bytes32) external",
    "function skim(bytes32 ilk, address urn) external",
    "function snip(bytes32 ilk, uint256 id) external",
  ];
  const endAddr = await chainlog("MCD_END");
  const end = await ethers.getContractAt(endAbi, endAddr);

  const spotterAbi = [
    "function ilks(bytes32) external view returns (address,uint256)"
  ];
  const spotterAddr = await chainlog("MCD_SPOT");
  const spotter = await ethers.getContractAt(spotterAbi, spotterAddr);

  const DSValueAbi = ["function read() external view returns (bytes32)"];
  const ilk = ethers.utils.formatBytes32String("ETH-C");

  await priceFeed("ETH-C", 0.5);
  let underVaults = await vaults("ETH-C");
  await auctions.bark("ETH-C", underVaults[0]);
  await auctions.bark("ETH-C", underVaults[1]);
  await auctions.bark("ETH-C", underVaults[2]);

  if ((await end.live()).toString() === "0") {
    console.log("already caged");
    process.exit();
  }

  await cast("cage(address)", [endAddr]);

  console.log("tagging…");
  await end.cage(ilk);
  const tag = await end.tag(ilk);
  const prettyTag = ethers.utils.formatUnits(tag, unit=27);
  console.log(`tag set at ${prettyTag} ETH per DAI`);

  underVaults = await vaults("ETH-C");
  console.log("skimming undercollateralized vaults…");
  for (underVault of underVaults) {
    end.skim(ilk, underVault);
  }
  console.log("done.");

  console.log("snipping current auctions…");
  const list = await auctions.list("ETH-C");
  console.log(list);
  for (const id of list) {
    await end.snip(ilk, id);
  }
  console.log(await auctions.list("ETH-C"));
}

ES();
