#!/usr/bin/env node

const { sign } = require("crypto");
const fs = require("fs");
const hre = require("hardhat");
const ethers = hre.ethers;
const provider = hre.network.provider;
const chainlog = require("./chainlog");

const args = process.argv.slice(2);
const SPELL = args[1] || "0x8E4faFef5bF61f09654aDeB46E6bC970BcD42c52";

const getApprovals = async () => {
  const chiefAbi = [
    "function hat() external view returns (address)",
    "function approvals(address) external view returns (uint256)"
  ];
  const chiefAddr = await chainlog.get("MCD_ADM");
  const chief = await ethers.getContractAt(chiefAbi, chiefAddr);
  const hat = await chief.hat();
  const approvals = await chief.approvals(hat);
  return approvals;
}

const getMkr = async amount => {
  const govAbi = [
    "function balanceOf(address) external view returns (uint256)"
  ];
  const govAddr = await chainlog.get("MCD_GOV");
  const [signer] = await ethers.getSigners();
  const gov = await ethers.getContractAt(govAbi, govAddr, signer);
  let balance = await gov.balanceOf(signer.address);
  // console.log(signer.address + ': ' + ethers.utils.formatEther(balance));
  const addr32 = ethers.utils.hexZeroPad(signer.address, 32);
  const slot32 = ethers.utils.hexZeroPad("0x01", 32);
  const concat = addr32 + slot32.substring(2);
  const hash = ethers.utils.keccak256(concat);
  const amountHex = amount.toHexString();
  const amountHex32 = ethers.utils.hexZeroPad(amountHex, 32);
  await provider.request({
    method: "hardhat_setStorageAt",
    params: [govAddr, hash, amountHex32]
  });
  balance = await gov.balanceOf(signer.address);
  // console.log(signer.address + ': ' + ethers.utils.formatEther(balance));
}

const vote = async (spellAddress, amountMkr) => {
  const govAbi = [
    "function approve(address, uint256) external"
  ];
  const chiefAbi = [
    "function hat() external view returns (address)",
    "function lock(uint256) external",
    "function etch(address[]) external returns (bytes32)",
    "function vote(bytes32) external",
    "function lift(address) external"
  ];
  const govAddr = await chainlog.get("MCD_GOV");
  const chiefAddr = await chainlog.get("MCD_ADM");
  const [signer] = await ethers.getSigners();
  const gov = await ethers.getContractAt(govAbi, govAddr, signer);
  const chief = await ethers.getContractAt(chiefAbi, chiefAddr, signer);

  if (await chief.hat() === spellAddress) return;

  await gov.approve(chiefAddr, amountMkr);
  await chief.lock(amountMkr);

  await chief.etch([spellAddress]);
  const spellAddr32 = ethers.utils.hexZeroPad(spellAddress, 32);
  const slate = ethers.utils.keccak256(spellAddr32);

  await chief.vote(slate);
  await chief.lift(spellAddress);
}

async function cast(spellAddress) {
  const block = await ethers.provider.getBlock();
  const spellAbi = [
    "function schedule() external",
    "function cast() external"
  ];
  console.log("minting MKR…");
  const approvals = await getApprovals();
  await getMkr(approvals.add(1));
  console.log("voting…");
  await vote(spellAddress, approvals.add(1));
  const [signer] = await ethers.getSigners();
  const spell = await ethers.getContractAt(spellAbi, spellAddress, signer);
  console.log("schedule…");
  await spell.schedule();
  console.log("warp…");
  await provider.request({
    method: "evm_setNextBlockTimestamp",
    params: [block.timestamp + 604800] // 1 week
  });
  console.log("cast…");
  await spell.cast();
}

cast(SPELL)
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
