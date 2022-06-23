import { assert, expect } from "chai";
import { ethers } from "hardhat";
import { bufferToHex, keccakFromString, ecsign, toBuffer } from "ethereumjs-util";
import { Contract, Signer, ContractFactory } from 'ethers';
import * as readline from "readline-sync";
import { distributeUnderlying, assertRevert, mineBlocks } from './utils/util';
import { getPermitHash } from "./utils/permitUtils";
import { ERC20__factory } from "../typechain/factories/@openzeppelin/contracts/token/ERC20/ERC20__factory";
import { ERC20 } from '../typechain/@openzeppelin/contracts/token/ERC20/ERC20';

// private key of hardhat account. Should never use private key in Prod.
const OWNER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; 

describe("Deploys permit Contract and run tests", () =>{
    let permitContract:Contract;
    let accounts:Signer[];
    let owner:Signer;
    let tokenAddress:string;
    let impersonated_account:string;
    let underlyingERC20:ERC20;

    before(async () => {
        const Permit:ContractFactory = await ethers.getContractFactory("Permit");
        tokenAddress = readline.question("Underlying ERC20 address : ");
        impersonated_account = readline.question("Account address containing underlying : ");
        permitContract = await Permit.deploy();
        await permitContract.deployed();
        accounts = await distributeUnderlying(tokenAddress, impersonated_account);
        owner = accounts[0];
        const ERC20Factory = new ERC20__factory(owner);
        underlyingERC20 = ERC20Factory.attach(tokenAddress);
    });

    it("should revert on permit with not allowed domain", async() =>{
        const user1 = accounts[1];
        const amount = ethers.utils.parseEther("100");
        const nonce = await permitContract.nonces(tokenAddress, user1.getAddress());
        const deadline = ethers.BigNumber.from("99999999999999"); // random timestamp in future
        const hash = await getPermitHash(underlyingERC20, owner, user1, amount, nonce, deadline.toNumber(), permitContract.address);
        const sig = ecsign(toBuffer(hash), toBuffer(OWNER_PRIVATE_KEY));
        
        let result = permitContract.permit(
            tokenAddress, 
            await owner.getAddress(), 
            await user1.getAddress(), 
            amount,
            deadline,
            sig.v,
            sig.r,
            sig.s);
        await expect(result).to.revertedWith("ERR_DOMAIN_NOT_ALLOWED");
    });

    it("should revert on adding domain separator for underlying with non owner", async () => {
        const nonOwner = accounts[2];
        const tx = permitContract.connect(nonOwner).allowDomain(tokenAddress);
        await expect(tx).to.revertedWith("Ownable: caller is not the owner")
    });

    it("should successfully add domain separator with owner", async() => {
        await permitContract.connect(owner).allowDomain(tokenAddress);
    });

    it("should revert on expired signature", async() => {
        const user1 = accounts[1];
        const amount = ethers.utils.parseEther("100");
        const nonce = await permitContract.nonces(tokenAddress, user1.getAddress());
        const currentTimestamp = Math.round(Date.now() / 1000) // current timestamp in seconds
        const deadline = ethers.BigNumber.from(currentTimestamp);
        const hash = await getPermitHash(underlyingERC20, owner, user1, amount, nonce, currentTimestamp, permitContract.address);
        const sig = ecsign(toBuffer(hash), toBuffer(OWNER_PRIVATE_KEY));
        
        // mine blocks to expire the signature
        await mineBlocks(300);
        const tx = permitContract.permit(
            tokenAddress, 
            await owner.getAddress(), 
            await user1.getAddress(), 
            amount,
            deadline,
            sig.v,
            sig.r,
            sig.s);
        await expect(tx).to.revertedWith("ERR_SIGNATURE_EXPIRED");
    });

    it("should revert with wrong data in hash", async () => {
        const user1 = accounts[1];
        const amount = ethers.utils.parseEther("100");
        const nonce = await permitContract.nonces(tokenAddress, user1.getAddress());
        const deadline = ethers.BigNumber.from("99999999999999"); // random timestamp in future
        const hash = await getPermitHash(underlyingERC20, user1, owner, amount, nonce, deadline.toNumber(), permitContract.address); // generating wrong hash
        const sig = ecsign(toBuffer(hash), toBuffer(OWNER_PRIVATE_KEY));
        
        let tx = permitContract.permit(
            tokenAddress, 
            await owner.getAddress(), 
            await user1.getAddress(), 
            amount,
            deadline,
            sig.v,
            sig.r,
            sig.s);
            await expect(tx).to.revertedWith("ERR_INVALID_SIGNATURE");
    });

    it("should revert on try to permit without max allowance", async () => {
        const user1 = accounts[1];
        const amount = ethers.utils.parseEther("100");
        const nonce = await permitContract.nonces(tokenAddress, user1.getAddress());
        const deadline = ethers.BigNumber.from("99999999999999"); // random timestamp in future
        const hash = await getPermitHash(underlyingERC20, owner, user1, amount, nonce, deadline.toNumber(), permitContract.address);
        const sig = ecsign(toBuffer(hash), toBuffer(OWNER_PRIVATE_KEY));
        
        let result = permitContract.permit(
            tokenAddress, 
            await owner.getAddress(), 
            await user1.getAddress(), 
            amount,
            deadline,
            sig.v,
            sig.r,
            sig.s);
        await assertRevert(result);
    });

    it("should give max allowance and perform permit transfer of underlying", async() => {

    });
})