hre = require("hardhat");
ethers = hre.ethers;
governance = require("../utils/governance");
chainlog = require("../utils/chainlog");

test = async () => {
  // governance.spell("sendoPaymentFromSurplusBuffer(address,uint256)", ["0xb5a865367ba4c637897b269e26ec5e8da91b40da", 123]);
  end = await chainlog.get("MCD_END");
  governance.spell("cage(address,address)", [end,end]);
}

test();
