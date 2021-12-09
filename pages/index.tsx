import type { NextPage } from 'next';
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';

const Home: NextPage = () => {
  return (
    <div className="text-xl">
      <div>
        <WalletMultiButton />
        <WalletDisconnectButton />
      </div>
    </div>
  );
};

export default Home;
