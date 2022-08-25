hre = require("hardhat");
ethers = hre.ethers;
governance = require("../utils/governance");
chainlog = require("../utils/chainlog");

test = async () => {
  await governance.spell("sendPaymentFromSurplusBuffer(address,uint256)", ["0xb5a865367ba4c637897b269e26ec5e8da91b40da", ethers.BigNumber.from(123)]);
  // end = await chainlog.get("MCD_END");
  // governance.spell("cage(address)", [end]);
  // pip = await chainlog.get("PIP_BAT");
  // await governance.spell("change(address,address)", [pip, "0x18b4633d6e39870f398597f3c1ba8c4a41294966"]);
}

test();
