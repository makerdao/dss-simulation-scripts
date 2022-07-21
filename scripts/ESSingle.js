#!/usr/bin/env node

const assert = require("assert");
const hre = require("hardhat");
const ethers = hre.ethers;
const cast = require("./cast.js");
const chainlog = require("./chainlog.js");
const priceFeed = require("./priceFeed");
const {vaults, getUnder} = require("./vaults.js");
const auctions = require("./auctions");


const ES = async () => {
  const endAbi = [
    "function live() external view returns (uint256)",
    "function tag(bytes32) external view returns (uint256)",
    "function cage(bytes32) external",
    "function skim(bytes32 ilk, address urn) external",
    "function snip(bytes32 ilk, uint256 id) external",
    "function free(bytes32) external",
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
  const urns = await vaults("ETH-C");
  const underVaults = await getUnder("ETH-C", urns, 3);
  await auctions.bark("ETH-C", underVaults[0]);
  await auctions.bark("ETH-C", underVaults[1]);
  await auctions.bark("ETH-C", underVaults[2]);

  // 1. `cage()`: freeze system
  await cast("cage(address)", [endAddr]);

  // 2. `cage(ilk)`: set ilk prices
  console.log("tagging…");
  await end.cage(ilk);
  const tag = await end.tag(ilk);
  const prettyTag = ethers.utils.formatUnits(tag, unit=27);
  console.log(`tag set at ${prettyTag} ETH per DAI`);

  // 4b. `snip(ilk, id)`: close ongoing auctions
  console.log("snipping current auctions…");
  const list = await auctions.list("ETH-C");
  console.log(list);
  for (const id of list) {
    await end.snip(ilk, id);
  }
  console.log("done.");

  // 3. `skim(ilk, urn)`: close vaults
  console.log("skimming vaults…");
  let counter = 0;
  for (urn of urns) {
    const percentage = Math.round(100 * counter++ / urns.length);
    process.stdout.write(`${percentage}%\r`);
    await end.skim(ilk, urn);
  }
  console.log("done.");

  // 5. `free(ilk)`: remove remaining collateral from vaults
  console.log("freeing vaults…");
  counter = 0;
  for (const urn of urns) {
    const percentage = Math.round(100 * counter++ / urns.length);
    process.stdout.write(`${percentage}%\r`);
    await hre.network.provider.send("hardhat_setCoinbase", [urn]);
    await hre.network.provider.send("evm_mine");
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [urn],
    });
    const owner = await ethers.getSigner(urn);
    await end.connect(owner).free(ilk);
  }
  console.log("done.");
}

ES();
