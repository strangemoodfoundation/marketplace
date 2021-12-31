import '../styles/globals.css';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { FC, ReactNode } from 'react';

// Use require instead of import, and order matters
require('../styles/globals.css');
require('@solana/wallet-adapter-react-ui/styles.css');

const WalletConnectionProvider = dynamic<{ children: ReactNode }>(
  () =>
    import('../components/WalletConnectionProvider').then(
      ({ WalletConnectionProvider }) => WalletConnectionProvider
    ),
  {
    ssr: false,
  }
);

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <div className="h-full bg-blue-50 flex flex-col">
      <div>
        {/* @ts-ignore because shutup typescript */}
        <div className="bg-white p-2 text-center border-b-2 border-black">
          Strangemood is an unaudited, in development, protocol that you should
          assume is broken. By using this demo, you're accepting the risk of
          using cryptocurrency software that is <i>explicitly</i> telling you
          that it is probably hackable. Please report security bugs to security
          @ strangemood . org to participate in our bug bounty program.
          {/* @ts-ignore because shutup typescript */}
        </div>
      </div>
      <WalletConnectionProvider>
        <WalletModalProvider>
          <Component {...pageProps} />
        </WalletModalProvider>
      </WalletConnectionProvider>
    </div>
  );
};
export default MyApp;
