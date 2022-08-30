#! /usr/bin/env node

hre = require("hardhat");
ethers = hre.ethers;
chainlog = require("../utils/chainlog");

test = async () => {
  const vatAbi = [
    "function dai(address) view returns (uint256)",
    "function sin(address) view returns (uint256)",
  ];
  const vowAbi = [
    "function flop()",
    "function sump() view returns (uint256)",
    "function Sin() view returns (uint256)",
    "function Ash() view returns (uint256)",
    "function heal(uint256)",
  ];
  const vatAddr = await chainlog.get("MCD_VAT");
  const vowAddr = await chainlog.get("MCD_VOW");
  const vat = await ethers.getContractAt(vatAbi, vatAddr);
  const vow = await ethers.getContractAt(vowAbi, vowAddr);

  let [sur, pureSin, sump] = await getValues(vat, vow);
  let heal = pureSin.gt(sur) ? sur : pureSin;
  await vow.heal(heal);
  console.log(`heal:    ${ethers.utils.formatUnits(heal, 45)}`);
  [sur, pureSin, sump] = await getValues(vat, vow);
  if (sur.eq(0)) console.log("surplus zero");
  if (sump.lte(pureSin)) console.log("sin big enough");
}

getValues = async (vat, vow) => {
  let sur = await vat.dai(vow.address);
  let sin = await vat.sin(vow.address);
  let Sin = await vow.Sin();
  let Ash = await vow.Ash();
  let pureSin = sin.sub(Sin).sub(Ash);
  let sump = await vow.sump();
  console.log(`sump:    ${ethers.utils.formatUnits(sump, 45)}`);
  console.log(`pureSin: ${ethers.utils.formatUnits(pureSin, 45)}`);
  console.log(`sur:     ${ethers.utils.formatUnits(sur, 45)}`);
  console.log(`         ${ethers.utils.formatUnits(sump.mul(2).add(sur).sub(pureSin), 45)}`);
  return [sur, pureSin, sump];
}

triggerFlopAuctions = async (vat, vow, amount) => {
  const sur = await vat.dai(vow.address);
  const sin = await vat.sin(vow.address);
  const Sin = await vow.Sin();
  const Ash = await vow.Ash();
  const pureSin = sin.sub(Sin).sub(Ash);
  const sump = await vow.sump();
  const need = sump.mul(amount).add(sur).sub(pureSin);
  const ilks = await ilkReg.list();
}

test();
