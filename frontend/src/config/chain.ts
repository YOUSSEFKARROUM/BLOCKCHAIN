/** Réseau utilisé par l'interface (lecture et transactions). */
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "31337");
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";
export const IS_LOCAL = CHAIN_ID === 31337;

interface ChainInfo {
  name: string;
  explorer: string | null;
}

const CHAINS: Record<number, ChainInfo> = {
  31337: { name: "Anvil (local)", explorer: null },
  11155111: { name: "Sepolia", explorer: "https://sepolia.etherscan.io" },
};

export const CHAIN: ChainInfo = CHAINS[CHAIN_ID] ?? { name: `Réseau ${CHAIN_ID}`, explorer: null };

/** Paramètres pour `wallet_addEthereumChain` si MetaMask ne connaît pas encore le réseau. */
export const ADD_CHAIN_PARAMS = {
  chainId: "0x" + CHAIN_ID.toString(16),
  chainName: CHAIN.name,
  rpcUrls: [RPC_URL],
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  ...(CHAIN.explorer ? { blockExplorerUrls: [CHAIN.explorer] } : {}),
};

export function txUrl(hash: string): string | null {
  return CHAIN.explorer ? `${CHAIN.explorer}/tx/${hash}` : null;
}
