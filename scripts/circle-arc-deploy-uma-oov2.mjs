import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import { encodeFunctionData } from "viem";
import { loadDeployEnv, optionalEnv, printEnvBlock, requireEnv } from "./circle-arc-env.mjs";

loadDeployEnv();

const root = process.cwd();
const apiKey = requireEnv("CIRCLE_API_KEY");
const entitySecret = requireEnv("CIRCLE_ENTITY_SECRET");
const walletId = requireEnv("CIRCLE_ARC_WALLET_ID");
const livenessSeconds = optionalEnv("ARC_UMA_LIVENESS_SECONDS") || "60";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ooV2TimerAddress = optionalEnv("ARC_UMA_OOV2_TIMER_ADDRESS") || ZERO_ADDRESS;

const walletClient = initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });
const contractClient = initiateSmartContractPlatformClient({ apiKey, entitySecret });

const UMA_ARTIFACT_ROOT = "node_modules/@uma/contracts-node/dist/packages/core/artifacts/contracts";

const artifacts = {
  Timer: `${UMA_ARTIFACT_ROOT}/common/implementation/Timer.sol/Timer.json`,
  Finder: `${UMA_ARTIFACT_ROOT}/data-verification-mechanism/implementation/Finder.sol/Finder.json`,
  IdentifierWhitelist: `${UMA_ARTIFACT_ROOT}/data-verification-mechanism/implementation/IdentifierWhitelist.sol/IdentifierWhitelist.json`,
  AddressWhitelist: `${UMA_ARTIFACT_ROOT}/common/implementation/AddressWhitelist.sol/AddressWhitelist.json`,
  Store: `${UMA_ARTIFACT_ROOT}/data-verification-mechanism/implementation/Store.sol/Store.json`,
  TestnetERC20: `${UMA_ARTIFACT_ROOT}/common/implementation/TestnetERC20.sol/TestnetERC20.json`,
  MockOracleAncillary: `${UMA_ARTIFACT_ROOT}/data-verification-mechanism/test/MockOracleAncillary.sol/MockOracleAncillary.json`,
  OptimisticOracleV2: `${UMA_ARTIFACT_ROOT}/optimistic-oracle-v2/implementation/OptimisticOracleV2.sol/OptimisticOracleV2.json`,
  ArcUmaOOV2Resolver: "contracts/arc/out/ArcUmaOOV2Resolver.sol/ArcUmaOOV2Resolver.json",
  NoMarketArc: "contracts/arc/out/NoMarketArc.sol/NoMarketArc.json"
};

function readArtifact(relativePath) {
  const artifact = JSON.parse(readFileSync(join(root, relativePath), "utf8"));
  const bytecode = typeof artifact.bytecode === "string" ? artifact.bytecode : artifact.bytecode?.object;
  if (!artifact.abi || !bytecode || bytecode === "0x") {
    throw new Error(`Invalid artifact at ${relativePath}. Run npm run contracts:arc:build first.`);
  }
  return { abi: artifact.abi, bytecode: bytecode.startsWith("0x") ? bytecode : `0x${bytecode}` };
}

function bytes32(value) {
  const encoded = Buffer.from(value, "utf8");
  if (encoded.length > 32) throw new Error(`${value} is longer than bytes32.`);
  return `0x${encoded.toString("hex").padEnd(64, "0")}`;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForTransaction(transactionId, label) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await walletClient.getTransaction({ id: transactionId });
    const transaction = response.data?.transaction;
    const state = transaction?.state;
    if (state === "COMPLETE" || state === "CONFIRMED") return transaction;
    if (state === "FAILED" || state === "CANCELLED" || state === "DENIED") {
      throw new Error(`${label} transaction ended in state ${state}.`);
    }
    await sleep(5_000);
  }
  throw new Error(`${label} transaction did not complete within 5 minutes.`);
}

async function waitForContract(contractId, label) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await contractClient.getContract({ id: contractId });
    const contract = response.data?.contract;
    if (contract?.contractAddress && contract.status === "COMPLETE") return contract;
    if (contract?.status === "FAILED") throw new Error(`${label} contract deployment failed.`);
    await sleep(5_000);
  }
  throw new Error(`${label} contract address was not available within 5 minutes.`);
}

async function deployArtifact({ artifactPath, name, description, constructorParameters }) {
  const artifact = readArtifact(artifactPath);
  console.log(`Deploying ${name}...`);
  const response = await contractClient.deployContract({
    idempotencyKey: randomUUID(),
    name,
    description,
    blockchain: "ARC-TESTNET",
    walletId,
    abiJson: JSON.stringify(artifact.abi),
    bytecode: artifact.bytecode,
    constructorParameters,
    fee: { type: "level", config: { feeLevel: "MEDIUM" } }
  });
  const contractId = response.data?.contractId;
  const transactionId = response.data?.transactionId;
  if (!contractId || !transactionId) {
    throw new Error(`Circle did not return contractId/transactionId for ${name}.`);
  }
  const transaction = await waitForTransaction(transactionId, name);
  const contract = await waitForContract(contractId, name);
  console.log(`${name}: ${contract.contractAddress}`);
  return { contractId, transactionId, transaction, contract };
}

async function executeContract({ contractAddress, abi, functionName, args, label }) {
  const callData = encodeFunctionData({ abi, functionName, args });
  console.log(`Executing ${label}...`);
  const response = await walletClient.createContractExecutionTransaction({
    idempotencyKey: randomUUID(),
    walletId,
    contractAddress,
    callData,
    fee: { type: "level", config: { feeLevel: "MEDIUM" } }
  });
  const transactionId = response.data?.id;
  if (!transactionId) throw new Error(`Circle did not return transaction id for ${label}.`);
  return waitForTransaction(transactionId, label);
}

async function deployOrUse({ envAddressName, outputAddressName, outputContractIdName, artifactPath, name, description, constructorParameters, output }) {
  const existingAddress = optionalEnv(envAddressName) || optionalEnv(outputAddressName);
  if (existingAddress) {
    output[outputAddressName] = existingAddress;
    return { address: existingAddress, abi: readArtifact(artifactPath).abi };
  }
  const deployed = await deployArtifact({ artifactPath, name, description, constructorParameters });
  output[outputContractIdName] = deployed.contractId;
  output[outputAddressName] = deployed.contract.contractAddress;
  return { address: deployed.contract.contractAddress, abi: readArtifact(artifactPath).abi, deployment: deployed };
}

async function getWalletAddress() {
  const existing = optionalEnv("CIRCLE_ARC_WALLET_ADDRESS");
  if (existing) return existing;
  const response = await walletClient.getWallet({ id: walletId });
  const address = response.data?.wallet?.address;
  if (!address) throw new Error("Circle did not return wallet address.");
  return address;
}

const output = {};
const walletAddress = await getWalletAddress();
output.CIRCLE_ARC_WALLET_ADDRESS = walletAddress;

const timer = await deployOrUse({
  envAddressName: "ARC_UMA_TIMER_ADDRESS",
  outputAddressName: "CIRCLE_ARC_UMA_TIMER_ADDRESS",
  outputContractIdName: "CIRCLE_ARC_UMA_TIMER_CONTRACT_ID",
  artifactPath: artifacts.Timer,
  name: "UMATimerArc",
  description: "UMA Timer for NoMarket Arc beta",
  constructorParameters: [],
  output
});

const finder = await deployOrUse({
  envAddressName: "ARC_UMA_FINDER_ADDRESS",
  outputAddressName: "CIRCLE_ARC_UMA_FINDER_ADDRESS",
  outputContractIdName: "CIRCLE_ARC_UMA_FINDER_CONTRACT_ID",
  artifactPath: artifacts.Finder,
  name: "UMAFinderArc",
  description: "UMA Finder for NoMarket Arc beta",
  constructorParameters: [],
  output
});

const identifierWhitelist = await deployOrUse({
  envAddressName: "ARC_UMA_IDENTIFIER_WHITELIST_ADDRESS",
  outputAddressName: "CIRCLE_ARC_UMA_IDENTIFIER_WHITELIST_ADDRESS",
  outputContractIdName: "CIRCLE_ARC_UMA_IDENTIFIER_WHITELIST_CONTRACT_ID",
  artifactPath: artifacts.IdentifierWhitelist,
  name: "UMAIdentifierWhitelistArc",
  description: "UMA IdentifierWhitelist for NoMarket Arc beta",
  constructorParameters: [],
  output
});

const addressWhitelist = await deployOrUse({
  envAddressName: "ARC_UMA_ADDRESS_WHITELIST_ADDRESS",
  outputAddressName: "CIRCLE_ARC_UMA_ADDRESS_WHITELIST_ADDRESS",
  outputContractIdName: "CIRCLE_ARC_UMA_ADDRESS_WHITELIST_CONTRACT_ID",
  artifactPath: artifacts.AddressWhitelist,
  name: "UMAAddressWhitelistArc",
  description: "UMA AddressWhitelist for NoMarket Arc beta",
  constructorParameters: [],
  output
});

const store = await deployOrUse({
  envAddressName: "ARC_UMA_STORE_ADDRESS",
  outputAddressName: "CIRCLE_ARC_UMA_STORE_ADDRESS",
  outputContractIdName: "CIRCLE_ARC_UMA_STORE_CONTRACT_ID",
  artifactPath: artifacts.Store,
  name: "UMAStoreArc",
  description: "UMA Store for NoMarket Arc beta",
  constructorParameters: [["0"], ["0"], timer.address],
  output
});

const collateral = await deployOrUse({
  envAddressName: "ARC_UMA_COLLATERAL_ADDRESS",
  outputAddressName: "CIRCLE_ARC_UMA_COLLATERAL_ADDRESS",
  outputContractIdName: "CIRCLE_ARC_UMA_COLLATERAL_CONTRACT_ID",
  artifactPath: artifacts.TestnetERC20,
  name: "UMAArcCollateral",
  description: "ARCT collateral for NoMarket Arc beta UMA resolution",
  constructorParameters: ["Arc Test Token", "ARCT", "18"],
  output
});

const mockOracle = await deployOrUse({
  envAddressName: "ARC_UMA_MOCK_ORACLE_ADDRESS",
  outputAddressName: "CIRCLE_ARC_UMA_MOCK_ORACLE_ADDRESS",
  outputContractIdName: "CIRCLE_ARC_UMA_MOCK_ORACLE_CONTRACT_ID",
  artifactPath: artifacts.MockOracleAncillary,
  name: "UMAMockOracleArc",
  description: "UMA MockOracleAncillary for NoMarket Arc beta",
  constructorParameters: [finder.address, timer.address],
  output
});

const ooV2 = await deployOrUse({
  envAddressName: "UMA_OOV2_ADDRESS_ARC",
  outputAddressName: "CIRCLE_ARC_UMA_OOV2_ADDRESS",
  outputContractIdName: "CIRCLE_ARC_UMA_OOV2_CONTRACT_ID",
  artifactPath: artifacts.OptimisticOracleV2,
  name: "UMAOOv2Arc",
  description: "UMA OptimisticOracleV2 for NoMarket Arc beta",
  constructorParameters: ["7200", finder.address, ooV2TimerAddress],
  output
});

const needsFullWiring = optionalEnv("CIRCLE_ARC_UMA_WIRED") !== "true";
if (needsFullWiring) {
  await executeContract({
    contractAddress: finder.address,
    abi: finder.abi,
    functionName: "changeImplementationAddress",
    args: [bytes32("IdentifierWhitelist"), identifierWhitelist.address],
    label: "Finder IdentifierWhitelist"
  });
  await executeContract({
    contractAddress: finder.address,
    abi: finder.abi,
    functionName: "changeImplementationAddress",
    args: [bytes32("CollateralWhitelist"), addressWhitelist.address],
    label: "Finder CollateralWhitelist"
  });
  await executeContract({
    contractAddress: finder.address,
    abi: finder.abi,
    functionName: "changeImplementationAddress",
    args: [bytes32("Store"), store.address],
    label: "Finder Store"
  });
  await executeContract({
    contractAddress: finder.address,
    abi: finder.abi,
    functionName: "changeImplementationAddress",
    args: [bytes32("Oracle"), mockOracle.address],
    label: "Finder Oracle"
  });
  await executeContract({
    contractAddress: finder.address,
    abi: finder.abi,
    functionName: "changeImplementationAddress",
    args: [bytes32("OptimisticOracleV2"), ooV2.address],
    label: "Finder OptimisticOracleV2"
  });
  await executeContract({
    contractAddress: identifierWhitelist.address,
    abi: identifierWhitelist.abi,
    functionName: "addSupportedIdentifier",
    args: [bytes32("YES_OR_NO_QUERY")],
    label: "Whitelist YES_OR_NO_QUERY"
  });
  await executeContract({
    contractAddress: addressWhitelist.address,
    abi: addressWhitelist.abi,
    functionName: "addToWhitelist",
    args: [collateral.address],
    label: "Whitelist ARCT collateral"
  });
  await executeContract({
    contractAddress: collateral.address,
    abi: collateral.abi,
    functionName: "allocateTo",
    args: [walletAddress, 100_000n * 10n ** 18n],
    label: "Mint ARCT to deployer wallet"
  });
  output.CIRCLE_ARC_UMA_WIRED = "true";
} else if (ooV2.deployment) {
  await executeContract({
    contractAddress: finder.address,
    abi: finder.abi,
    functionName: "changeImplementationAddress",
    args: [bytes32("OptimisticOracleV2"), ooV2.address],
    label: "Finder OptimisticOracleV2"
  });
}

const resolver = await deployOrUse({
  envAddressName: "ARC_UMA_RESOLVER_ADDRESS",
  outputAddressName: "CIRCLE_ARC_UMA_RESOLVER_ADDRESS",
  outputContractIdName: "CIRCLE_ARC_UMA_RESOLVER_CONTRACT_ID",
  artifactPath: artifacts.ArcUmaOOV2Resolver,
  name: "NoMarketArcUMAResolver",
  description: "NoMarket Arc resolver adapter backed by UMA OOv2",
  constructorParameters: [ooV2.address, collateral.address, bytes32("YES_OR_NO_QUERY"), livenessSeconds],
  output
});

const noMarket = await deployArtifact({
  artifactPath: artifacts.NoMarketArc,
  name: "NoMarketArc",
  description: "NoMarket Arc public beta prediction market",
  constructorParameters: [resolver.address, optionalEnv("ARC_MARKET_CREATION_DEPOSIT_WEI") || "0"]
});

output.CIRCLE_ARC_UMA_OOV2_ADDRESS = ooV2.address;
output.CIRCLE_ARC_UMA_COLLATERAL_ADDRESS = collateral.address;
output.CIRCLE_ARC_UMA_RESOLVER_ADDRESS = resolver.address;
output.CIRCLE_ARC_NOMARKET_CONTRACT_ID = noMarket.contractId;
output.CIRCLE_ARC_NOMARKET_DEPLOY_TX_ID = noMarket.transactionId;
output.CIRCLE_ARC_NOMARKET_ADDRESS = noMarket.contract.contractAddress;
output.NEXT_PUBLIC_ARC_TIMED_MARKETS = "true";
output.NEXT_PUBLIC_ARC_MARKET_CREATION_DEPOSIT_WEI = optionalEnv("ARC_MARKET_CREATION_DEPOSIT_WEI") || "0";

output.ARC_UMA_TIMER_ADDRESS = timer.address;
output.ARC_UMA_FINDER_ADDRESS = finder.address;
output.ARC_UMA_COLLATERAL_ADDRESS = collateral.address;
output.ARC_UMA_MOCK_ORACLE_ADDRESS = mockOracle.address;
output.UMA_OOV2_ADDRESS_ARC = ooV2.address;
output.ARC_UMA_RESOLVER_ADDRESS = resolver.address;
output.ARC_NOMARKET_ADDRESS = noMarket.contract.contractAddress;

output.NEXT_PUBLIC_ARC_UMA_TIMER_ADDRESS = timer.address;
output.NEXT_PUBLIC_ARC_UMA_FINDER_ADDRESS = finder.address;
output.NEXT_PUBLIC_ARC_UMA_COLLATERAL_ADDRESS = collateral.address;
output.NEXT_PUBLIC_ARC_UMA_MOCK_ORACLE_ADDRESS = mockOracle.address;
output.NEXT_PUBLIC_ARC_UMA_OOV2_ADDRESS = ooV2.address;
output.NEXT_PUBLIC_ARC_UMA_RESOLVER_ADDRESS = resolver.address;
output.NEXT_PUBLIC_ARC_NOMARKET_ADDRESS = noMarket.contract.contractAddress;
output.NEXT_PUBLIC_ARC_DEPLOY_BLOCK = noMarket.transaction?.blockHeight;

printEnvBlock(output);
