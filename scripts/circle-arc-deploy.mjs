import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";
import { loadDeployEnv, optionalEnv, printEnvBlock, requireEnv } from "./circle-arc-env.mjs";

loadDeployEnv();

const root = process.cwd();
const apiKey = requireEnv("CIRCLE_API_KEY");
const entitySecret = requireEnv("CIRCLE_ENTITY_SECRET");
const walletId = requireEnv("CIRCLE_ARC_WALLET_ID");

const walletClient = initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });
const contractClient = initiateSmartContractPlatformClient({ apiKey, entitySecret });

function readArtifact(relativePath) {
  const artifact = JSON.parse(readFileSync(join(root, relativePath), "utf8"));
  const bytecode = typeof artifact.bytecode === "string" ? artifact.bytecode : artifact.bytecode?.object;
  if (!artifact.abi || !bytecode || bytecode === "0x") {
    throw new Error(`Invalid Foundry artifact at ${relativePath}. Run npm run contracts:arc:build first.`);
  }
  return { abi: artifact.abi, bytecode: bytecode.startsWith("0x") ? bytecode : `0x${bytecode}` };
}

async function waitForTransaction(transactionId, label) {
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const response = await walletClient.getTransaction({ id: transactionId });
    const transaction = response.data?.transaction;
    const state = transaction?.state;
    if (state === "COMPLETE" || state === "CONFIRMED") return transaction;
    if (state === "FAILED" || state === "CANCELLED") {
      throw new Error(`${label} transaction ended in state ${state}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  throw new Error(`${label} transaction did not complete within 3 minutes.`);
}

async function waitForContract(contractId, label) {
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const response = await contractClient.getContract({ id: contractId });
    const contract = response.data?.contract;
    if (contract?.contractAddress && contract.status === "COMPLETE") return contract;
    if (contract?.status === "FAILED") throw new Error(`${label} contract deployment failed.`);
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  throw new Error(`${label} contract address was not available within 3 minutes.`);
}

async function deployArtifact({ artifactPath, name, description, constructorParameters }) {
  const artifact = readArtifact(artifactPath);
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
  return { contractId, transactionId, transaction, contract };
}

let oracleAddress = optionalEnv("UMA_OOV3_ADDRESS_ARC") || optionalEnv("CIRCLE_ARC_MOCK_OOV3_ADDRESS");
const output = {};

if (!oracleAddress) {
  const mock = await deployArtifact({
    artifactPath: "contracts/arc/out/MockOOv3.sol/MockOOv3.json",
    name: "MockOOv3Arc",
    description: "NoMarket Arc beta mock optimistic oracle",
    constructorParameters: []
  });
  oracleAddress = mock.contract.contractAddress;
  output.CIRCLE_ARC_MOCK_OOV3_CONTRACT_ID = mock.contractId;
  output.CIRCLE_ARC_MOCK_OOV3_ADDRESS = oracleAddress;
}

const noMarket = await deployArtifact({
  artifactPath: "contracts/arc/out/NoMarketArc.sol/NoMarketArc.json",
  name: "NoMarketArc",
  description: "NoMarket Arc public beta prediction market",
  constructorParameters: [
    oracleAddress,
    optionalEnv("ARC_MARKET_CREATION_DEPOSIT_WEI") || "5000000000000000000",
    optionalEnv("ARC_BET_FEE_BPS") || "200"
  ]
});

output.CIRCLE_ARC_NOMARKET_CONTRACT_ID = noMarket.contractId;
output.CIRCLE_ARC_NOMARKET_DEPLOY_TX_ID = noMarket.transactionId;
output.CIRCLE_ARC_NOMARKET_ADDRESS = noMarket.contract.contractAddress;
output.NEXT_PUBLIC_ARC_NOMARKET_ADDRESS = noMarket.contract.contractAddress;
output.NEXT_PUBLIC_ARC_DEPLOY_BLOCK = noMarket.transaction?.blockHeight;
output.NEXT_PUBLIC_ARC_TIMED_MARKETS = "true";
output.NEXT_PUBLIC_ARC_MARKET_CREATION_DEPOSIT_WEI = optionalEnv("ARC_MARKET_CREATION_DEPOSIT_WEI") || "5000000000000000000";
output.NEXT_PUBLIC_ARC_BET_FEE_BPS = optionalEnv("ARC_BET_FEE_BPS") || "200";
if (oracleAddress === optionalEnv("UMA_OOV3_ADDRESS_ARC")) {
  output.NEXT_PUBLIC_ARC_UMA_OOV3_ADDRESS = oracleAddress;
}

printEnvBlock(output);
