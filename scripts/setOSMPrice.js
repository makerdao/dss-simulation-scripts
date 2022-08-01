#!/usr/bin/env node

const assert = require("assert");
const fs = require("fs");
const hre = require("hardhat");
const ethers = hre.ethers;
const chainlog = require("./chainlog");

const args = process.argv.slice(2);

const RAY = ethers.BigNumber.from(10).pow(27);

const ILK = args[0] || "ETH-A";
const ILK32 = ethers.utils.formatBytes32String(ILK);
const OSM = args[1] || "0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763";
const PRICE = parseInt(args[2]) || 1;

console.log(ILK, OSM, PRICE);

async function setOSMPrice(ilk, osm, price) {
  const [signer] = await ethers.getSigners();

  // Hacking cur price
  const slot = "0x3"; // cur
  const price18 = ethers.FixedNumber.from(price);
  const types = ["uint128", "uint128"]; // has, val
  const data = ethers.utils.solidityPack(types, [1, price18]);

  await hre.network.provider.request({
    method: "hardhat_setStorageAt",
    params: [osm, slot, data]
  });

  const spotterAbi = [
    "function poke(bytes32) external",
    "function ilks(bytes32) external view returns (address pip, uint256 mat)"
  ];
  const spotterAddr = chainlog("MCD_SPOT");
  const spotter = await ethers.getContractAt(spotterAbi, spotterAddr, signer);

  // now we poke() to pull in the new price
  await spotter.poke(ilk);

  const vatAbi = ["function ilks(bytes32) external view returns (uint256 art, uint256 rate, uint256 spot, uint256 line, uint256 dust)"];
  const vatAddr = await chainlog("MCD_VAT");
  const vat = await ethers.getContractAt(vatAbi, vatAddr);
  const spot = (await vat.ilks(ilk)).spot;
  const mat = (await spotter.ilks(ilk)).mat;

  const expected = ethers.BigNumber.from(price).mul(RAY);
  const actual = spot.mul(mat).div(RAY);
  const expectedPlus = expected.mul(101).div(100);
  const expectedMinus = expected.mul(99).div(100);

  assert(expectedPlus.gte(actual));
  assert(expectedMinus.lte(actual));

  await hre.network.provider.send("evm_mine");
}

setOSMPrice(ILK32, OSM, PRICE)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
