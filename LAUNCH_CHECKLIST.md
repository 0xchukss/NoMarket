# NoMarket Public Launch Checklist

## Required Before Public Testnet

- Rotate the deployer wallet after any key has been pasted into chat or stored locally.
- Add a real WalletConnect project id to `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
- Replace the public Sepolia RPC with a managed provider URL.
- Add `ETHERSCAN_API_KEY` and verify the deployed contract.
- Keep `.env.deploy.local` local only. Do not copy deploy secrets into `app/.env.local`.
- Run a complete Sepolia flow:
  - Save a market locally.
  - Create it on Sepolia.
  - Place at least one encrypted combination bet.
  - Confirm bet history loads.
  - Propose an UMA outcome vector.
  - Settle after the UMA liveness window.

## Still Needed Before Real Money

- Add audited payout and claim logic.
- Add emergency pause/guardian controls.
- Add market close times so bets cannot be placed after resolution begins.
- Add moderation/admin controls for market creation.
- Add monitoring for RPC errors, failed encryption, transaction failures, and relayer latency.
- Add end-to-end tests for encryption, staking, UMA settlement, and history indexing.
