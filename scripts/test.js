hre = require("hardhat");
ethers = hre.ethers;
chainlog = require("../utils/chainlog");

test = async () => {
  const ilkRegAbi = ["function list() external view returns (bytes32[])"];
  const jugAbi = ["function drip(bytes32) external returns (uint256)"];
  const ilkRegAddr = await chainlog.get("ILK_REGISTRY");
  const jugAddr = await chainlog.get("MCD_JUG");
  const ilkReg = await ethers.getContractAt(ilkRegAbi, ilkRegAddr);
  const jug = await ethers.getContractAt(jugAbi, jugAddr);
  const ilks = await ilkReg.list();
  for (const ilk of ilks) {
    console.log(ethers.utils.parseBytes32String(ilk));
    const tx = await jug.drip(
      ilk,
      {gasLimit: 100_000} // tends to underestimate gas
    );
  }
}

test();
