"use client";

import { BrowserProvider, type Eip1193Provider, JsonRpcProvider, type JsonRpcSigner } from "ethers";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ADD_CHAIN_PARAMS, CHAIN_ID, RPC_URL } from "@/config/chain";
import { describeError } from "./errors";

interface InjectedProvider extends Eip1193Provider {
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: InjectedProvider;
  }
}

interface Web3State {
  /** Lecture seule, sans MetaMask : fonctionne pour tout visiteur. */
  readProvider: JsonRpcProvider;
  hasWallet: boolean;
  account: string | null;
  walletChainId: number | null;
  wrongNetwork: boolean;
  connecting: boolean;
  walletError: string | null;
  connect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  getSigner: () => Promise<JsonRpcSigner>;
  /** Incrémenté après chaque transaction : les pages rechargent leurs données. */
  refreshKey: number;
  refresh: () => void;
}

const Web3Context = createContext<Web3State | null>(null);

export function Web3Provider({ children }: { children: ReactNode }) {
  const readProvider = useMemo(() => new JsonRpcProvider(RPC_URL, CHAIN_ID, { staticNetwork: true }), []);
  const [hasWallet, setHasWallet] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Détection de MetaMask et écoute des changements de compte / de réseau
  useEffect(() => {
    const eth = window.ethereum;
    setHasWallet(Boolean(eth));
    if (!eth) return;

    const onAccounts = (accounts: unknown) => {
      const list = accounts as string[];
      setAccount(list.length > 0 ? list[0] : null);
    };
    const onChain = (chainId: unknown) => setWalletChainId(Number(chainId as string));

    eth.request({ method: "eth_accounts" }).then(onAccounts).catch(() => undefined);
    eth.request({ method: "eth_chainId" }).then(onChain).catch(() => undefined);
    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) {
      setWalletError("MetaMask n'est pas installé.");
      return;
    }
    setConnecting(true);
    setWalletError(null);
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      setAccount(accounts[0] ?? null);
      setWalletChainId(Number(await eth.request({ method: "eth_chainId" })));
    } catch (error) {
      setWalletError(describeError(error));
    } finally {
      setConnecting(false);
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return;
    setWalletError(null);
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ADD_CHAIN_PARAMS.chainId }] });
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code !== 4902) {
        setWalletError(describeError(error));
        return;
      }
      try {
        // 4902 = réseau inconnu de MetaMask : on l'ajoute
        await eth.request({ method: "wallet_addEthereumChain", params: [ADD_CHAIN_PARAMS] });
      } catch (addError) {
        setWalletError(describeError(addError));
      }
    }
  }, []);

  const getSigner = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) throw new Error("MetaMask n'est pas installé.");
    return new BrowserProvider(eth, "any").getSigner();
  }, []);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const value: Web3State = {
    readProvider,
    hasWallet,
    account,
    walletChainId,
    wrongNetwork: account !== null && walletChainId !== null && walletChainId !== CHAIN_ID,
    connecting,
    walletError,
    connect,
    switchNetwork,
    getSigner,
    refreshKey,
    refresh,
  };
  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3(): Web3State {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 doit être utilisé dans <Web3Provider>");
  return ctx;
}
