# Permit wrapper for ERC20

## Problem Statement
ERC2612 allows for gasless approvals for ERC20 via signatures. 
While many ERC20 tokens now incorporate permits, many do not. 
contract which serves as a wrapper to an ERC20 and allows permits.

## Proposed Solution
Created a singleton contract which implements permit and relies on max allowance.<br>
After the user gives max allowance to <code>address(this)</code> user can send a signature with <code>permit</code> method which checks the signature and transfers the tokens using <code>safeTransferFrom</code> method from <code>SafeERC20</code>.

<b>Deployed and verified <code>Permit</code> contract address on kovan</b> <a href="https://kovan.etherscan.io/address/0x94957f401867c326d814135ec0f0F1Afda67c8c7#code">link</a>
```shell
0x94957f401867c326d814135ec0f0F1Afda67c8c7
```
## Setup project
1. Clone the repository
   ```shell
   git clone https://github.com/jatinj615/permit.git
   cd permit
   ```
2. create <code>.env</code> file and set environment variables 
   ```shell
    touch .env

    // structure of env file
    ALCHEMY_API_KEY=<YOUR_ALCHEMY_KEY> // can use - GuY3V68erOgOioj6jYTGb1IfkJCIxhLH
    MNEMONIC=<YOUR_MNEMONIC_PRIVATE_KEY>
    OWNER_PRIVATE_KEY=<YOUR_OWNER_PRIVATE_KEY>
   ```

   refer to <code>.env.example</code> file for refrence.</br>

   To get <code>OWNER_PRIVATE_KEY</code> run 
   ```shell
   npx hardhat node

   // Ouput
   Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 //OWNER_PRIVATE_KEY(must be of Account #0)
   ```
3. Install the dependencies
   ```shell
   npm install
   ```
4. Compile the code
   ```shell
   npx hardhat compile
   ```

### Run Test cases
```shell
npx hardhat test
```

### Deploy Contract
```shell
npx hardhat run scripts/deployer.ts --network <network_name>
```

