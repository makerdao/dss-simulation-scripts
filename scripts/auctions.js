const hre = require("hardhat");
const {ethers} = hre;
const chainlog = require("./chainlog");


const list = async ilk => {
  const clipperAbi = [
    "function list() external view returns (uint256[])"
  ];
  const clipperName = `MCD_CLIP_${ilk.replace("-", "_")}`;
  const clipperAddr = await chainlog.get(clipperName);
  const clipper = await ethers.getContractAt(clipperAbi, clipperAddr);
  const listBN = await clipper.list();
  const list =[];
  listBN.forEach(id => list.push(id.toNumber()));
  return list;
}

const bark = async (ilk, urn) => {
  const dogAbi = [
    "function bark(bytes32 ilk, address urn, address kpr) external",
  ];
  const dogAddr = await chainlog.get("MCD_DOG");
  const dog = await ethers.getContractAt(dogAbi, dogAddr);
  const ilkBytes32 = ethers.utils.formatBytes32String(ilk);
  const [signer] = await ethers.getSigners();
  await dog.bark(ilkBytes32, urn, signer.address);
}

module.exports = {list, bark};
