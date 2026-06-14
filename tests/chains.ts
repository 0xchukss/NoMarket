import { expect } from "chai";
import { readFileSync } from "fs";
import { join } from "path";

const ZAMA_ADDRESS = "0x9513bde114EA51A34B6d60D89B1DebE06Ecf5F71";

function withChainEnv<T>(env: Record<string, string | undefined>, run: () => T): T {
  const previous = new Map<string, string | undefined>();
  Object.keys(env).forEach((key) => {
    previous.set(key, process.env[key]);
    if (env[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = env[key];
    }
  });

  delete require.cache[require.resolve("../app/lib/chains")];
  delete require.cache[require.resolve("../app/lib/chains/adapters")];

  try {
    return run();
  } finally {
    previous.forEach((value, key) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
    delete require.cache[require.resolve("../app/lib/chains")];
    delete require.cache[require.resolve("../app/lib/chains/adapters")];
  }
}

describe("Chain registry", () => {
  it("returns two chains and keeps missing beta configs disabled", () => {
    withChainEnv(
      {
        NEXT_PUBLIC_NO_MARKET_ADDRESS: ZAMA_ADDRESS,
        NEXT_PUBLIC_NO_MARKET_DEPLOY_BLOCK: "10821029",
        NEXT_PUBLIC_ARC_NOMARKET_ADDRESS: undefined
      },
      () => {
        const { CHAIN_ORDER, CHAINS } = require("../app/lib/chains");

        expect(CHAIN_ORDER).to.deep.equal(["zama", "arc"]);
        expect(CHAINS.zama.enabled).to.equal(true);
        expect(CHAINS.arc.enabled).to.equal(false);
      }
    );
  });

  it("keeps the existing Zama contract address and deploy block", () => {
    withChainEnv(
      {
        NEXT_PUBLIC_NO_MARKET_ADDRESS: ZAMA_ADDRESS,
        NEXT_PUBLIC_NO_MARKET_DEPLOY_BLOCK: "10821029"
      },
      () => {
        const { CHAINS } = require("../app/lib/chains");

        expect(CHAINS.zama.contractAddress).to.equal(ZAMA_ADDRESS);
        expect(CHAINS.zama.deployBlock).to.equal(10821029n);
        expect(CHAINS.zama.chainId).to.equal(11155111);
      }
    );
  });
});

describe("Chain adapters", () => {
  it("chooses subgraph indexing when configured", () => {
    withChainEnv(
      {
        NEXT_PUBLIC_ARC_NOMARKET_ADDRESS: "0x0000000000000000000000000000000000000001",
        NEXT_PUBLIC_ARC_DEPLOY_BLOCK: "123",
        NEXT_PUBLIC_ARC_SUBGRAPH_URL: "https://example.com/subgraphs/nomarket"
      },
      () => {
        const { CHAINS } = require("../app/lib/chains");
        const { getLogStartBlock, shouldUseSubgraph } = require("../app/lib/chains/adapters");

        expect(shouldUseSubgraph(CHAINS.arc)).to.equal(true);
        expect(getLogStartBlock(CHAINS.arc, 999n)).to.equal(123n);
      }
    );
  });

  it("falls back to RPC chunking when no subgraph is configured", () => {
    withChainEnv(
      {
        NEXT_PUBLIC_ARC_NOMARKET_ADDRESS: "0x0000000000000000000000000000000000000001",
        NEXT_PUBLIC_ARC_DEPLOY_BLOCK: undefined,
        NEXT_PUBLIC_ARC_SUBGRAPH_URL: undefined
      },
      () => {
        const { CHAINS } = require("../app/lib/chains");
        const { getLogStartBlock, shouldUseSubgraph } = require("../app/lib/chains/adapters");

        expect(shouldUseSubgraph(CHAINS.arc)).to.equal(false);
        expect(getLogStartBlock(CHAINS.arc, 999n)).to.equal(999n);
      }
    );
  });
});

describe("MockOOv3 scaffold", () => {
  it("maps assertion ids back to markets", () => {
    const source = readFileSync(join(process.cwd(), "contracts/shared/MockOOv3.sol"), "utf8");

    expect(source).to.contain("mapping(bytes32 => uint256) public assertionIdToMarketId");
    expect(source).to.contain("function setAssertionMarket(bytes32 assertionId, uint256 marketId)");
    expect(source).to.contain("IAssertionCallback(assertion.callbackRecipient).assertionResolvedCallback");
  });
});
