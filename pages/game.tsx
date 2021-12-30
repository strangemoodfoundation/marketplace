import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { SendOneLamportToRandomAddress } from '../components/SendLamportExample';

import type { NextPage } from 'next';
import { useFlag } from '../lib/useFlag';
import { CreateWrappedNativeAccountExample } from '../components/CreateWrappedNativeAccountExample';
import { GetAccountListingsExample } from '../components/GetAccountListingExample';
import { CreateListingExample } from '../components/CreateListingExample';
import { PurchaseListingExample } from '../components/PurchaseListingExample';
import { Header } from '../components/Header';
import { StoreNav } from '../components/StoreNav';

const Home: NextPage = () => {
  return (
    <div className="text-xl">
      <Header />
      <div className="max-w-2xl mx-auto">
        <StoreNav />
      </div>
    </div>
  );
};

export default Home;
