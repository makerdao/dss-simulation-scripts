#!/usr/bin/env node

const assert = require("assert");
const hre = require("hardhat");
const ethers = hre.ethers;
const governance = require("../utils/governance");
const chainlog = require("../utils/chainlog");
const oracles = require("../utils/oracles");
const vaults = require("../utils/vaults");


const ES = async () => {
  await oracles.setPrice("ETH-C", 0.5);
  const endAbi = [
    "function live() external view returns (uint256)",
    "function tag(bytes32) external view returns (uint256)",
    "function cage(bytes32) external"
  ];
  const endAddr = await chainlog.get("MCD_END");
  const end = await ethers.getContractAt(endAbi, endAddr);

  const ilkRegAbi = ["function list() external view returns (bytes32[])"];
  const ilkRegAddr = await chainlog.get("ILK_REGISTRY");
  const ilkReg = await ethers.getContractAt(ilkRegAbi, ilkRegAddr);

  const spotterAbi = [
    "function ilks(bytes32) external view returns (address,uint256)"
  ];
  const spotterAddr = await chainlog.get("MCD_SPOT");
  const spotter = await ethers.getContractAt(spotterAbi, spotterAddr);

  const DSValueAbi = ["function read() external view returns (bytes32)"];

  const ilks = await ilkReg.list();
  for (const ilk of ilks) {

  }

  if ((await end.live()).toString() === "1") {
    await governance.spell("cage(address)", [endAddr]);
  }

  for (const ilk of ilks) {
    const prettyIlk = ethers.utils.parseBytes32String(ilk);
    console.log("tagging " + prettyIlk);
    [pipAddr] = await spotter.ilks(ilk);
    const pip = await ethers.getContractAt(DSValueAbi, pipAddr);
    let value;
    try {
      value = await pip.read();
    } catch (e) {
      value = await hre.network.provider.send("eth_getStorageAt", [pipAddr, "0x3"]);
    }
    if (BigInt(value).toString() === "0") {
      console.log("value is zero");
      continue;
    }
    const tag = await end.tag(ilk);
    if (tag.toString() !== "0") {
      const prettyTag = ethers.utils.formatUnits(tag, unit=27);
      console.log(`tag already set at ${prettyTag} ${prettyIlk} per DAI`);
      continue;
    }
    await end.cage(ilk);
    const prettyTag = ethers.utils.formatUnits(await end.tag(ilk), unit=27);
    console.log(`tag set at ${prettyTag} ${prettyIlk} per DAI`);
  }
  const underVaults = await vaults("ETH-C");
  console.log(underVaults);
}

ES();
