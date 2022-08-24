const hre = require("hardhat");
const ethers = hre.ethers;
const chainlog = require("./chainlog");
const snowflake = require("./snowflake");

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const login = async () => {
  if (!process.env["API_USERNAME"] || !process.env["API_PASSWORD"]) {
    console.error("API_USERNAME and API_PASSWORD env vars not defined");
    process.exit();
  }
  const url = "https://data-api.makerdao.network/v1/login/access-token";
  const params = new URLSearchParams();
  params.append("username", process.env["API_USERNAME"]);
  params.append("password", process.env["API_PASSWORD"]);
  const response = await fetch(url, {method: "post", body: params});
  const data = await response.json();
  const {access_token: token} = data;
  return token;
}

const getUrns = async (token, ilk) => {
  const url = "https://data-api.makerdao.network/v1/vaults/current_state";
  const params = new URLSearchParams();
  params.append("ilk", ilk);
  const authHeader = {Authorization: "Bearer " + token};
  params.append("limit", 1000000);
  const urlWithParams = url + "?" + params.toString();
  console.log(`getting vault addresses for ${ilk}…`);
  const response = await fetch(urlWithParams, {headers: authHeader});
  const vaults = await response.json();
  console.log(`found ${vaults.length} vaults.`);
  const urns = [];
  for (vault of vaults) {
    urns.push(vault.urn);
  }
  return urns;
}

const getUnder = async (ilk, urns, max) => {
  const vatAbi = [
    "function ilks(bytes32) external view returns (uint256,uint256,uint256,uint256,uint256)",
    "function urns(bytes32,address) external view returns (uint256,uint256)"
  ];
  const vatAddr = await chainlog.get("MCD_VAT");
  const vat = await ethers.getContractAt(vatAbi, vatAddr);
  const ilk32 = ethers.utils.formatBytes32String(ilk);
  const [, rate, spot] = await vat.ilks(ilk32);
  let counter = 0;
  const under = [];
  console.log("looking for undercollateralized vaults…");
  for (const urn of urns) {
    const percentage = Math.round(100 * counter++ / urns.length);
    process.stdout.write(`${percentage}% : ${under.length} vaults found\r`);
    const [ink, art] = await vat.urns(ilk32, urn);
    if (art.mul(rate).gt(ink.mul(spot))) {
      under.push(urn);
      if (max && under.length == max) {
        break;
      }
    }
  }
  console.log(under.length + " vaults found.              ");
  return under;
}

const vaults = async (ilk, cropIlks, blockNumber) => {
  if (cropIlks.includes(ilk)) {
    const rows = await snowflake.getCropHolders(blockNumber);
    const urns = [];
    for (const row of rows) {
      const urn = "0x" + row.TOPIC2.substring(2 + 2*12, 2 + 2*32);
      urns.push(urn);
    }
    return urns;
  } else {
    const token = await login();
    const urns = await getUrns(token, ilk);
    return urns;
  }
}

module.exports = {
  list: vaults,
  listUnder: getUnder,
}
