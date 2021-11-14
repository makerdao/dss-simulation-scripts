#!/usr/bin/env node

require('hardhat')
const { formatEther, parseUnits } = require('@ethersproject/units');
// const { ethers } = require('ethers');
const hre = require('hardhat');
const ethers = hre.ethers;

const COMP_ADDRESS = '0xc00e94cb662c3520282e6f5717214004a7f26888'
const COMPTROLLER_ADDRESS = '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B'
const COMP_TRES_ADDRESS = '0x2775b1c75658be0f640272ccb8c72ac986009e38'
// const USER_ADDRESS = ''
const USER_ADDRESS = '0x3af015f6e3ac79d217198f00ef36af099d223e29'

async function main() {
  console.log('Tests on fork mode!')

  // const comp = (hre.ethers.getContractAt('Dai', COMP_ADDRESS) as any) as Dai
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [USER_ADDRESS],
  });

  const userSigner = await hre.ethers.getSigner(USER_ADDRESS)
  const compToken = new ethers.Contract(COMP_ADDRESS, require('../abi/comp.json'), userSigner)
  const comptroller = new ethers.Contract(COMPTROLLER_ADDRESS, require('../abi/comptroller.json'), userSigner)
  const tres = new ethers.Contract(COMP_TRES_ADDRESS, require('../abi/tres.json'), userSigner)

  console.log('COMP balance user: ', formatBalance(await compToken.balanceOf(userSigner.address)))
  console.log('COMP balance comptroller: ', formatBalance(await compToken.balanceOf(comptroller.address)))
  // console.log('Comp accrued: ', await comptroller['compAccrued'](userSigner.address, { gasLimit: 10000000 }))
  await tres.drip()
  console.log('DRIP DONE')
  await comptroller
    .connect(userSigner)
    ['claimComp(address,address[])'](userSigner.address, ['0x4B0181102A0112A2ef11AbEE5563bb4a3176c9d7']);
  console.log('COMP balance comptroller: ', formatBalance(await compToken.balanceOf(comptroller.address)))
  console.log('COMP balance user: ', formatBalance(await compToken.balanceOf(userSigner.address)))
}

main()
  .then(() => console.log('DONE'))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

function formatBalance(balance) {
  const balanceIneth = formatEther(balance.toString()).toString()
  return balanceIneth
}