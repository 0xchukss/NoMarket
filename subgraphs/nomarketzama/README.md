# NoMarket Zama Sepolia Subgraph

Indexes the Zama/Sepolia `NoMarket` contract at `0x9513bde114EA51A34B6d60D89B1DebE06Ecf5F71` from block `10821029`.

Deployed Studio endpoint:

```txt
https://api.studio.thegraph.com/query/1754671/nomarketzama/0.0.1
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
npm run subgraph:zama:codegen
npm run subgraph:zama:build
npm run subgraph:zama:deploy
```

Frontend env:

```env
NEXT_PUBLIC_ZAMA_SUBGRAPH_URL=https://api.studio.thegraph.com/query/1754671/nomarketzama/0.0.1
```

Indexed entities:

- `Market`
- `Bet`
- `ResolutionProposal`
- `MarketResolution`
