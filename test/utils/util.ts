import { assert } from 'chai';
import { BigNumber, Signer } from 'ethers';
import { ethers, network } from "hardhat";
import { ERC20__factory } from '../../typechain/factories/@openzeppelin/contracts/token/ERC20/ERC20__factory';


const assertRevert = async (
    promise:any, 
    errorMessage = null
    ) => {
    try {
      const tx = await promise;
      const receipt = await ethers.provider.getTransactionReceipt(tx.tx);
      if (receipt.gasUsed.toNumber() >= 6700000) {
        return;
      }
    } catch (error:any) {
      if (errorMessage) {
        assert(error.message.search(errorMessage) >= 0, `Expected ${errorMessage} `);
      }
      const invalidOpcode = error.message.search("revert") >= 0;
      assert(invalidOpcode, "Expected revert, got '" + error + "' instead");
      return;
    }
    assert.ok(false, 'Error containing "revert" must be returned');
  }

const bnFloatMultiplier = (number: BigNumber, multiplier: number) => {
    return number.mul(Math.round(1e10 * multiplier)).div(1e10);
};

const mineBlocks = async (blocks: number): Promise<void> => {
    for (let index = 0; index < blocks; index++) {
        await network.provider.send("evm_mine");
    }
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
    distributeUnderlying,
    assertRevert,
    mineBlocks
}