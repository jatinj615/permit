# Permit wrapper for ERC20

## Problem Statement
ERC2612 allows for gasless approvals for ERC20 via signatures. 
While many ERC20 tokens now incorporate permits, many do not. 
contract which serves as a wrapper to an ERC20 and allows permits.

## Proposed Solution
Created a singleton contract which implements permit and relies on max allowance.<br>
After user give max allowance to <code>address(this)</code> user can send a signature with <code>permit</code> method which will check the signature and transfer the tokens using <code>safeTransferFrom</code> method from <code>SafeERC20</code>.

<b>Deployed and verified <code>Permit</code> contract address on kovan</b>
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
    ONWER_PRIVATE_KEY=<YOUR_OWNER_PRIVATE_KEY>
   ```

   refer to <code>.env.example</code> file for refrence.</br>



3. Install the dependencies
   ```shell
   npm install
   ```
4. Run test cases
   ```shell
   npx hardhat test
   ```

