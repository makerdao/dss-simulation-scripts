#!/usr/bin/env node

const assert = require("assert");
const hre = require("hardhat");
const ethers = hre.ethers;
const cast = require("./cast.js");
const chainlog = require("./chainlog.js");


const ES = async () => {
  const vatAbi = ["function live() external view returns (uint256)"];
  const vatAddr = await chainlog("MCD_VAT");
  const vat = await ethers.getContractAt(vatAbi, vatAddr);
  const endAddr = await chainlog("MCD_END");

  assert.equal(await vat.live(), 1, "MCD is already caged");
  await cast("cage(address)", [endAddr]);
  assert.equal(await vat.live(), 0, "MCD cage failed");

  // for each ilk in MCD:
  //  await end.cage(ilk);
}

ES();
