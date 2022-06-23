// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract Permit is Ownable{
    using SafeERC20 for ERC20;

    // mapping from owner to underlying ERC20 nonce
    mapping (address => mapping(address => uint256)) private _nonces;

    // keccak256("Permit(address owner, address spender, uint256 value, uint256 nonce, uint256 deadline)")
    bytes32 public constant PERMIT_TYPEHASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;

    // Mapping from underlying ERC20 to domainHash
    mapping (address => bytes32) domainsAllowed;

    // modifier to check if domain is allowed
    modifier isDomainAllowed(address tokenAddress) {
        require(domainsAllowed[tokenAddress] != bytes32(0x00), "ERR_DOMAIN_NOT_ALLOWED");
        _;
    }

    // event for new domain allowed
    event DomainAllowed(address erc20Address);

    /**
     * @dev function to add domainHash for underlying ERC20
     * @param erc20Address : address of underlyin ERC20 token
     */
    function allowDomain(address erc20Address) external onlyOwner {
        uint256 chainID;
        assembly {
            chainID := chainid()
        }

        string memory name = ERC20(erc20Address).name();
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes("1")), // Version
                chainID,
                address(this)
            )
        );
        domainsAllowed[erc20Address] = domainSeparator;
        emit DomainAllowed(erc20Address);
    }

    /**
     * @dev check the owner signed message and transfer underlying
     *      token from owner to spender.
     * Requirements :
     * - owner must give max allowance to this Permit contract before 
     *   calling permit.
     * @param erc20Address : address of underlying ERC20
     * @param owner: address of owner
     * @param spender: address of spender
     * @param amount: amount of underlying token to transfer
     * @param deadline: timestamp after which signature is expired
     * @param v, r, s : owner signature params
     */
    function permit(
        address erc20Address,
        address owner,
        address spender,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public isDomainAllowed(erc20Address) {
        // check if signature is expired
        require(block.timestamp <= deadline, "ERR_SIGNATURE_EXPIRED");
        bytes32 hashStruct =
            keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, amount, _nonces[owner][erc20Address], deadline));
        bytes32 _hash = keccak256(abi.encodePacked(uint16(0x1901), domainsAllowed[erc20Address], hashStruct));

        address signer = ecrecover(_hash, v, r, s);
        require(signer != address(0) && signer == owner, "ERR_INVALID_SIGNATURE");

        _nonces[owner][erc20Address]++;

        ERC20(erc20Address).safeTransferFrom(owner, spender, amount);
    }
    
    /**
     * @dev returns current nonce of owner for underlying ERC20
     * @param erc20Address: address of underlying ERC20
     * @param owner: address of owner
     */
    function nonces(address erc20Address, address owner) public view returns (uint256) {
        return _nonces[owner][erc20Address];
    }

}



