import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { randomUUID } from "node:crypto";
import { loadDeployEnv, optionalEnv, printEnvBlock, requireEnv } from "./circle-arc-env.mjs";

loadDeployEnv();

const apiKey = requireEnv("CIRCLE_API_KEY");
const entitySecret = requireEnv("CIRCLE_ENTITY_SECRET");
const walletSetId = optionalEnv("CIRCLE_ARC_WALLET_SET_ID");

const client = initiateDeveloperControlledWalletsClient({
  apiKey,
  entitySecret
});

const walletSet = walletSetId
  ? { id: walletSetId }
  : (await client.createWalletSet({ name: "NoMarketArcWalletSet", idempotencyKey: randomUUID() })).data?.walletSet;

if (!walletSet?.id) {
  throw new Error("Circle did not return a wallet set id.");
}

const walletsResponse = await client.createWallets({
  idempotencyKey: randomUUID(),
  blockchains: ["ARC-TESTNET"],
  count: 1,
  walletSetId: walletSet.id,
  accountType: "SCA"
});

const wallet = walletsResponse.data?.wallets?.[0];
if (!wallet?.id || !wallet?.address) {
  throw new Error("Circle did not return an Arc wallet id/address.");
}

printEnvBlock({
  CIRCLE_ARC_WALLET_SET_ID: wallet.walletSetId || walletSet.id,
  CIRCLE_ARC_WALLET_ID: wallet.id,
  CIRCLE_ARC_WALLET_ADDRESS: wallet.address
});
