#!/usr/bin/env node

const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec)
const hre = require("hardhat");
const ethers = hre.ethers;

const ETH_FROM    = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const MCD_VAT     = "0x35d1b3f3d7966a1dfe207aa4514c12a259a0492b";
const MCD_SPOT    = "0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3";
const RAY_DIGITS  = 27;

const SPOTABI = JSON.parse(fs.readFileSync('./abi/spot.json', 'UTF-8'));
const VATABI = JSON.parse(fs.readFileSync('./abi/vat.json', 'UTF-8'));

const args = process.argv.slice(2);

const ILK = ethers.utils.formatBytes32String(args[0]) ||
  ethers.utils.formatBytes32String("ETH-A");
const OSM = args[1] || "0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763";
const PRICE = parseInt(args[2]) || 1;

async function setOSMPrice(ilk, osm, price) {

  process.stdout.write("price before: ")
  process.stdout.write(await getOSMPrice(ilk));
  process.stdout.write("\n");

  const signer = await ethers.getSigner(ETH_FROM);

  // Hacking cur price
  const slot = "0x3";
  const cmd = "seth --to-bytes32 $(seth --to-uint256 $(echo '" + price +
    " * 10^18' | bc))|" +
    "sed 's/0x00000000000000000000000000000000/0x00000000000000000000000000000001/'";
  const ret = await exec(cmd);

  await hre.network.provider.request({
    method: "hardhat_setStorageAt",
    params: [osm, slot, ret.stdout.trim()]
  });

  const spot = await ethers.getContractAt(SPOTABI, MCD_SPOT, signer);

  // now we poke() to pull in the new price
  await spot.poke(ilk);

  await hre.network.provider.send("evm_mine");

  process.stdout.write("price after:  ");
  process.stdout.write(await getOSMPrice(ilk));
  process.stdout.write("\n");
}

const getOSMPrice = async ilk => {
  const vat = await ethers.getContractAt(VATABI, MCD_VAT);
  const spot = (await vat.ilks(ilk)).spot;
  return ethers.utils.commify(ethers.utils.formatUnits(spot, unit=RAY_DIGITS));
}

setOSMPrice(ILK, OSM, PRICE)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
