const hre = require("hardhat");
const {ethers} = hre;
const cast = require("./cast");


const setOracles = async ilk => {
  const medianAbi = [
    "function slot(uint8) external view returns (address)",
  ];
  const medianAddr = "0x64DE91F5A373Cd4c28de3600cB34C7C6cE410C85"; // TODO: obtain from ilk registry
  const median = await ethers.getContractAt(medianAbi, medianAddr);
  const oracles = [];
  const message = `finding oracles for ${ilk}`;
  for (let i = 0; i < 256; i++) {
    const progress = Math.round(100 * (i+1) / 256);
    process.stdout.write(`${message} ${progress}% - found ${oracles.length} oracles\r`);
    const oracle = await median.slot(i);
    if (oracle !== ethers.constants.AddressZero) {
      oracles.push(oracle);
    }
  }
  console.log("");
  console.log(oracles);
  console.log("dropping oracles…");
  await cast("drop(address,address[])", [medianAddr, oracles]);
}

setOracles("ETH-A");
