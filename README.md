# RION Prediction Market Aggregator

[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.19+-yellow)](https://hardhat.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**A reusable, template-based on-chain prediction market platform for decentralized gaming and predictions.**

This repository provides a reference implementation of a decentralized prediction market system built with Solidity and Hardhat. Developers can fork this template and adapt it for different games, sports, or prediction events. The architecture separates game outcome aggregation from market logic, enabling scalability and extensibility.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Deployment](#deployment)
- [Usage & Creating Markets](#usage--creating-markets)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Extending the Template](#extending-the-template)
- [Security & Disclaimer](#security--disclaimer)
- [Contributing](#contributing)

---

## ✨ Features

- **Decentralized Prediction Market**: Users can place bets on game outcomes in a trustless, on-chain environment.
- **GameOutcomeAggregator Contract**: Separate contract for each game/market, handling bet placement and payout distribution.
- **Multi-Market Support**: Deploy multiple aggregators and register them with a central PredictionMarket contract.
- **Oracle-Based Finalization**: Authorized oracle accounts report final outcomes and enable payouts.
- **Proportional Payout Logic**: Winning users receive payouts proportional to their bet relative to the total winning pool.
- **Simple Role System**: Oracle/owner roles for administrative functions; simple access control.
- **Extensible Architecture**: Easily modify payout logic, add new outcome types, or integrate with external oracles.

---

## 🛠 Tech Stack

- **Solidity** (v0.8.20) - Smart contract language
- **Hardhat** (v2.19+) - Ethereum development environment
- **Node.js** - JavaScript runtime for scripts and tools
- **EVM-Compatible Chains** - Primary support for BNB Smart Chain (BSC) Testnet; deployable to any EVM chain

### Supported Networks

- **BNB Smart Chain Testnet** (chainId: 97) - default network
- Other EVM networks via network configuration updates

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** or **pnpm** (npm is included with Node.js)
- A funded wallet for deployment (for BSC Testnet: testnet BNB from a faucet)

Check your Node version:

```bash
node --version
npm --version
```

### Installation

Clone and navigate to the project:

```bash
git clone https://github.com/RionOracle/rion-game-aggregators.git
cd rion-game-aggregators
cd rion-oracle-prediction-market
npm install
```

Or with pnpm:

```bash
pnpm install
```

### Configuration

#### Environment Variables

Create a `.env` file in the `rion-oracle-prediction-market` directory:

```bash
PRIVATE_KEY=<your_private_key_here>
```

⚠️ **SECURITY WARNING**: Never commit your `.env` file or hardcoded private keys to version control. Use environment variables or hardware wallets in production.

#### Hardhat Network Setup

The configuration in `hardhat.config.js` defines the BNB Smart Chain Testnet. To add more networks:

```javascript
networks: {
  bscTestnet: { /* default */ },
  bscMainnet: {
    url: "https://bsc-dataseed.binance.org",
    chainId: 56,
    accounts: [`0x${PRIVATE_KEY}`],
  },
  // Add other networks as needed
}
```

---

## 📦 Deployment

### Compile Contracts

```bash
npx hardhat compile
```

### Deploy All Contracts

The `deploy-complete.js` script deploys 5 GameOutcomeAggregator instances and 1 PredictionMarket contract:

```bash
npx hardhat run scripts/deploy-complete.js --network bscTestnet
```

**What happens during deployment:**

1. **GameOutcomeAggregators**: 5 independent contracts are deployed (one per game).
2. **PredictionMarket**: A central contract is deployed to manage aggregators.
3. **Registration**: All aggregators are registered with the PredictionMarket contract.
4. **Output**: Contract addresses and environment variable names are printed for next steps.

### Deployment Output Example

```
🎉 DEPLOYMENT COMPLETE!

📋 NEW CONTRACT ADDRESSES:

PredictionMarket: 0x...
GameOutcomeAggregators:
  Game 1: 0x...
  Game 2: 0x...
  ...

📝 UPDATE THESE IN VARS SECTION:

NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0x...
NEXT_PUBLIC_GAME_1_AGGREGATOR=0x...
```

---

## 💡 Usage & Creating Markets

### Market Lifecycle

#### 1. **Deployment** (Admin/Owner)

Deploy contracts as described in the [Deployment](#deployment) section. Each GameOutcomeAggregator represents one game/market.

#### 2. **Betting Phase** (Users)

Users place bets on one of three possible outcomes (outcomes 1, 2, or 3) by calling `placeBet()`:

```solidity
// Example (pseudocode)
gameAggregator.placeBet{value: 1000000000000000000}(1);  // 1 BNB on outcome 1
```

**Requirements:**
- Betting is open until `isFinalized == true`
- Users must send BNB with the transaction (`msg.value`)
- Outcome must be 1, 2, or 3

#### 3. **Finalization** (Oracle/Admin)

Once the game concludes, the oracle calls `finalize()` with the actual outcome:

```solidity
gameAggregator.finalize(1);  // Outcome 1 is the result
```

**After finalization:**
- No more bets are accepted
- Only users who bet on outcome 1 are eligible for payouts

#### 4. **Claiming Payouts** (Users)

Winning users call `claim()` to receive their share of the total pool:

```solidity
gameAggregator.claim();
```

**Payout Calculation:**
```
userPayout = (userBet / totalWinningBets) × totalPool
```

Example:
- Total pool: 10 BNB
- Winning outcome total bets: 5 BNB
- Your bet on winning outcome: 1 BNB
- Your payout: (1/5) × 10 = 2 BNB

---

## 🏗 Smart Contract Architecture

### GameOutcomeAggregator

**Purpose**: Manages a single game/prediction market.

**Key Functions:**
- `placeBet(uint8 _outcome)` - Place a bet on an outcome (payable)
- `finalize(uint8 _outcome)` - Finalize the game with a result (oracle only)
- `claim()` - Claim payout if you won the bet
- `setOracle(address _newOracle)` - Change the oracle address (oracle only)

**State Variables:**
- `oracle` - Authorized address that can finalize outcomes
- `finalOutcome` - The winning outcome (1, 2, or 3)
- `isFinalized` - Whether the game has concluded
- `userBets[address][outcome]` - Mapping of user bets per outcome
- `outcomeTotals[outcome]` - Total bets placed on each outcome

**Events:**
- `BetPlaced(address, uint8, uint256)` - Emitted when a bet is placed
- `OutcomeFinalized(uint8)` - Emitted when the outcome is set
- `Claimed(address, uint256)` - Emitted when a user claims a payout

### PredictionMarket

**Purpose**: Central registry and manager for multiple GameOutcomeAggregators.

**Key Functions:**
- `registerAggregator(address)` - Register a new GameOutcomeAggregator (owner only)
- View/query functions to list registered aggregators

---

## 📚 TypeScript SDK

If you want to integrate these contracts from a JavaScript/TypeScript app, use the official Prediction Market SDK:

👉 **npm:** https://www.npmjs.com/package/prediction-market-sdk

```bash
npm install prediction-market-sdk
# or
pnpm add prediction-market-sdk
```

The SDK provides type-safe wrappers for all contract interactions, making it easy to build frontends, bots, or backend services.

---

## 🧩 Extending the Template

### Adding New Sport Types or Games

1. **Modify Outcome Types**: Edit the GameOutcomeAggregator contract to support different numbers of outcomes:

```solidity
// Change from 3 outcomes to more
require(_outcome >= 1 && _outcome <= 5, "Invalid outcome");
```

2. **Deploy New Aggregators**: For each new game, deploy a new GameOutcomeAggregator and register it with PredictionMarket.

### Customizing Payout Logic

Modify the `claim()` function in GameOutcomeAggregator to implement:

- **Flat payout** (fixed reward per bet)
- **Tiered payouts** (better odds for less likely outcomes)
- **Fee deduction** (platform fee before distribution)
- **Time-weighted bets** (bets placed earlier get better odds)

Example (with 5% fee):

```solidity
uint256 feeAmount = (userBet * 5) / 100;
uint256 payout = ((userBet - feeAmount) * totalPool) / totalWinningBets;
```

### Integrating External Oracles

Replace the simple `onlyOracle` modifier with oracle provider libraries:

- **Chainlink Oracle**: Fetch game outcomes directly from Chainlink's feeds
- **Pyth Network**: Use Pyth's sports data feeds
- **Custom Off-Chain Service**: Call your own API via Chainlink Functions or similar

Example stub:

```solidity
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

AggregatorV3Interface internal dataFeed;

function finalizeFromOracle() external {
    ( , int256 outcome, , , ) = dataFeed.latestRoundData();
    finalize(uint8(outcome));
}
```

### Adding More Administrative Roles

Extend access control with role-based permissions:

```solidity
mapping(address => bool) public admins;

modifier onlyAdmin() {
    require(admins[msg.sender], "Only admin");
    _;
}

function setAdmin(address _user, bool _isAdmin) external onlyOracle {
    admins[_user] = _isAdmin;
}
```

---

## 🔒 Security & Disclaimer

⚠️ **This is a reference template, NOT production-ready code.**

- **Not Audited**: This codebase has not undergone professional security audits.
- **Use at Your Own Risk**: Users deploy and use this template entirely at their own risk.
- **Before Mainnet**: Conduct a thorough security review, consider hiring professional auditors, and test extensively on testnets.

### Known Considerations

- **Reentrancy**: The payout function uses a low-level call; ensure proper state management.
- **Oracle Trust**: The system relies on a trusted oracle address. Compromise of this address could lead to incorrect outcomes.
- **Rounding Errors**: Division in payout calculations may result in dust amounts; consider implementing a sweep function.
- **Time-Based Attacks**: Consider adding time-locks for critical operations.

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please ensure:
- Code is well-documented
- Changes do not introduce security vulnerabilities
- Tests pass (if applicable)

---

## 📝 License

This project is open source. Check the repository for specific license details.

---

## 📞 Support & Questions

For questions, issues, or suggestions:

- Open an issue on GitHub
- Check existing documentation in the `/contracts` and `/scripts` directories
- Review the smart contract comments for additional context

---

**Happy deploying! 🚀**
