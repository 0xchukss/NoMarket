# NoMarket Arc Subgraph

Indexes the Arc Testnet `NoMarketArc` contract at `0x564a0c5827256a438b7719b713378c9fbc64a1b1` from block `45542185`.

Deployed Studio endpoint:

```txt
https://api.studio.thegraph.com/query/1754671/nomarket-arc/0.0.2
```

Useful commands:

```bash
npm install
npm run codegen
npm run build
npx graph auth YOUR_DEPLOY_KEY
npm run deploy
```

Root shortcuts:

```bash
npm run subgraph:arc:codegen
npm run subgraph:arc:build
npm run subgraph:arc:deploy
```

Frontend env:

```env
NEXT_PUBLIC_ARC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/1754671/nomarket-arc/0.0.2
```

Indexed entities:

- `Market`
- `Bet`
- `ResolutionProposal`
- `MarketResolution`
