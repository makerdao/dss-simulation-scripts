const fs = require("fs");
const hre = require("hardhat");
const ethers = hre.ethers;
const chainlog = require("./chainlog.js");

const deployAction = async () => {
  const path = "./artifacts/contracts/Action.sol/Action.json";
  const contract = JSON.parse(fs.readFileSync(path, "utf-8"));
  const [signer] = await ethers.getSigners();
  const factory = new ethers.ContractFactory(contract.abi, contract.bytecode, signer);
  const instance = await factory.deploy();
  return instance.address;
}

const ownPauseProxy = async () => {
  const PAUSE_PROXY = await chainlog("MCD_PAUSE_PROXY");
  const [signer] = await ethers.getSigners();
  const signerAddress32 = ethers.utils.hexZeroPad(signer.address, 32);
  await hre.network.provider.request({
    method: "hardhat_setStorageAt",
    params: [PAUSE_PROXY, "0x0", signerAddress32]
  });
}

const exec = async (address, sig, params) => {
  const PAUSE_PROXY_ABI = JSON.parse(fs.readFileSync("./abi/pauseProxy.json", "utf-8"));
  const [signer] = await ethers.getSigners();
  const PAUSE_PROXY = await chainlog("MCD_PAUSE_PROXY");
  const pauseProxy = await ethers.getContractAt(PAUSE_PROXY_ABI, PAUSE_PROXY, signer);
  const sigFragment = ethers.utils.FunctionFragment.from(sig);
  const selector = ethers.utils.Interface.getSighash(sigFragment);
  const coder = ethers.utils.defaultAbiCoder;
  const types = [];
  for (input of sigFragment.inputs) {
    types.push(input.type);
  }
  const paramData = coder.encode(types, params);
  const data = selector + paramData.substring(2);
  await pauseProxy.exec(address, data);
}

const cast = async (sig, params) => {
  const action = await deployAction();
  await ownPauseProxy();
  await exec(action, sig, params);
}

module.exports = cast;
