#!/usr/bin/env node

const assert = require("assert");
const hre = require("hardhat");
const ethers = hre.ethers;
const governance = require("../utils/governance");
const chainlog = require("../utils/chainlog");
const oracles = require("../utils/oracles");
const vaults = require("../utils/vaults");
const auctions = require("../utils/auctions");


const getContracts = async () => {
  const endAbi = [
    "function live() external view returns (uint256)",
    "function tag(bytes32) external view returns (uint256)",
    "function cage(bytes32) external",
    "function skim(bytes32 ilk, address urn) external",
    "function snip(bytes32 ilk, uint256 id) external",
    "function free(bytes32) external",
    "function thaw() external",
    "function wait() external view returns (uint256)",
    "function flow(bytes32) external",
    "function pack(uint256) external",
    "function cash(bytes32 ilk, uint256 wad) external",
    "function fix(bytes32) external view returns (uint256)",
  ];
  const spotterAbi = [
    "function ilks(bytes32) external view returns (address,uint256)"
  ];
  const vatAbi = [
    "function dai(address) external view returns (uint256)",
    "function sin(address) external view returns (uint256)",
    "function hope(address) external",
    "function gem(bytes32, address) external view returns (uint256)",
  ];
  const vowAbi = [
    "function heal(uint256) external",
  ];
  const daiAbi = [
    "function balanceOf(address) external view returns (uint256)",
    "function approve(address, uint256) external",
  ];
  const daiJoinAbi = [
    "function join(address, uint256) external",
  ];
  const endAddr = await chainlog.get("MCD_END");
  const spotterAddr = await chainlog.get("MCD_SPOT");
  const vatAddr = await chainlog.get("MCD_VAT");
  const vowAddr = await chainlog.get("MCD_VOW");
  const daiAddr = await chainlog.get("MCD_DAI");
  const daiJoinAddr = await chainlog.get("MCD_JOIN_DAI");

  const end = await ethers.getContractAt(endAbi, endAddr);
  const spotter = await ethers.getContractAt(spotterAbi, spotterAddr);
  const vat = await ethers.getContractAt(vatAbi, vatAddr);
  const vow = await ethers.getContractAt(vowAbi, vowAddr);
  const dai = await ethers.getContractAt(daiAbi, daiAddr);
  const daiJoin = await ethers.getContractAt(daiJoinAbi, daiJoinAddr);

  return {end, spotter, vat, vow, dai, daiJoin};
}

const getGemJoin = async ilkName => {
  const gemJoinAbi = [
    "function exit(address, uint256) external",
    "function dec() external view returns (uint256)",
  ];
  const underscoreName = ilkName.replaceAll("-", "_");
  const key = `MCD_JOIN_${underscoreName}`;
  const gemJoinAddr = await chainlog.get(key);
  const gemJoin = await ethers.getContractAt(gemJoinAbi, gemJoinAddr);
  return gemJoin;
}

const triggerAuctions = async (ilkName, urns, amount) => {
  const underVaults = await vaults.listUnder(ilkName, urns, amount);
  for (let i = 0; i < underVaults.length; i++) {
    await auctions.bark(ilkName, underVaults[i]);
  }
}

// 1. `cage()`: freeze system
const cage = async end => {
  await governance.spell("cage(address)", [end.address]);
}

// 2. `cage(ilk)`: set ilk prices
const tag = async (ilkName, end) => {
  console.log("tagging…");
  const ilk = ethers.utils.formatBytes32String(ilkName);
  await end.cage(ilk);
  const tag = await end.tag(ilk);
  const prettyTag = ethers.utils.formatUnits(tag, unit=27);
  console.log(`tag set at ${prettyTag} ${ilkName} per DAI`);
}

// 4b. `snip(ilk, id)`: close ongoing auctions
const snip = async (ilkName, end) => {
  console.log("snipping current auctions…");
  const ilk = ethers.utils.formatBytes32String(ilkName);
  const list = await auctions.list(ilkName);
  console.log(list);
  for (const id of list) {
    await end.snip(ilk, id);
  }
  console.log("done.");
}

// 3. `skim(ilk, urn)`: close vaults
const skim = async (ilkName, vat, end, vow, urns) => {
  console.log(`skimming ${ilkName} vaults…`);
  const ilk = ethers.utils.formatBytes32String(ilkName);
  const sur = await vat.dai(vow.address);
  let counter = 0;
  for (urn of urns) {
    const percentage = Math.round(100 * counter++ / urns.length);
    const sin = await vat.sin(vow.address);
    const rem = sur.sub(sin);
    const remPretty = ethers.utils.formatUnits(rem, 51);
    const remShort = remPretty.substring(0, remPretty.indexOf(".") + 7);
    process.stdout.write(`${percentage}% - surplus remaining: ${remShort} million\r`);
    await end.skim(ilk, urn);
  }
  console.log("done.");
}

// heal the vow in order to remove all surplus
const heal = async (vat, vow) => {
  console.log("healing the vow…");
  const sur = await vat.dai(vow.address);
  const sin = await vat.sin(vow.address);
  if (sur.gt(sin)) {
    console.error("skim more vaults in order to heal all surplus");
    console.error(`surplus: ${ethers.utils.formatUnits(sur, 51)} million`);
    console.error(`sin:     ${ethers.utils.formatUnits(sin, 51)} million`);
    process.exit();
  }
  await vow.heal(sur);
  console.log("done.");
}

// 5. `free(ilk)`: remove remaining collateral from vaults
const free = async (ilkName, end, urns) => {
  console.log(`freeing ${ilkName} vaults…`);
  const ilk = ethers.utils.formatBytes32String(ilkName);
  counter = 0;
  for (const urn of urns) {
    const percentage = Math.round(100 * counter++ / urns.length);
    process.stdout.write(`${percentage}%\r`);
    await hre.network.provider.send("hardhat_setCoinbase", [urn]);
    await hre.network.provider.send("evm_mine");
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [urn],
    });
    const owner = await ethers.getSigner(urn);
    await end.connect(owner).free(ilk);
  }
  console.log("done.");
}

// 6. `thaw()`
const thaw = async end => {
  console.log("thaw");
  const wait = await end.wait();
  await hre.network.provider.request({
    method: "evm_increaseTime",
    params: [wait.toNumber()],
  });
  await end.thaw();
}

// 7. `flow(ilk)`
const flow = async (ilkName, end) => {
  console.log(`flow ${ilkName}`);
  const ilk = ethers.utils.formatBytes32String(ilkName);
  await end.flow(ilk);
}

// 8. `pack(wad)`: dai holders send dai
const pack = async (vat, end, daiJoin, dai, daiToPack) => {
  console.log(`pack ${daiToPack} DAI`);
  const daiToPackWei = ethers.utils.parseUnits(daiToPack);
  const latestBlock = await ethers.provider.getBlock();
  const transferTopic = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Transfer(address,address,uint256)"));
  let daiTxs = [];
  let deltaBlocks = 1;
  while (daiTxs.length < 100) {
    deltaBlocks *= 2;
    const filter = {
      address: dai.address,
      fromBlock: latestBlock.number - deltaBlocks,
      topics: [transferTopic],
    };
    daiTxs = await ethers.provider.getLogs(filter);
  }
  let holder;
  for (let i = daiTxs.length - 1; i >= 0; i--) {
    const daiTx = daiTxs[i];
    const amountHex = daiTx.data;
    const amount = ethers.BigNumber.from(amountHex);
    if (amount.gte(daiToPackWei)) {
      const holderHex32 = daiTx.topics[2];
      const holderHexBytes = ethers.utils.stripZeros(holderHex32);
      const holderHex = ethers.utils.hexlify(holderHexBytes);
      holder = ethers.utils.getAddress(holderHex);
      const balance = await dai.balanceOf(holder);
      if (balance.gte(daiToPackWei)) break;
    }
  }
  await hre.network.provider.send("hardhat_setCoinbase", [holder]);
  await hre.network.provider.send("evm_mine");
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [holder],
  });
  const signer = await ethers.getSigner(holder);
  await dai.connect(signer).approve(daiJoin.address, daiToPackWei);
  await daiJoin.connect(signer).join(holder, daiToPackWei);
  await vat.connect(signer).hope(end.address);
  await end.connect(signer).pack(daiToPackWei);
  return holder;
}

// 9. `cash(ilk, wad)`: receive collateral
const cash = async (ilkName, vat, end, gemJoin, daiJoin, dai, holder, daiToPack) => {
  console.log(`cash ${ilkName}`);
  const daiToPackWei = ethers.utils.parseUnits(daiToPack);
  const ilk = ethers.utils.formatBytes32String(ilkName);
  const fix = await end.fix(ilk);
  if (fix.eq(0)) {
    console.log(`nothing to cash from ${ilkName}`);
    return;
  }
  const signer = await ethers.getSigner(holder);
  await dai.connect(signer).approve(daiJoin.address, daiToPackWei);
  const gemBefore = await vat.connect(signer).gem(ilk, holder);
  await end.connect(signer).cash(ilk, daiToPackWei);
  const gemAfter = await vat.connect(signer).gem(ilk, holder);
  const delta = gemAfter.sub(gemBefore);
  assert.ok(delta.gt(0));
  const dec = await gemJoin.dec();
  const decDiff = ethers.BigNumber.from(18).sub(dec);
  const decDiffPow = ethers.BigNumber.from(10).pow(decDiff);
  const deltaDec = gemAfter.div(decDiffPow);
  await gemJoin.connect(signer).exit(holder, deltaDec);
  const prettyDelta = ethers.utils.formatUnits(delta);
  console.log(`got ${prettyDelta} ${ilkName}`);
}

const ES = async () => {

  const {end, spotter, vat, vow, dai, daiJoin} = await getContracts();
  const ilkNames = ["ETH-C", "GUNIV3DAIUSDC1-A", "RWA002-A", "PSM-USDC-A", "DIRECT-AAVEV2-DAI", "AAVE-A"];
  const urnsETH = await vaults.list("ETH-C");
  await oracles.setPrice("ETH-C", 0.5);
  await triggerAuctions("ETH-C", urnsETH, 3);
  const daiToPack = "20";

  await cage(end);
  for (const ilkName of ilkNames) {
    await tag(ilkName, end);
    await snip(ilkName, end);
    const urns = await vaults.list(ilkName);
    const subUrns = urns.splice(0, 400);
    await skim(ilkName, vat, end, vow, subUrns);
    const sample = subUrns.splice(0, 10);
    await free(ilkName, end, sample);
  }
  await heal(vat, vow);
  await thaw(end);
  for (const ilkName of ilkNames) {
    await flow(ilkName, end);
  }
  const holder = await pack(vat, end, daiJoin, dai, daiToPack);
  for (const ilkName of ilkNames) {
    const gemJoin = await getGemJoin(ilkName);
    await cash(ilkName, vat, end, gemJoin, daiJoin, dai, holder, daiToPack);
  }
}

ES();
