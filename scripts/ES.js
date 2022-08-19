#!/usr/bin/env node

const assert = require("assert");
const hre = require("hardhat");
const ethers = hre.ethers;
const governance = require("../utils/governance");
const chainlog = require("../utils/chainlog");
const oracles = require("../utils/oracles");
const vaults = require("../utils/vaults");
const auctions = require("../utils/auctions");
const snowflake = require("../utils/snowflake");


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
    "function ilks(bytes32) external view returns (uint256,uint256,uint256,uint256,uint256)",
    "function flux(bytes32, address, address, uint256) external",
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
  const ilkRegAbi = [
    "function list() external view returns (bytes32[])",
  ];
  const cropperAbi = [
    "function getOrCreateProxy(address) external",
    "function proxy(address) external view returns (address)",
    "function flee(address, address, uint256)",
  ];
  const endAddr = await chainlog.get("MCD_END");
  const spotterAddr = await chainlog.get("MCD_SPOT");
  const vatAddr = await chainlog.get("MCD_VAT");
  const vowAddr = await chainlog.get("MCD_VOW");
  const daiAddr = await chainlog.get("MCD_DAI");
  const daiJoinAddr = await chainlog.get("MCD_JOIN_DAI");
  const ilkRegAddr = await chainlog.get("ILK_REGISTRY");
  const cropperAddr = await chainlog.get("MCD_CROPPER");

  const end = await ethers.getContractAt(endAbi, endAddr);
  const spotter = await ethers.getContractAt(spotterAbi, spotterAddr);
  const vat = await ethers.getContractAt(vatAbi, vatAddr);
  const vow = await ethers.getContractAt(vowAbi, vowAddr);
  const dai = await ethers.getContractAt(daiAbi, daiAddr);
  const daiJoin = await ethers.getContractAt(daiJoinAbi, daiJoinAddr);
  const ilkReg = await ethers.getContractAt(ilkRegAbi, ilkRegAddr);
  const cropper = await ethers.getContractAt(cropperAbi, cropperAddr);

  return {end, spotter, vat, vow, dai, daiJoin, ilkReg, cropper};
}

const getIlkContracts = async ilkName => {
  const gemJoinAbi = [
    "function exit(address, uint256) external",
    "function dec() external view returns (uint256)",
    "function gem() external view returns (address)",
    // specific for crop join adapters
    "function tack(address,address,uint256) external",
    "function stake(address) external view returns (uint256)",
  ];
  const gemAbi = [
    "function balanceOf(address) external view returns (uint256)",
  ];
  const underscoreName = ilkName.replaceAll("-", "_");
  const key = `MCD_JOIN_${underscoreName}`;
  const gemJoinAddr = await chainlog.get(key);
  const gemJoin = await ethers.getContractAt(gemJoinAbi, gemJoinAddr);
  const gemAddr = await gemJoin.gem();
  const gem = await ethers.getContractAt(gemAbi, gemAddr);
  return {gemJoin, gem};
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
const skim = async (ilkName, vat, end, vow, urns, cropIlks) => {
  console.log(`skim ${ilkName} vaults`);
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
    const gemBefore = await vat.gem(ilk, end.address);
    await end.skim(ilk, urn);
    if (cropIlks.includes(ilkName)) {
      const gemAfter = await vat.gem(ilk, end.address);
      const deltaGem = gemAfter.sub(gemBefore);
      if (deltaGem.eq(0)) continue;
      const {gemJoin, gem} = await getIlkContracts(ilkName);
      await gemJoin.tack(urn, end.address, deltaGem);
    }
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
const free = async (ilkName, vat, end, cropper, urns, cropIlks) => {
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
    const gemBefore = await vat.gem(ilk, urn);
    await end.connect(owner).free(ilk);
    const gemAfter = await vat.gem(ilk, urn);
    const deltaGem = gemAfter.sub(gemBefore);
    const {gemJoin, gem} = await getIlkContracts(ilkName);
    await exitVault(ilkName, vat, cropper, gemJoin, gem, urn, deltaGem, cropIlks);
  }
  console.log("done.");
}

const exitVault = async (ilkName, vat, cropper, gemJoin, gem, urn, deltaGem, cropIlks) => {
  const dec = await gemJoin.dec();
  const decDiff = ethers.BigNumber.from(18).sub(dec);
  const decDiffPow = ethers.BigNumber.from(10).pow(decDiff);
  const deltaDec = deltaGem.div(decDiffPow);
  if (deltaDec.eq(0)) return;
  const signer = await ethers.getSigner(urn);
  const balanceBefore = await gem.balanceOf(urn);
  if (cropIlks.includes(ilkName)) {
    const ilk = ethers.utils.formatBytes32String(ilkName);
    await cropper.getOrCreateProxy(urn);
    const proxyAddr = await cropper.proxy(urn);
    await vat.connect(signer).flux(ilk, urn, proxyAddr, deltaGem);
    await gemJoin.tack(urn, proxyAddr, deltaGem);
    await cropper.connect(signer).flee(gemJoin.address, urn, deltaDec);
  } else {
    await gemJoin.connect(signer).exit(urn, deltaDec);
  }
  const balanceAfter = await gem.balanceOf(urn);
  const deltaBalance = balanceAfter.sub(balanceBefore);
  console.log(`freed ${ethers.utils.formatUnits(deltaBalance, dec)} ${ilkName} from urn ${urn}`);
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

const getHolderAddr = async (dai, daiToPack) => {
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
  const daiToPackWei = ethers.utils.parseUnits(daiToPack);
  for (let i = daiTxs.length - 1; i >= 0; i--) {
    const daiTx = daiTxs[i];
    const amountHex = daiTx.data;
    const amount = ethers.BigNumber.from(amountHex);
    if (amount.gte(daiToPackWei)) {
      const holderHex32 = daiTx.topics[2];
      const holderHex = "0x" + holderHex32.substring(2 + 2*12);
      holder = ethers.utils.getAddress(holderHex);
      if (holder === ethers.constants.AddressZero) continue;
      const balance = await dai.balanceOf(holder);
      if (balance.gte(daiToPackWei)) break;
    }
  }
  return holder;
}

const impersonate = async address => {
  console.log(`impersonate ${address}`);
  await hre.network.provider.send("hardhat_setCoinbase", [address]);
  await hre.network.provider.send("evm_mine");
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
}

// 8. `pack(wad)`: dai holders send dai
const pack = async (vat, end, daiJoin, dai, holderAddr, daiToPack) => {
  console.log(`pack ${daiToPack} DAI`);
  const daiToPackWei = ethers.utils.parseUnits(daiToPack);
  const holder = await ethers.getSigner(holderAddr);
  await dai.connect(holder).approve(daiJoin.address, daiToPackWei);
  await daiJoin.connect(holder).join(holderAddr, daiToPackWei);
  await vat.connect(holder).hope(end.address);
  await end.connect(holder).pack(daiToPackWei);
}

// 9. `cash(ilk, wad)`: receive collateral
const cash = async (ilkName, vat, end, daiJoin, dai, holderAddr, daiToPack) => {
  console.log(`cash ${ilkName}`);
  const daiToPackWei = ethers.utils.parseUnits(daiToPack);
  const ilk = ethers.utils.formatBytes32String(ilkName);
  const fix = await end.fix(ilk);
  if (fix.eq(0)) {
    console.log(`nothing to cash from ${ilkName}`);
    return ethers.BigNumber.from(0);
  }
  const holder = await ethers.getSigner(holderAddr);
  await dai.connect(holder).approve(daiJoin.address, daiToPackWei);
  const gemBefore = await vat.gem(ilk, holderAddr);
  await end.connect(holder).cash(ilk, daiToPackWei);
  const gemAfter = await vat.gem(ilk, holderAddr);
  const deltaGem = gemAfter.sub(gemBefore);
  assert.ok(deltaGem.gt(0), "zero gem balance");
  console.log(`got ${ethers.utils.formatUnits(deltaGem)} ${ilkName} as gem`);
  return deltaGem;
}

const exit = async (ilkName, vat, end, cropper, gemJoin, gem, holderAddr, deltaGem, cropIlks) => {
  console.log(`exit ${ilkName}`);
  const dec = await gemJoin.dec();
  const decDiff = ethers.BigNumber.from(18).sub(dec);
  const decDiffPow = ethers.BigNumber.from(10).pow(decDiff);
  const deltaDec = deltaGem.div(decDiffPow);
  if (deltaDec.eq(0)) {
    console.log(`got 0 ${ilkName}`);
    return "0";
  }
  const holder = await ethers.getSigner(holderAddr);
  const balanceBefore = await gem.balanceOf(holderAddr);
  if (cropIlks.includes(ilkName)) {
    console.log(`flux, tack, flee`);
    const ilk = ethers.utils.formatBytes32String(ilkName);
    await cropper.getOrCreateProxy(holderAddr);
    const proxyAddr = await cropper.proxy(holderAddr);
    await vat.connect(holder).flux(ilk, holderAddr, proxyAddr, deltaGem);
    await gemJoin.tack(end.address, proxyAddr, deltaGem);
    await cropper.connect(holder).flee(gemJoin.address, holderAddr, deltaDec);
  } else {
    await gemJoin.connect(holder).exit(holderAddr, deltaDec);
  }
  const balanceAfter = await gem.balanceOf(holderAddr);
  const deltaBalance = balanceAfter.sub(balanceBefore);
  assert.ok(deltaBalance.gt(0), "zero token balance");
  const prettyBalance = ethers.utils.formatUnits(deltaBalance, dec);
  console.log(`got ${prettyBalance} ${ilkName}`);
  return prettyBalance;
}

const ES = async () => {
  const {
    end,
    spotter,
    vat,
    vow,
    dai,
    daiJoin,
    ilkReg,
    cropper,
  } = await getContracts();
  const ilks = await ilkReg.list();
  const cropIlks = ["CRVV1ETHSTETH-A"];
  const discardedIlks = [];
  const ilkNames = ["PSM-USDC-A", "ETH-C"];
  // const ilkNames = [];
  // for (const ilk of ilks) {
  //   const [Art, rate, spot] = await vat.ilks(ilk);
  //   if (spot.gt(0)) {
  //     ilkNames.push(ethers.utils.parseBytes32String(ilk));
  //   } else {
  //     discardedIlks.push(ethers.utils.parseBytes32String(ilk));
  //   }
  // }
  // const urnsETH = await vaults.list("ETH-C");
  // await oracles.setPrice("ETH-C", 0.5);
  // await triggerAuctions("ETH-C", urnsETH, 3);
  console.log("ilks pris en compte:");
  console.log(ilkNames);
  console.log("discarded ilks:");
  console.log(discardedIlks);
  const daiToPack = "1";

  await cage(end);
  for (const ilkName of ilkNames) {
    await tag(ilkName, end);
    await snip(ilkName, end);
    const urns = await vaults.list(ilkName);
    const subUrns = urns.splice(0, 20);
    await skim(ilkName, vat, end, vow, subUrns, cropIlks);
    const sample = subUrns.splice(0, 10);
    await free(ilkName, vat, end, cropper, sample, cropIlks);
  }
  await heal(vat, vow);
  await thaw(end);
  for (const ilkName of ilkNames) {
    await flow(ilkName, end);
  }
  // const holderAddr = await getHolderAddr(dai, daiToPack);
  console.log("getting DAI holders on block 15,371,847…");
  const holders = await snowflake.getHolders(15371847);
  for (const holder of holders.splice(0, 2)) {
    const holderAddr = holder.HOLDER;
    await impersonate(holderAddr);
    await pack(vat, end, daiJoin, dai, holderAddr, daiToPack);
    const basket = {};
    for (const ilkName of ilkNames) {
      const {gemJoin, gem} = await getIlkContracts(ilkName);
      const deltaGem = await cash(ilkName, vat, end, daiJoin, dai, holderAddr, daiToPack);
      if (deltaGem.gt(0)) {
        basket[ilkName] = await exit(ilkName, vat, end, cropper, gemJoin, gem, holderAddr, deltaGem, cropIlks);
      }
    }
    console.log(`for ${daiToPack} DAI, user ${holderAddr} got:`);
    console.log(JSON.stringify(basket, null, 4));
  }
}

ES();
