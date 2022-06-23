
import * as hre from "hardhat";

const getNetworkName = async() => {
    const [signer] = await hre.ethers.getSigners();
    const network = await signer.provider?.getNetwork();
    let networkName;
    switch (network?.chainId) {
        case 42: {
            networkName = "kovan";
            break;
        }
        case 1337: {
            networkName = "ganache"
            break
        }
        case 5: {
            networkName = "goerli";
            break;
        }
        case 4: {
            networkName = "rinkeby";
            break;
        }
        case 3: {
            networkName = "ropsten";
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
    return networkName
}

export{
    getNetworkName
}