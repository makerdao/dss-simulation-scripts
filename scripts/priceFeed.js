const hre = require("hardhat");
const {ethers} = hre;
const cast = require("./cast");
const chainlog = require("./chainlog");


const getOsm = async ilk => {
  const ilkBytes32 = ethers.utils.formatBytes32String(ilk);
  const ilkRegistryAbi = ["function pip(bytes32) external view returns (address)"];
  const ilkRegistryAddr = await chainlog("ILK_REGISTRY");
  const ilkRegistry = await ethers.getContractAt(ilkRegistryAbi, ilkRegistryAddr);
  const osmAbi = [
    "function src() external view returns (address)",
    "function poke() external"
  ];
  const osmAddr = await ilkRegistry.pip(ilkBytes32);
  const osm = await ethers.getContractAt(osmAbi, osmAddr)
  return osm;
}

const getMedian = async osm => {
  const medianAbi = [
    "function slot(uint8) external view returns (address)",
    "function wat() external view returns (bytes32)",
    "function bar() external view returns (uint256)",
    "function poke(uint256[] val, uint256[] age, uint8[] v, bytes32[] r, bytes32[] s)",
  ];
  const medianAddr = await osm.src();
  const median = await ethers.getContractAt(medianAbi, medianAddr);
  return median;
}

const dropOracles = async median => {
  const oracles = [];
  const message = `finding current oracles…`;
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
  await cast("drop(address,address[])", [median.address, oracles]);
}

const liftSigners = async median => {
  console.log("getting singer addresses…");
  const signers = await ethers.getSigners();
  const signerAddrs = [];
  signers.forEach(signer => signerAddrs.push(signer.address));
  console.log("lifting signers…");
  await cast("lift(address,address[])", [median.address, signerAddrs]);
  return signers;
}

const pokeMedian = async (median, signers, value) => {
  const wad = ethers.BigNumber.from(10).pow(18);
  const val = ethers.BigNumber.from(value).mul(wad);
  const block = await ethers.provider.getBlock();
  const age = block.timestamp;
  const wat = await median.wat();
  const types = ["uint256", "uint256", "bytes32"];
  const data = ethers.utils.solidityPack(types, [val, age, wat]);
  const dataHash = ethers.utils.keccak256(data);
  const dataHashBytes = ethers.utils.arrayify(dataHash);
  const vs = [];
  const rs = [];
  const ss = [];
  console.log("signing new price feeds…");
  const bar = (await median.bar()).toNumber();
  for (let i = 0; i < bar; i++) {
    const signer = signers[i];
    const rawSignature = await signer.signMessage(dataHashBytes);
    const signature = ethers.utils.splitSignature(rawSignature);
    vs.push(signature.v);
    rs.push(signature.r);
    ss.push(signature.s);
  }
  const vals = new Array(bar).fill(val);
  const ages = new Array(bar).fill(age);
  console.log("poking new price into the median…");
  await median.poke(vals, ages, vs, rs, ss);
}

const pokeOsm = async osm => {
  await osm.poke();
  await hre.network.provider.request({
    method: "evm_increaseTime",
    params: [3600],
  });
  await osm.poke();
}

const pokeSpotter = async ilk => {
  console.log("poking the spotter…");
  const ilkBytes32 = ethers.utils.formatBytes32String(ilk);
  const spotterAbi = ["function poke(bytes32) external"];
  const spotterAddr = await chainlog("MCD_SPOT");
  const spotter = await ethers.getContractAt(spotterAbi, spotterAddr);
  await spotter.poke(ilkBytes32);
}

const priceFeed = async (ilk, value) => {
  console.log(`setting new price ${value} for ilk ${ilk}…`);
  const osm = await getOsm(ilk);
  const median = await getMedian(osm);
  await dropOracles(median);
  const signers = await liftSigners(median);
  await pokeMedian(median, signers, value);
  await pokeOsm(osm);
  await pokeSpotter(ilk);
  console.log("new price set.");
}

module.exports = priceFeed;
