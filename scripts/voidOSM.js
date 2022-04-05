#!/usr/bin/env node

const assert = require("assert");
const fs = require('fs');
const hre = require("hardhat");
const ethers = hre.ethers;

const ETH_FROM    = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const PAUSE_PROXY = "0xBE8E3e3618f7474F8cB1d074A26afFef007E98FB";
const PIP_ETH     = "0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763";
const PIP_USDC    = "0x77b68899b99b686F415d074278a9a16b336085A0";

const ownPauseProxy = async () => {
  const [signer] = await ethers.getSigners();
  const signerAddress32 = ethers.utils.hexZeroPad(signer.address, 32);
  await hre.network.provider.request({
    method: "hardhat_setStorageAt",
    params: [PAUSE_PROXY, "0x0", signerAddress32]
  });
}

const exec = async (address, sig, params) => {
  await ownPauseProxy();
  const PAUSE_PROXY_ABI = JSON.parse(fs.readFileSync("./abi/pauseProxy.json", "utf-8"));
  const [signer] = await ethers.getSigners();
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

const deployAction = async () => {
  const path = "./artifacts/contracts/Action.sol/Action.json";
  const contract = JSON.parse(fs.readFileSync(path, "utf-8"));
  const [signer] = await ethers.getSigners();
  const factory = new ethers.ContractFactory(contract.abi, contract.bytecode, signer);
  const instance = await factory.deploy();
  return instance.address;
}

// test voidOSM
async function main() {
  const signer = await ethers.getSigner(ETH_FROM);
  const OSMABI = JSON.parse(fs.readFileSync('./abi/OSM.json').toString());
  const osm = await ethers.getContractAt(OSMABI, PIP_ETH, signer);
  const action = await deployAction();

  // change the PIP_ETH src to the USDC DSValue which is hardcoded to 1
  // causing the next poke() to pull in a > 50% price drop.
  await exec(action, "change(address,address)", [PIP_ETH, PIP_USDC]);
  assert.equal(await osm.src(), PIP_USDC);

  // time warp
  await hre.network.provider.request({
    method: "evm_increaseTime",
    params: [3600]
  });

  // now we poke() to pull in the new price
  await osm.poke();
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
