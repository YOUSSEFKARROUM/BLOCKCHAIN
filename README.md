# Decentralized Crowdfunding

A crowdfunding dApp with token-based governance, designed for an Ethereum-compatible test network.

## Core Features

- **Campaigns:** Creators set a funding goal, duration, and beneficiary.
- **Contributions:** Supporters contribute ETH and receive proportional CFD governance tokens (ERC-20).
- **Refunds:** Contributors reclaim their funds when a campaign misses its goal.
- **Governance:** CFD holders vote on early fund releases and freezing suspicious campaigns. Beneficiary withdrawals require governance approval.
- **Interface:** Users browse campaigns, contribute, and vote through MetaMask.

## Architecture & Security

- **Smart contracts:** Solidity and OpenZeppelin for crowdfunding, the CFD token, and governance.
- **Storage:** Campaign metadata on IPFS; its hash stored on-chain.
- **Safeguards:** Snapshot-based voting, role-based access, reentrancy protection, emergency pausing, and at least 2-of-3 multisignature approval for treasury withdrawals above a defined threshold.
- **Deployment:** Sepolia testnet or a local Hardhat network for demonstration.
