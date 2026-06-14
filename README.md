# NoMarket

NoMarket is a private combinatorial prediction market frontend backed by an EVM contract on Ethereum Sepolia.

- Frontend: Next.js with wagmi, RainbowKit, viem, and Zama FHE React SDK.
- Privacy: bet expression data is encrypted with Zama FHE before submission.
- Public transaction value: ETH stake is sent as `msg.value`, so wallets show the stake amount plus gas during signing.
- Resolver: UMA Optimistic Oracle V3 asserts the final combinatorial outcome vector.
- Contract stack: Foundry, `@fhevm/solidity`, and OpenZeppelin confidential contracts.

## Setup

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## Sepolia Contract

Frontend/public values belong in `.env.local` and `app/.env.local`:

```bash
NEXT_PUBLIC_SEPOLIA_RPC_URL=
NEXT_PUBLIC_NO_MARKET_ADDRESS=
NEXT_PUBLIC_NO_MARKET_DEPLOY_BLOCK=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_UMA_LIVENESS_SECONDS=7200
```

Deployment-only secrets belong in `.env.deploy.local`, never in `app/.env.local`:

```bash

SEPOLIA_RPC_URL=
DEPLOYER_PRIVATE_KEY=
ETHERSCAN_API_KEY=
UMA_OPTIMISTIC_ORACLE_V3=
UMA_CURRENCY=
UMA_BOND_WEI=0
UMA_LIVENESS_SECONDS=7200
```

Then deploy when Foundry is installed:

```bash
npm run contracts:install
npm run contracts:build
npm run deploy:sepolia
```

## Public Launch Checklist

- Use a dedicated WalletConnect project id in `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
- Use a paid or quota-managed Sepolia RPC URL instead of a shared public endpoint.
- Keep `DEPLOYER_PRIVATE_KEY` only in `.env.deploy.local` or your deployment provider's secret store.
- Set `ETHERSCAN_API_KEY` and verify the contract before sharing it publicly.
- Run a full market lifecycle on Sepolia: create market, place encrypted bet, propose UMA resolution, settle after liveness.
- Treat this as a Sepolia public beta until payout/claim economics are finalized and audited.
