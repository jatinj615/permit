import { bufferToHex, keccak256, keccakFromString, toBuffer } from "ethereumjs-util";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { ERC20 } from '../../typechain/@openzeppelin/contracts/token/ERC20/ERC20';

const PERMIT_TYPEHASH = bufferToHex(
  keccakFromString("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
);

function getDomainSeparator(name:string, contractAddress:string) {
    return keccak256(
        toBuffer(
        ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "bytes32", "bytes32", "uint256", "address"],
            [
            bufferToHex(
                keccakFromString("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            ),
            bufferToHex(keccakFromString(name)),
            bufferToHex(keccakFromString("1")),
            1,
            contractAddress,
            ],
        ),
        ),
    );
}

export const getPermitHash = async function getPermitHash(token:ERC20, owner:Signer, spender:Signer, value:BigNumber, nonce:BigNumber, deadline:number, contractAddress:string) {
    const name = await token.name();
    
    const DOMAIN_SEPARATOR = getDomainSeparator(name, contractAddress);
    return keccak256(
        Buffer.concat([
        toBuffer("0x19"),
        toBuffer("0x01"),
        toBuffer(DOMAIN_SEPARATOR),
        keccak256(
            toBuffer(
            ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
                [PERMIT_TYPEHASH, await owner.getAddress(), await spender.getAddress(), value, nonce.toNumber(), deadline],
            ),
            ),
        ),
        ]),
    );
};
