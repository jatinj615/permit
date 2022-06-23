import { assert } from "chai";
import { ethers } from "hardhat";
import { bufferToHex, keccakFromString, ecsign, toBuffer } from "ethereumjs-util";
import { Contract, Signer, ContractFactory } from 'ethers';
import * as readline from "readline-sync";
import { distributeUnderlying } from './utils/util';
import { ERC20__factory } from "../typechain/factories/@openzeppelin/contracts/token/ERC20/ERC20__factory";
import { ERC20 } from '../typechain/@openzeppelin/contracts/token/ERC20/ERC20';

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

    it("should try to permit without max approval to permit contract", async() =>{
        const user1 = accounts[1];
        const amount = ethers.utils.parseEther("100");
        const nonce = await permitContract.nonces(tokenAddress, user1.getAddress());
        const deadline = ethers.BigNumber.from("99999999999999"); // random timestamp in future
        
    });
})