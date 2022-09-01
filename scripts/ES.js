#!/usr/bin/env node

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
    "function ilks(bytes32) external view returns (uint256 Art, uint256 rate, uint256 spot, uint256 line, uint256 dust)",
    "function flux(bytes32, address, address, uint256) external",
  ];
  const vowAbi = [
    "function heal(uint256) external",
    "function flap()",
    "function Sin() external view returns (uint256)",
    "function Ash() external view returns (uint256)",
    "function bump() view returns (uint256)",
    "function flop()",
    "function sump() view returns (uint256)",
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
    "function quit(bytes32, address, address)",
  ];
  const jugAbi = [
    "function drip(bytes32) external",
  ];
  const flapperAbi = [
    "function bids(uint256) view returns ((uint256,uint256,address,uint48,uint48))",
    "function kicks() view returns (uint256)",
    "function fill() view returns (uint256)",
    "function lid() view returns (uint256)",
    "function yank(uint256)",
  ];
  const flopperAbi = [
    "function kicks() view returns (uint256)",
    "function bids(uint256) view returns ((uint256, uint256 lot))",
    "function yank(uint256)",
  ];
  const mkrAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address, uint256)",
  ];
  const esmAbi = [
    "function fire()",
    "function join(uint256)",
    "function Sum() view returns (uint256)",
    "function min() view returns (uint256)",
  ];
  const endAddr = await chainlog.get("MCD_END");
  const spotterAddr = await chainlog.get("MCD_SPOT");
  const vatAddr = await chainlog.get("MCD_VAT");
  const vowAddr = await chainlog.get("MCD_VOW");
  const daiAddr = await chainlog.get("MCD_DAI");
  const daiJoinAddr = await chainlog.get("MCD_JOIN_DAI");
  const ilkRegAddr = await chainlog.get("ILK_REGISTRY");
  const cropperAddr = await chainlog.get("MCD_CROPPER");
  const jugAddr = await chainlog.get("MCD_JUG");
  const flapperAddr = await chainlog.get("MCD_FLAP");
  const flopperAddr = await chainlog.get("MCD_FLOP");
  const mkrAddr = await chainlog.get("MCD_GOV");
  const esmAddr = await chainlog.get("MCD_ESM");

  const end = await ethers.getContractAt(endAbi, endAddr);
  const spotter = await ethers.getContractAt(spotterAbi, spotterAddr);
  const vat = await ethers.getContractAt(vatAbi, vatAddr);
  const vow = await ethers.getContractAt(vowAbi, vowAddr);
  const dai = await ethers.getContractAt(daiAbi, daiAddr);
  const daiJoin = await ethers.getContractAt(daiJoinAbi, daiJoinAddr);
  const ilkReg = await ethers.getContractAt(ilkRegAbi, ilkRegAddr);
  const cropper = await ethers.getContractAt(cropperAbi, cropperAddr);
  const jug = await ethers.getContractAt(jugAbi, jugAddr);
  const flapper = await ethers.getContractAt(flapperAbi, flapperAddr);
  const flopper = await ethers.getContractAt(flopperAbi, flopperAddr);
  const mkr = await ethers.getContractAt(mkrAbi, mkrAddr);
  const esm = await ethers.getContractAt(esmAbi, esmAddr);

  return {
    end,
    spotter,
    vat,
    vow,
    dai,
    daiJoin,
    ilkReg,
    cropper,
    jug,
    flapper,
    flopper,
    mkr,
    esm,
  };
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
    "function name() external view returns (string)",
  ];
  const underscoreName = ilkName.replaceAll("-", "_");
  const key = `MCD_JOIN_${underscoreName}`;
  const gemJoinAddr = await chainlog.get(key);
  const gemJoin = await ethers.getContractAt(gemJoinAbi, gemJoinAddr);
  const gemAddr = await gemJoin.gem();
  const gem = await ethers.getContractAt(gemAbi, gemAddr);
  return {gemJoin, gem};
}

const triggerAuctions = async (ilkName, cropIlks, blockNumber, drop, amount) => {
  const urns = await vaults.list(ilkName, cropIlks, blockNumber);
  const success = await oracles.setPrice(ilkName, drop);
  if (!success) return;
  const underVaults = await vaults.listUnder(ilkName, urns, amount);
  console.log(`barking ${underVaults.length} vaults…`);
  for (let i = 0; i < underVaults.length; i++) {
    process.stdout.write(`${Math.round(100 * i / underVaults.length)}%\r`);
    try {
      await auctions.bark(ilkName, underVaults[i]);
    } catch (e) {
      console.error(e.message);
    }
  }
}

const triggerFlaps = async (vat, jug, vow, flapper, ilkNames) => {
  console.log("triggering surplus auctions…");
  const block = await ethers.provider.getBlock();
  await hre.network.provider.request({
    method: "evm_setNextBlockTimestamp",
    params: [block.timestamp + 1_000_000_000]
  });
  console.log("dripping ilks…");
  let i = 0;
  for (const ilkName of ilkNames) {
    process.stdout.write(`${Math.round(100 * i++ / ilkNames.length)}%\r`);
    const ilk = ethers.utils.formatBytes32String(ilkName);
    await jug.drip(ilk, {gasLimit: 100_000});
  }
  const sin = await vat.sin(vow.address);
  const Sin = await vow.Sin();
  const Ash = await vow.Ash();
  await vow.heal(sin.sub(Sin).sub(Ash));
  const bump = await vow.bump();
  const lid = await flapper.lid();
  let fill = await flapper.fill();
  while (fill.add(bump).lte(lid)) {
    await vow.flap();
    const id = await flapper.kicks();
    const bid = await flapper.bids(id);
    const lot = ethers.utils.formatUnits(bid[1], 45);
    console.log(`triggered flap auction ${id} with ${lot} dai as lot`);
    fill = fill.add(bump);
  }
}

const getNeed = async (vat, vow, amount) => {
  const sur = await vat.dai(vow.address);
  const sin = await vat.sin(vow.address);
  const Sin = await vow.Sin();
  const Ash = await vow.Ash();
  const pureSin = sin.sub(Sin).sub(Ash);
  const sump = await vow.sump();
  const need = sump.mul(amount).add(sur).sub(pureSin);
  let nat = parseInt(ethers.utils.formatUnits(need, 45));
  nat++;
  console.log(`in need of losing ${nat} DAI to trigger ${amount} flops`);
  return nat;
}

const triggerFlops = async (vat, vow, flopper, amount) => {
  const need = await getNeed(vat, vow, amount);
  await governance.spell("sendPaymentFromSurplusBuffer(address,uint256)", [vow.address, need]);
  await heal(vat, vow);
  for (let i = 0; i < amount; i++) {
    await vow.flop();
    const id = await flopper.kicks();
    const {lot} = await flopper.bids(id);
    console.log(`triggered flop ${id} auctioning ${ethers.utils.formatUnits(lot)} MKR`);
  }
}

// 1. `cage()`: freeze system
const cage = async end => {
  await governance.spell("cage(address)", [end.address]);
}

const triggerEsm = async (mkr, esm) => {
  console.log("triggering the ESM…");
  const Sum = await esm.Sum();
  const min = await esm.min();
  const remaining = min.sub(Sum);
  const signer = await ethers.getSigner();
  await governance.getMkr(remaining);
  await mkr.approve(esm.address, remaining);
  await esm.connect(signer).join(remaining);
  await esm.fire();
  console.log("done.");
}

const yankSystemAuctions = async (flapper, flopper) => {
  for (let id = await flapper.kicks(); id.gte(0); id = id.sub(1)) {
    const bid = await flapper.bids(id);
    const lot = bid[1];
    if (lot.gt(0)) {
      await flapper.yank(id);
      console.log(`yanked surplus auction ${id.toString()}`);
    }
  }
  for (let id = await flopper.kicks(); id.gte(0); id = id.sub(1)) {
    const {lot} = await flopper.bids(id);
    if (lot.gt(0)) {
      await flopper.yank(id);
      console.log(`yanked debt auction ${id.toString()}`);
    }
  }
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
const skim = async (ilkName, vat, end, vow, cropper, urns, cropIlks) => {
  console.log(`skim ${ilkName} vaults`);
  const ilk = ethers.utils.formatBytes32String(ilkName);
  const sur = await vat.dai(vow.address);
  let counter = 0;
  for (let urn of urns) {
    if (cropIlks.includes(ilkName)) {
      urn = await cropper.proxy(urn);
    }
    const percentage = Math.round(100 * counter++ / urns.length);
    const gemBefore = await vat.gem(ilk, end.address);
    await end.skim(ilk, urn);
    const sin = await vat.sin(vow.address);
    const rem = sur.sub(sin);
    const remPretty = ethers.utils.formatUnits(rem, 51);
    const remShort = remPretty.substring(0, remPretty.indexOf(".") + 7);
    process.stdout.write(`${percentage}% - surplus remaining: ${remShort} million\r`);
    if (cropIlks.includes(ilkName)) {
      const gemAfter = await vat.gem(ilk, end.address);
      const deltaGem = gemAfter.sub(gemBefore);
      if (deltaGem.eq(0)) continue;
      console.log(`${urn} skimmed ${ethers.utils.formatUnits(deltaGem)} ${ilkName}`);
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
    if (cropIlks.includes(ilkName)) {
      await vat.connect(owner).hope(cropper.address);
      await cropper.connect(owner).quit(ilk, urn, urn);
    }
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
  if (deltaDec.eq(0)) {
    return;
  }
  const signer = await ethers.getSigner(urn);
  const balanceBefore = await gem.balanceOf(urn);
  if (cropIlks.includes(ilkName)) {
    const ilk = ethers.utils.formatBytes32String(ilkName);
    const proxyAddr = await cropper.proxy(urn);
    await vat.connect(signer).flux(ilk, urn, proxyAddr, deltaGem);
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
    try {
      await gemJoin.connect(holder).exit(holderAddr, deltaDec);
    } catch (e) {
      if (e.message.includes("account is blacklisted")) {
        console.log(`holder blacklisted by ${await gem.name()}`);
        return "0";
      } else {
        console.error(e);
        process.exit();
      }
    }
  }
  const balanceAfter = await gem.balanceOf(holderAddr);
  const deltaBalance = balanceAfter.sub(balanceBefore);
  const prettyBalance = ethers.utils.formatUnits(deltaBalance, dec);
  console.log(`got ${prettyBalance} ${ilkName}`);
  return prettyBalance;
}

const ES = async () => {
  const blockNumber = process.argv.length > 2 ? process.argv[2] : await ethers.provider.getBlockNumber();
  console.log(blockNumber);
  console.log("getting contracts…");
  const {
    end,
    spotter,
    vat,
    vow,
    dai,
    daiJoin,
    ilkReg,
    cropper,
    jug,
    flapper,
    flopper,
    mkr,
    esm,
  } = await getContracts();
  console.log("getting ilks…");
  const ilks = await ilkReg.list();
  const cropIlks = ["CRVV1ETHSTETH-A"];
  // const ilkNames = ["PSM-USDC-A", "CRVV1ETHSTETH-A"];
  const ilkNames = [];
  // ilks.forEach(ilk => ilkNames.push(ethers.utils.parseBytes32String(ilk)));
  let counter = 0;
  console.log("discarding zero-spot ilks…");
  for (const ilk of ilks) {
    const percentage = Math.round(100 * counter++ / ilks.length);
    process.stdout.write(`${percentage}%\r`);
    const ilkName = ethers.utils.parseBytes32String(ilk)
    const [Art, rate, spot] = await vat.ilks(ilk);
    if (spot.gt(0)) {
      ilkNames.push(ilkName);
    } else {
      console.log(`discarded ${ilkName}`);
    }
  }
  // for (const ilkName of ilkNames) {
  //   await triggerAuctions(ilkName, cropIlks, blockNumber, 0.5, 1);
  // }
  await triggerFlaps(vat, jug, vow, flapper, ilkNames);
  await triggerFlops(vat, vow, flopper, 3);

  // await cage(end);
  await triggerEsm(mkr, esm);
  await yankSystemAuctions(flapper, flopper);
  for (const ilkName of ilkNames) {
    console.log(`\nprocessing ${ilkName}…`);
    await tag(ilkName, end);
    await snip(ilkName, end);
    const urns = await vaults.list(ilkName, cropIlks, blockNumber);
    await skim(ilkName, vat, end, vow, cropper, urns, cropIlks);
    await free(ilkName, vat, end, cropper, urns, cropIlks);
  }
  await heal(vat, vow);
  await thaw(end);
  for (const ilkName of ilkNames) {
    await flow(ilkName, end);
  }
  // const holderAddr = await getHolderAddr(dai, daiToPack);
  console.log(`getting DAI holders on block ${blockNumber}…`);
  const holders = await snowflake.getHolders(blockNumber);
  for (const holder of holders) {
    console.log(holder);
    const holderAddrRaw = holder.LOCATION.replace(/.*\[(.*)\].*/g, "$1");
    console.log(holderAddrRaw);
    let holderAddr;
    if (holderAddrRaw.startsWith("0x")) {
      holderAddr = holderAddrRaw;
    } else {
      const number = ethers.BigNumber.from(holderAddrRaw);
      const hexString = number.toHexString();
      const string = hexString.substring(2);
      const padString = string.padStart(40, "0");
      holderAddr = "0x" + padString;
    }
    console.log(holderAddr);
    const daiToPackWei = await dai.balanceOf(holderAddr);
    const daiToPack = ethers.utils.formatUnits(daiToPackWei);
    console.log(`user ${holderAddr} is cashing ${daiToPack} DAI (${daiToPackWei.toString()})`);
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
