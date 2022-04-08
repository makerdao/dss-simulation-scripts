const hre = require("hardhat");
const ethers = hre.ethers;


const address = "0xda0ab1e0017debcd72be8599041a2aa3ba7e740f";

const chainlog = async key => {
  const abi = ["function getAddress(bytes32) view returns (address)"];
  const contract = await ethers.getContractAt(abi, address);
  const keyBytes32 = ethers.utils.formatBytes32String(key);
  const result = await contract.getAddress(keyBytes32);
  return result;
}

module.exports = chainlog;
