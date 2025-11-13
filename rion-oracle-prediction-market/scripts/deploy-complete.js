const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting complete fresh deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    (await hre.ethers.provider.getBalance(deployer.address)).toString()
  );

  // Deploy 5 new GameOutcomeAggregator contracts
  const aggregators = [];
  const gameNames = ["Game 1", "Game 2", "Game 3", "Game 4", "Game 5"];

  console.log("\n📦 Deploying GameOutcomeAggregator contracts...");
  const GameOutcomeAggregator = await hre.ethers.getContractFactory(
    "GameOutcomeAggregator"
  );

  for (let i = 0; i < 5; i++) {
    console.log(`\nDeploying ${gameNames[i]}...`);
    const aggregator = await GameOutcomeAggregator.deploy();
    await aggregator.waitForDeployment();
    const address = await aggregator.getAddress();
    aggregators.push(address);
    console.log(`✅ ${gameNames[i]} deployed to:`, address);
  }

  // Deploy PredictionMarket
  console.log("\n📦 Deploying PredictionMarket contract...");
  const PredictionMarket = await hre.ethers.getContractFactory(
    "PredictionMarket"
  );
  const predictionMarket = await PredictionMarket.deploy();
  await predictionMarket.waitForDeployment();
  const pmAddress = await predictionMarket.getAddress();
  console.log("✅ PredictionMarket deployed to:", pmAddress);

  // Wait for confirmations
  console.log("\n⏳ Waiting for block confirmations...");
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Register all aggregators
  console.log("\n📋 Registering aggregators to PredictionMarket...");
  for (let i = 0; i < aggregators.length; i++) {
    console.log(`Registering ${gameNames[i]}: ${aggregators[i]}`);
    const tx = await predictionMarket.registerAggregator(aggregators[i]);
    await tx.wait();
    console.log(`✅ Registered! TX: ${tx.hash}`);
  }

  // Print summary
  console.log("\n\n🎉 DEPLOYMENT COMPLETE!\n");
  console.log("=".repeat(60));
  console.log("\n📋 NEW CONTRACT ADDRESSES:\n");
  console.log("PredictionMarket:", pmAddress);
  console.log("\nGameOutcomeAggregators:");
  for (let i = 0; i < aggregators.length; i++) {
    console.log(`  ${gameNames[i]}:`, aggregators[i]);
  }

  console.log("\n\n📝 UPDATE THESE IN  VARS SECTION:\n");
  console.log(`NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=${pmAddress}`);
  console.log(`NEXT_PUBLIC_GAME_1_AGGREGATOR=${aggregators[0]}`);
  console.log(`NEXT_PUBLIC_GAME_2_AGGREGATOR=${aggregators[1]}`);
  console.log(`NEXT_PUBLIC_GAME_3_AGGREGATOR=${aggregators[2]}`);
  console.log(`NEXT_PUBLIC_GAME_4_AGGREGATOR=${aggregators[3]}`);
  console.log(`NEXT_PUBLIC_GAME_5_AGGREGATOR=${aggregators[4]}`);

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ All aggregators are registered and ready for betting!");
  console.log("🎯 Next step: Add THE_ODDS_API_KEY to fetch real NBA games\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
