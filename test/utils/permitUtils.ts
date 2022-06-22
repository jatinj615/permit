import { bufferToHex, keccak256, keccakFromString, toBuffer } from "ethereumjs-util";
import { ethers } from "hardhat";
const PERMIT_TYPEHASH = bufferToHex(
  keccakFromString("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
);

function getDomainSeparator(name:string, tokenAddress:string) {
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
          tokenAddress,
        ],
      ),
    ),
  );
}

exports.getPermitHash = async function getPermitHash(token, owner, spender, value, nonce, deadline) {
  const name = await token.name();

  const DOMAIN_SEPARATOR = getDomainSeparator(name, token.address);
  return keccak256(
    Buffer.concat([
      toBuffer("0x19"),
      toBuffer("0x01"),
      toBuffer(DOMAIN_SEPARATOR),
      keccak256(
        toBuffer(
          ethers.utils.defaultAbiCoder.encode(
            ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
            [PERMIT_TYPEHASH, owner.address, spender.address, value, nonce.toNumber(), deadline.toNumber()],
          ),
        ),
      ),
    ]),
  );
};
