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

const Home: NextPage = () => {
  const network = useFlag('network', 'mainnet-beta');

  return (
    <div className="text-xl">
      <div>
        <Header />
        <WalletMultiButton />
        <WalletDisconnectButton />
        <SendOneLamportToRandomAddress />
        <CreateWrappedNativeAccountExample />
        <GetAccountListingsExample />
        <CreateListingExample />
        <PurchaseListingExample />

        {/* <button
          className="px-4 border"
          onClick={() => {
            onMakeNewListing();
          }}
        >
          Make new Listing
        </button> */}
      </div>
    </div>
  );
};

export default Home;
