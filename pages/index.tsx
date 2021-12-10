import type { NextPage } from 'next';
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { SendOneLamportToRandomAddress } from '../components/SendLamportExample';

const sendLamportExample = () => {};

const Home: NextPage = () => {
  return (
    <div className="text-xl">
      <div>
        <WalletMultiButton />
        <WalletDisconnectButton />
        <SendOneLamportToRandomAddress />
      </div>
    </div>
  );
};

export default Home;
