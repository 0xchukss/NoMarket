import type { EIP712TypedData, GenericSigner, Hex, SignerLifecycleCallbacks, TransactionReceipt } from "@zama-fhe/sdk";
import type { Config } from "wagmi";
import {
  getAccount,
  getBlock,
  getChainId,
  readContract,
  signTypedData,
  waitForTransactionReceipt,
  watchAccount,
  writeContract
} from "wagmi/actions";

export class WagmiSigner implements GenericSigner {
  private config: Config;

  constructor(signerConfig: { config: Config }) {
    this.config = signerConfig.config;
  }

  async getChainId(): Promise<number> {
    return getChainId(this.config);
  }

  async getAddress(): Promise<`0x${string}`> {
    const account = getAccount(this.config);
    if (!account?.address) {
      throw new TypeError("Connect an EVM wallet first.");
    }
    return account.address;
  }

  async signTypedData(typedData: EIP712TypedData): Promise<Hex> {
    const sigTypes = { ...typedData.types };
    delete (sigTypes as Record<string, unknown>).EIP712Domain;
    return signTypedData(this.config, {
      primaryType: Object.keys(sigTypes)[0]!,
      types: sigTypes,
      domain: typedData.domain as any,
      message: typedData.message as any,
      account: await this.getAddress()
    });
  }

  async writeContract(config: any): Promise<Hex> {
    return writeContract(this.config, config);
  }

  async readContract(config: any): Promise<any> {
    return readContract(this.config, config);
  }

  async waitForTransactionReceipt(hash: Hex): Promise<TransactionReceipt> {
    return (await waitForTransactionReceipt(this.config, { hash })) as unknown as TransactionReceipt;
  }

  async getBlockTimestamp(): Promise<bigint> {
    const block = await getBlock(this.config);
    return block.timestamp;
  }

  subscribe({ onDisconnect, onAccountChange, onChainChange }: SignerLifecycleCallbacks): () => void {
    return watchAccount(this.config, {
      onChange: (account, previous) => {
        if (account.status === "disconnected" && previous.status !== "disconnected") {
          onDisconnect?.();
        }
        if (account.address && previous.address && account.address !== previous.address) {
          onAccountChange?.(account.address);
        }
        if (account.chainId && account.chainId !== previous.chainId) {
          onChainChange?.(account.chainId);
        }
      }
    });
  }
}
