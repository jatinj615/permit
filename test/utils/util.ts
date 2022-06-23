import { BigNumber, Signer } from 'ethers';
import { ethers, network } from "hardhat";
import { ERC20__factory } from '../../typechain/factories/@openzeppelin/contracts/token/ERC20/ERC20__factory';


const bnFloatMultiplier = (number: BigNumber, multiplier: number) => {
    return number.mul(Math.round(1e10 * multiplier)).div(1e10);
};


const distributeUnderlying = async (
    underlying:string, 
    account:string
) :Promise<Signer[]> => {
    const accounts = await ethers.getSigners();
    
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [account],
    });
    
    const signer = ethers.provider.getSigner(account);

    const ERC20Factory = new ERC20__factory(signer);
    const underlyingERC20 = ERC20Factory.attach(underlying);
    const balance = await underlyingERC20.balanceOf(account);
    const decimals = await underlyingERC20.decimals();
    const one = ethers.utils.parseUnits("1", decimals);
    const amountToDistribute = balance.div(accounts.length);

    for (let i = 0; i < accounts.length; i++) {
        const tx = await underlyingERC20.connect(signer).transfer(accounts[i].address, amountToDistribute)
    }
    return accounts;
}

export {
    bnFloatMultiplier,
    distributeUnderlying
}