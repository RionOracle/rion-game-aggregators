// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GameOutcomeAggregator {
    address public oracle;
    uint8 public finalOutcome;
    bool public isFinalized;

    mapping(uint8 => uint256) public outcomeTotals;
    mapping(address => mapping(uint8 => uint256)) public userBets;

    event BetPlaced(address indexed user, uint8 outcome, uint256 amount);
    event OutcomeFinalized(uint8 outcome);
    event Claimed(address indexed user, uint256 amount);

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle can call");
        _;
    }

    constructor() {
        oracle = msg.sender;
        isFinalized = false;
    }

    function placeBet(uint8 _outcome) external payable {
        require(!isFinalized, "Betting is closed");
        require(_outcome >= 1 && _outcome <= 3, "Invalid outcome");
        require(msg.value > 0, "Must send BNB");

        userBets[msg.sender][_outcome] += msg.value;
        outcomeTotals[_outcome] += msg.value;

        emit BetPlaced(msg.sender, _outcome, msg.value);
    }

    function finalize(uint8 _outcome) external onlyOracle {
        require(!isFinalized, "Already finalized");
        require(_outcome >= 1 && _outcome <= 3, "Invalid outcome");

        finalOutcome = _outcome;
        isFinalized = true;

        emit OutcomeFinalized(_outcome);
    }

    function claim() external {
        require(isFinalized, "Not finalized yet");

        uint256 userBet = userBets[msg.sender][finalOutcome];
        require(userBet > 0, "No winning bet");

        uint256 totalWinningBets = outcomeTotals[finalOutcome];
        uint256 totalPool = address(this).balance;

        uint256 payout = (userBet * totalPool) / totalWinningBets;

        userBets[msg.sender][finalOutcome] = 0;

        (bool success, ) = msg.sender.call{value: payout}("");
        require(success, "Transfer failed");

        emit Claimed(msg.sender, payout);
    }

    function setOracle(address _newOracle) external onlyOracle {
        oracle = _newOracle;
    }
}
