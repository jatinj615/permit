import { assert } from "chai";
import { ethers } from "hardhat";
import { bufferToHex, keccakFromString, ecsign, toBuffer } from "ethereumjs-util";
import { Contract, Signer, ContractFactory } from 'ethers';


describe("Deploys permit Contract and run tests", () =>{
    let permitContract:Contract;
    let accounts:Signer[];
    let owner:Signer;
    let tokenAddress:String = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // dai address, change token address with any ERC20 address

    before(async () => {
        accounts = await ethers.getSigners();
        owner = accounts[0];
        const Permit:ContractFactory = await ethers.getContractFactory("Permit");
        permitContract = await Permit.deploy();
        await permitContract.deployed();
    });

    it("should try to permit without max approval to permit contract", async() =>{
        const user1 = accounts[1];
        const amount = ethers.utils.parseEther("100");
        const nonce = await permitContract.nonces(tokenAddress, user1.getAddress());
        const deadline = ethers.BigNumber.from("99999999999999"); // random timestamp in future
        
    });
})