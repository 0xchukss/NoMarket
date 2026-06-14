# Arc Deployment Notes

Arc uses Circle developer-controlled wallets for the cleanest beta deployment path.

## Secret deploy-only values

Keep these only in `.env.deploy.local` or a secrets manager:

```env
CIRCLE_API_KEY=
CIRCLE_ENTITY_SECRET=
CIRCLE_ARC_WALLET_SET_ID=
CIRCLE_ARC_WALLET_ID=
CIRCLE_ARC_WALLET_ADDRESS=
```

`CIRCLE_ENTITY_SECRET` is the raw registered entity secret. The Circle SDK generates a fresh entity secret ciphertext per API request, so do not store ciphertext as a reusable app variable.

## Public frontend values

After deployment, copy these to `.env.local` and `app/.env.local`:

```env
NEXT_PUBLIC_ARC_RPC=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_EXPLORER=https://testnet.arcscan.app
NEXT_PUBLIC_ARC_NOMARKET_ADDRESS=
NEXT_PUBLIC_ARC_DEPLOY_BLOCK=
NEXT_PUBLIC_ARC_UMA_RESOLVER_ADDRESS=
NEXT_PUBLIC_ARC_UMA_OOV2_ADDRESS=
NEXT_PUBLIC_ARC_UMA_FINDER_ADDRESS=
NEXT_PUBLIC_ARC_UMA_COLLATERAL_ADDRESS=
NEXT_PUBLIC_ARC_UMA_TIMER_ADDRESS=
NEXT_PUBLIC_ARC_UMA_MOCK_ORACLE_ADDRESS=
```

Arc Testnet does not currently have the UMA stack predeployed for this app, so the Circle deploy script follows the Arc prediction market reference flow: it deploys UMA `Finder`, whitelists, `Store`, `MockOracleAncillary`, `OptimisticOracleV2`, then deploys the NoMarket UMA resolver adapter and `NoMarketArc`. The Timer contract is deployed for UMA compatibility, but OOv2 defaults to the live block clock (`timer = address(0)`) so public beta settlements can expire naturally.

## Commands

Create a Circle Arc SCA wallet:

```powershell
npm run arc:circle:create-wallet
```

Copy the printed `CIRCLE_ARC_*` values into `.env.deploy.local`, fund the wallet from the Arc/Circle faucet, then deploy:

```powershell
npm run deploy:arc:circle
```

The deployment script prints:

- `CIRCLE_ARC_NOMARKET_CONTRACT_ID`: Circle's internal contract id.
- `CIRCLE_ARC_NOMARKET_DEPLOY_TX_ID`: Circle's deployment transaction id.
- `CIRCLE_ARC_NOMARKET_ADDRESS`: the deployed onchain contract address.
- `CIRCLE_ARC_UMA_RESOLVER_ADDRESS`: NoMarket's Arc UMA resolver adapter.
- `CIRCLE_ARC_UMA_OOV2_ADDRESS`: Arc-local UMA OptimisticOracleV2.
- `NEXT_PUBLIC_ARC_NOMARKET_ADDRESS`: same onchain address for frontend use.
- `NEXT_PUBLIC_ARC_UMA_RESOLVER_ADDRESS`: resolver address used by the frontend settlement action.
- `NEXT_PUBLIC_ARC_DEPLOY_BLOCK`: deployment block for event indexing.

Only `NEXT_PUBLIC_*` values belong in frontend env files.
