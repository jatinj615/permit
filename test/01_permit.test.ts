import { assert, expect } from "chai";
import { ethers } from "hardhat";
import { bufferToHex, keccakFromString, ecsign, toBuffer } from "ethereumjs-util";
import { Contract, Signer, ContractFactory, BigNumber } from 'ethers';
import * as readline from "readline-sync";
import { distributeUnderlying, assertRevert, mineBlocks } from './utils/util';
import { getPermitHash } from "./utils/permitUtils";
import { ERC20__factory } from "../typechain/factories/@openzeppelin/contracts/token/ERC20/ERC20__factory";
import { ERC20 } from '../typechain/@openzeppelin/contracts/token/ERC20/ERC20';
import { ownerPrivateKey } from "../hardhat.config";
describe("Deploys permit Contract and run tests", () =>{
    let permitContract:Contract;
    let accounts:Signer[];
    let owner:Signer;
    let tokenAddress:string;
    let impersonated_account:string;
    let underlyingERC20:ERC20;
    let user: Signer; // using for spender account
    let amount: BigNumber; // amount to transfer
    let deadline: BigNumber; // deadline for signature expiry

    before(async () => {
        const Permit:ContractFactory = await ethers.getContractFactory("Permit");
        tokenAddress = readline.question("Underlying ERC20 address : ");
        impersonated_account = readline.question("Account address containing underlying : ");
        permitContract = await Permit.deploy();
        await permitContract.deployed();
        accounts = await distributeUnderlying(tokenAddress, impersonated_account);
        
        // assign owner account
        owner = accounts[0];

        // create underlying ERC20 Instance
        const ERC20Factory = new ERC20__factory(owner);
        underlyingERC20 = ERC20Factory.attach(tokenAddress);

        // populate data for testcases
        user = accounts[1];
        amount = ethers.utils.parseEther("100");
        deadline = ethers.BigNumber.from("99999999999999"); // random timestamp in future
    });

    it("should revert on expired signature", async() => {
        const nonce = await permitContract.nonces(tokenAddress, await owner.getAddress());
        const currentTimestamp = Math.round(Date.now() / 1000) // current timestamp in seconds
        const hash = await getPermitHash(underlyingERC20, owner, user, amount, nonce, currentTimestamp, permitContract.address);
        const sig = ecsign(toBuffer(hash), toBuffer(ownerPrivateKey));
        
        // mine blocks to expire the signature
        await mineBlocks(300);

        const tx = permitContract.permit(
            tokenAddress, 
            await owner.getAddress(), 
            await user.getAddress(), 
            amount,
            ethers.BigNumber.from(currentTimestamp),
            sig.v,
            sig.r,
            sig.s);

        await expect(tx).to.be.revertedWith("ERR_SIGNATURE_EXPIRED");
    });

    it("should revert with wrong data in hash", async () => {
        const nonce = await permitContract.nonces(tokenAddress, await owner.getAddress());
        const hash = await getPermitHash(underlyingERC20, user, owner, amount, nonce, deadline.toNumber(), permitContract.address); // generating wrong hash
        const sig = ecsign(toBuffer(hash), toBuffer(ownerPrivateKey));
        
        let tx = permitContract.permit(
            tokenAddress, 
            await owner.getAddress(), 
            await user.getAddress(), 
            amount,
            deadline,
            sig.v,
            sig.r,
            sig.s);

        await expect(tx).to.be.revertedWith("ERR_INVALID_SIGNATURE");
    });

    it("should revert on try to permit without max allowance", async () => {
        const nonce = await permitContract.nonces(tokenAddress, await owner.getAddress());
        const hash = await getPermitHash(underlyingERC20, owner, user, amount, nonce, deadline.toNumber(), permitContract.address);
        const sig = ecsign(toBuffer(hash), toBuffer(ownerPrivateKey));
        
        let result = permitContract.permit(
            tokenAddress, 
            await owner.getAddress(), 
            await user.getAddress(), 
            amount,
            deadline,
            sig.v,
            sig.r,
            sig.s);
            
        await assertRevert(result);
    });

    it("should give max allowance and perform permit transfer of underlying", async() => {
        
        // Give max allowance to permit contract
        await underlyingERC20.connect(owner).approve(permitContract.address, ethers.constants.MaxUint256);
        
        const nonce = await permitContract.nonces(tokenAddress, await owner.getAddress());
        const hash = await getPermitHash(underlyingERC20, owner, user, amount, nonce, deadline.toNumber(), permitContract.address);
        const sig = ecsign(toBuffer(hash), toBuffer(ownerPrivateKey));

        const balanceBefore = await underlyingERC20.balanceOf(await user.getAddress());

        let result = await permitContract.permit(
            tokenAddress, 
            await owner.getAddress(), 
            await user.getAddress(), 
            amount,
            deadline,
            sig.v,
            sig.r,
            sig.s);
        
        const balanceAfter = await underlyingERC20.balanceOf(await user.getAddress());

        expect(balanceAfter.sub(balanceBefore)).to.be.equal(amount);
    });

    it("should revert on try to replay the signature",async () => {
        // no need to approve again as max allowance is already given

        const nonce = await permitContract.nonces(tokenAddress, await owner.getAddress());
        const hash = await getPermitHash(underlyingERC20, owner, user, amount, nonce, deadline.toNumber(), permitContract.address);
        const sig = ecsign(toBuffer(hash), toBuffer(ownerPrivateKey));

        // first transaction should succeed
        await permitContract.permit(
            tokenAddress, 
            await owner.getAddress(), 
            await user.getAddress(), 
            amount,
            deadline,
            sig.v,
            sig.r,
            sig.s);
        
        // replay transaction should fail
        let result2 = permitContract.permit(
            tokenAddress,
            await owner.getAddress(), 
            await user.getAddress(), 
            amount,
            deadline,
            sig.v,
            sig.r,
            sig.s);
        
        await expect(result2).to.be.revertedWith("ERR_INVALID_SIGNATURE");
    });
})