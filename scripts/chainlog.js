const hre = require("hardhat");
const ethers = hre.ethers;


const chainlog = async key => {
  const address = "0xda0ab1e0017debcd72be8599041a2aa3ba7e740f";
  const abi = ["function getAddress(bytes32) view returns (address)"];
  const contract = await ethers.getContractAt(abi, address);
  const coder = ethers.utils.defaultAbiCoder;
  const keyBytes = ethers.utils.toUtf8Bytes(key);
  const keyHex = ethers.utils.hexlify(keyBytes);
  const keyHex32 = keyHex + "0".repeat(66 - keyHex.length);
  const result = await contract.getAddress(keyHex32); 
  return result;
}

module.exports = chainlog;
