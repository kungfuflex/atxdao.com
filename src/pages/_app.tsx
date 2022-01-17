import { BaseProvider, WebSocketProvider } from '@ethersproject/providers';
import { providers } from 'ethers';
import type { NextComponentType, NextPageContext } from 'next';
import type { NextRouter } from 'next/router';
import { FunctionComponent } from 'react';
import { UIProvider } from 'components/ui-provider';
import {
  chain,
  Connector,
  defaultChains,
  Provider as WagmiProvider,
} from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { WalletLinkConnector } from 'wagmi/connectors/walletLink';

// Get environment variables
const alchemy = process.env.NEXT_PUBLIC_ALCHEMY_ID as string;
const etherscan = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY as string;
const infuraId = process.env.NEXT_PUBLIC_INFURA_ID as string;

// Pick chains
const chains = defaultChains;
const defaultChain = chain.mainnet;

// Set up connectors
type ConnectorsConfig = { chainId?: number };
const connectors = ({ chainId }: ConnectorsConfig): Connector[] => {
  const rpcUrl =
    chains.find((x) => x.id === chainId)?.rpcUrls?.[0] ??
    defaultChain.rpcUrls[0];
  return [
    new InjectedConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        infuraId,
        qrcode: true,
      },
    }),
    new WalletLinkConnector({
      chains,
      options: {
        appName: 'wagmi',
        jsonRpcUrl: `${rpcUrl}/${infuraId}`,
      },
    }),
  ];
};

// Set up providers
type ProviderConfig = { chainId?: number; connector?: Connector };
const isChainSupported = (chainId?: number): boolean =>
  chains.some((x) => x.id === chainId);

const provider = ({ chainId }: ProviderConfig): BaseProvider =>
  providers.getDefaultProvider(
    isChainSupported(chainId) ? chainId : defaultChain.id,
    {
      alchemy,
      etherscan,
      infuraId,
    }
  );
const webSocketProvider = ({
  chainId,
}: ProviderConfig): WebSocketProvider | undefined =>
  isChainSupported(chainId)
    ? new providers.InfuraWebSocketProvider(chainId, infuraId)
    : undefined;

export interface AppRenderProps {
  pageProps: Record<string, unknown>;
  err?: Error;
  Component: NextComponentType<
    NextPageContext,
    AppRenderProps,
    Record<string, unknown>
  >;
  cookies: string;
  router: NextRouter;
}

const App: FunctionComponent<AppRenderProps> = ({
  Component,
  pageProps,
  cookies,
}) => (
  <WagmiProvider
    autoConnect
    connectorStorageKey="atxdao"
    connectors={connectors}
    provider={provider}
    webSocketProvider={webSocketProvider}
  >
    <UIProvider cookies={cookies}>
      <Component {...pageProps} />
    </UIProvider>
  </WagmiProvider>
);

export default App;

export { getServerSideProps } from 'components/ui-provider';
