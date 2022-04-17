#!/usr/bin/env node

const assert = require("assert");
const hre = require("hardhat");
const ethers = hre.ethers;
const cast = require("./cast.js");
const chainlog = require("./chainlog.js");

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));


const ES = async () => {
  const endAbi = [
    "function live() external view returns (uint256)",
    "function tag(bytes32) external view returns (uint256)",
    "function cage(bytes32) external"
  ];
  const endAddr = await chainlog("MCD_END");
  const end = await ethers.getContractAt(endAbi, endAddr);

  const ilkRegAbi = ["function list() external view returns (bytes32[])"];
  const ilkRegAddr = await chainlog("ILK_REGISTRY");
  const ilkReg = await ethers.getContractAt(ilkRegAbi, ilkRegAddr);

  const spotterAbi = [
    "function ilks(bytes32) external view returns (address,uint256)"
  ];
  const spotterAddr = await chainlog("MCD_SPOT");
  const spotter = await ethers.getContractAt(spotterAbi, spotterAddr);

  const DSValueAbi = ["function read() external view returns (bytes32)"];

  if ((await end.live()).toString() === "1") {
    await cast("cage(address)", [endAddr]);
  }

  const ilks = await ilkReg.list();
  for (const ilk of ilks) {
    console.log("tagging " + ethers.utils.parseBytes32String(ilk));
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
      console.log("tag already set to " + tag);
      continue;
    }
    await end.cage(ilk);
    console.log("tag set to " + (await end.tag(ilk)));
  }
}

ES();
