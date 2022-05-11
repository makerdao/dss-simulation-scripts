const hre = require("hardhat");
const {ethers} = hre;
const cast = require("./cast");


const priceFeed = async () => {
  const medianAbi = [
    "function slot(uint8) external view returns (address)",
    "function poke(uint256[] val, uint256[] age, uint8[] v, bytes32[] r, bytes32[] s)",
  ];
  const medianAddr = "0x64DE91F5A373Cd4c28de3600cB34C7C6cE410C85"; // TODO: obtain from ilk registry
  const median = await ethers.getContractAt(medianAbi, medianAddr);
  const oracles = [];
  const message = `finding oracles…`;
  for (let i = 0; i < 256; i++) {
    const progress = Math.round(100 * (i+1) / 256);
    process.stdout.write(`${message} ${progress}% - found ${oracles.length} oracles\r`);
    const oracle = await median.slot(i);
    if (oracle !== ethers.constants.AddressZero) {
      oracles.push(oracle);
    }
  }
  console.log("");
  console.log("dropping oracles…");
  await cast("drop(address,address[])", [medianAddr, oracles]);
  console.log("getting singer addresses…");
  const signers = await ethers.getSigners();
  const signerAddrs = [];
  signers.forEach(signer => signerAddrs.push(signer.address));
  console.log("lifting signers…");
  await cast("lift(address,address[])", [medianAddr, signerAddrs]);
  const wad = ethers.BigNumber.from(10).pow(18);
  const val = ethers.BigNumber.from(3632).mul(wad);
  const age = Math.round(Date.now() / 1000);
  const wat = ethers.utils.formatBytes32String("ETHUSD"); // TODO: make this generalizable
  const types = ["uint256", "uint256", "bytes32"];
  const data = ethers.utils.solidityPack(types, [val, age, wat]);
  const dataHash = ethers.utils.keccak256(data);
  const dataHashBytes = ethers.utils.arrayify(dataHash);
  const vs = [];
  const rs = [];
  const ss = [];
  console.log("signing new price feeds…");
  for (let i = 0; i < 13; i++) { // TODO: get bar from median
    const signer = signers[i];
    const rawSignature = await signer.signMessage(dataHashBytes);
    const signature = ethers.utils.splitSignature(rawSignature);
    vs.push(signature.v);
    rs.push(signature.r);
    ss.push(signature.s);
  }
  const vals = new Array(13).fill(val);
  const ages = new Array(13).fill(age);
  console.log("poking new price into the median…");
  await median.poke(vals, ages, vs, rs, ss);
}

priceFeed();
