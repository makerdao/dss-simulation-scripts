#!/usr/bin/env node

const fs = require('fs');
const hre = require("hardhat");
const ethers = hre.ethers;

const args = process.argv.slice(2);

const ETH_FROM    = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const PAUSE_PROXY = "0xBE8E3e3618f7474F8cB1d074A26afFef007E98FB";
const PIP_ETH     = "0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763";
const PIP_USDC    = "0x77b68899b99b686F415d074278a9a16b336085A0";

// test voidOSM
async function main() {
  let signer = await ethers.getSigner(ETH_FROM);
  let signerAddress = await signer.getAddress();

  //
  // check balances for pause proxy and give it some ETH to run transactions
  //

  // balance ETH_FROM
  let balance = await ethers.provider.getBalance(ETH_FROM);
  console.log(signerAddress + ': ' + ethers.utils.formatEther(balance));

  // balance PAUSE_PROXY
  balance = await ethers.provider.getBalance(PAUSE_PROXY);
  console.log(PAUSE_PROXY + ': ' + ethers.utils.formatEther(balance));

  // send eth to the pause proxy
  const SendEthDamnIt = await ethers.getContractFactory("SendEthDamnIt");
  const sendEthDamnIt = await SendEthDamnIt.deploy(PAUSE_PROXY);

  // Send 10 ether to SendEthDamnIt
  let tx = await signer.sendTransaction({
    to: sendEthDamnIt.address,
    value: ethers.utils.parseEther("10.0")
  });
  tx = await sendEthDamnIt.send();

  // balance PAUSE_PROXY
  balance = await ethers.provider.getBalance(PAUSE_PROXY);
  console.log(PAUSE_PROXY + ': ' + ethers.utils.formatEther(balance));

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [PAUSE_PROXY]
  });

  signer = await ethers.getSigner(PAUSE_PROXY);

  //
  // Everthing below here happens as the pause proxy
  //
  const OSMABI = JSON.parse(fs.readFileSync('./abi/OSM.json').toString());
  const osm = await ethers.getContractAt(OSMABI, PIP_ETH, signer);

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [PAUSE_PROXY]
  });

  // change the PIP_ETH src to the USDC DSValue which is hardcoded to 1
  // causing the next poke() to pull in a > 50% price drop. 
  await osm.change(PIP_USDC);

  // time warp
  await hre.network.provider.request({
    method: "evm_increaseTime",
    params: [3600]
  });

  // now we poke() to pull in the new price
  await osm.poke();

  // switch back to ETH_FROM
  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [PAUSE_PROXY]
  });
  signer = await ethers.getSigner(ETH_FROM);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
