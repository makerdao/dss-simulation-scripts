#!/usr/bin/env node

const assert = require("assert");
const hre = require("hardhat");
const ethers = hre.ethers;
const cast = require("./cast.js");
const chainlog = require("./chainlog.js");


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

  if ((await end.live()).toString() === "1") {
    await cast("cage(address)", [endAddr]);
  }

  const ilks = await ilkReg.list();
  for (const ilk of ilks) {
    if (ilk === ethers.utils.formatBytes32String("RWA006-A")) continue;
    if ((await end.tag(ilk)).toString() !== "0") continue;
    console.log("caging " + ethers.utils.parseBytes32String(ilk));
    await end.cage(ilk);
  }
}

ES();
