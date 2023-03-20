#!/usr/bin/env node

const fs = require('fs');
const hre = require("hardhat");
const ethers = hre.ethers;

const args = process.argv.slice(2);

const ETH_FROM    = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
const PAUSE_PROXY = "0xBE8E3e3618f7474F8cB1d074A26afFef007E98FB";
const MCD_END     = "0xBB856d1742fD182a90239D7AE85706C2FE4e5922";

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
  const ENDABI = JSON.parse(fs.readFileSync('./abi/end.json').toString());
  const end = await ethers.getContractAt(ENDABI, MCD_END, signer);

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [PAUSE_PROXY]
  });

  // This will cage MCD
  // await end.cage();
  await end["cage()"]();

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
