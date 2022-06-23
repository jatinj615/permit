import * as hre from "hardhat";
import { ContractFactory, Contract } from 'ethers';
import { getNetworkName } from "./utils"

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Permit:ContractFactory = await hre.ethers.getContractFactory("Permit");
  const permit:Contract = await Permit.deploy();

  const tx = await permit.deployed();

  console.log("Permit deployed to:", permit.address);
  
  await sleep(60000);

  // get network name by chain id
  let networkName = await getNetworkName();
  await hre.run("verify:verify", {
    network: networkName,
    address: permit.address,
    constructorArguments: [],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}