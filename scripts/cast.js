const fs = require("fs");
const hre = require("hardhat");
const ethers = hre.ethers;
const provider = hre.network.provider;
const chainlog = require("./chainlog.js");

const deployAction = async () => {
  const path = "./artifacts/contracts/Action.sol/Action.json";
  const contract = JSON.parse(fs.readFileSync(path, "utf-8"));
  const [signer] = await ethers.getSigners();
  const factory = new ethers.ContractFactory(contract.abi, contract.bytecode, signer);
  const instance = await factory.deploy();
  return instance.address;
}

const getHat = async () => {
  const chiefAddr = await chainlog("MCD_ADM");
  const [signer] = await ethers.getSigners();
  const signerAddr32 = ethers.utils.hexZeroPad(signer.address, 32);
  await provider.request({
    method: "hardhat_setStorageAt",
    params: [chiefAddr, "0xc", signerAddr32]
  });
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
  const eta = block.timestamp + delay.toNumber() + 2;
  await pause.plot(actionAddr, tag, calldata, eta);
  await provider.request({
    method: "evm_setNextBlockTimestamp",
    params: [eta]
  });
  await pause.exec(actionAddr, tag, calldata, eta);
}

const cast = async (sig, params) => {
  const actionAddr = await deployAction();
  await getHat();
  const calldata = getCalldata(sig, params);
  await exec(actionAddr, calldata);
}

module.exports = cast;
