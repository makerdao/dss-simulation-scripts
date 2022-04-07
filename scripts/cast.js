const fs = require("fs");
const hre = require("hardhat");
const ethers = hre.ethers;
const provider = hre.network.provider;
const chainlog = require("./chainlog.js");


const getAmountMkr = async () => {
  const chiefAbi = [
    "function hat() external view returns (address)",
    "function approvals(address) external view returns (uint256)"
  ];
  const chiefAddr = await chainlog("MCD_ADM");
  const chief = await ethers.getContractAt(chiefAbi, chiefAddr);
  const hat = await chief.hat();
  const currentApprovals = await chief.approvals(hat);
  const nextApprovals = currentApprovals.add(1);
  return nextApprovals;
}

const getMkr = async amount => {
  const govAbi = [
    "function balanceOf(address) external view returns (uint256)"
  ];
  const govAddr = await chainlog("MCD_GOV");
  const [signer] = await ethers.getSigners();
  const addr32 = ethers.utils.hexZeroPad(signer.address, 32);
  const slot32 = ethers.utils.hexZeroPad("0x01", 32);
  const concat = addr32 + slot32.substring(2);
  const hash = ethers.utils.keccak256(concat);
  const amountHex = amount.toHexString();
  const amountHex32 = ethers.utils.hexZeroPad(amountHex, 32);
  await provider.request({
    method: "hardhat_setStorageAt",
    params: [govAddr, hash, amountHex32]
  });
}

const vote = async amountMkr => {
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
  const govAddr = await chainlog("MCD_GOV");
  const chiefAddr = await chainlog("MCD_ADM");
  const [signer] = await ethers.getSigners();
  const gov = await ethers.getContractAt(govAbi, govAddr, signer);
  const chief = await ethers.getContractAt(chiefAbi, chiefAddr, signer);

  if (await chief.hat() === signer.address) return;

  await gov.approve(chiefAddr, amountMkr);
  await chief.lock(amountMkr);

  const tx = await chief.etch([signer.address]);
  const signerAddr32 = ethers.utils.hexZeroPad(signer.address, 32);
  const slate = ethers.utils.keccak256(signerAddr32);

  await chief.vote(slate);
  await chief.lift(signer.address);
}

const deployAction = async () => {
  const path = "./artifacts/contracts/Action.sol/Action.json";
  const contract = JSON.parse(fs.readFileSync(path, "utf-8"));
  const [signer] = await ethers.getSigners();
  const factory = new ethers.ContractFactory(contract.abi, contract.bytecode, signer);
  const instance = await factory.deploy();
  return instance.address;
}

const getCalldata = (sig, params) => {
  const sigFragment = ethers.utils.FunctionFragment.from(sig);
  const selector = ethers.utils.Interface.getSighash(sigFragment);
  const types = [];
  for (input of sigFragment.inputs) {
    types.push(input.type);
  }
  const coder = ethers.utils.defaultAbiCoder;
  const paramData = coder.encode(types, params);
  const data = selector + paramData.substring(2);
  return data;
}

const exec = async (actionAddr, calldata) => {
  const pauseAbi = [
    "function delay() external view returns (uint256)",
    "function plot(address usr, bytes32 tag, bytes memory fax, uint eta) external",
    "function exec(address usr, bytes32 tag, bytes memory fax, uint eta) external"
  ];
  const pauseAddr = await chainlog("MCD_PAUSE");
  const [signer] = await ethers.getSigners();
  const pause = await ethers.getContractAt(pauseAbi, pauseAddr, signer);
  const actionCode = await provider.request({
    method: "eth_getCode",
    params: [actionAddr]
  });
  const tag = ethers.utils.keccak256(actionCode);
  const delay = await pause.delay();
  const block = await ethers.provider.getBlock();
  const eta = block.timestamp + delay.toNumber() + 3;
  await pause.plot(actionAddr, tag, calldata, eta);
  await provider.request({
    method: "evm_setNextBlockTimestamp",
    params: [eta]
  });
  await pause.exec(actionAddr, tag, calldata, eta);
}

const cast = async (sig, params) => {
  const amountMkr = await getAmountMkr();
  await getMkr(amountMkr);
  await vote(amountMkr);
  const actionAddr = await deployAction();
  const calldata = getCalldata(sig, params);
  await exec(actionAddr, calldata);
}

module.exports = cast;
