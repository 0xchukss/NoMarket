import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { loadDeployEnv, printEnvBlock, requireEnv } from "./circle-arc-env.mjs";

loadDeployEnv();

const client = initiateDeveloperControlledWalletsClient({
  apiKey: requireEnv("CIRCLE_API_KEY"),
  entitySecret: requireEnv("CIRCLE_ENTITY_SECRET")
});

const response = await client.getWallet({ id: requireEnv("CIRCLE_ARC_WALLET_ID") });
const wallet = response.data?.wallet;

if (!wallet?.id || !wallet?.address) {
  throw new Error("Circle did not return wallet id/address.");
}

console.log(`Circle wallet found: ${wallet.id}`);
console.log(`Blockchain: ${wallet.blockchain || "unknown"}`);
console.log(`Address: ${wallet.address}`);

printEnvBlock({
  CIRCLE_ARC_WALLET_SET_ID: wallet.walletSetId,
  CIRCLE_ARC_WALLET_ADDRESS: wallet.address
});
