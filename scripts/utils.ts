
import * as hre from "hardhat";

const chainIds = {
    1337: "ganache",
    5: "goerli",
    42: "kovan",
    1: "mainnet",
    4: "rinkeby",
    3: "ropsten",
  };

const getNetworkName = async() => {
    const [signer] = await hre.ethers.getSigners();
    const network = await signer.provider?.getNetwork();
    let networkName;
    switch (network?.chainId) {
        case 42: {
            networkName = "kovan";
            break;
        }
        case 1: {
            networkName = "mainnet";
            break;
        }
        default: {
            console.log("Unsupported network");
        }
    }
    
}