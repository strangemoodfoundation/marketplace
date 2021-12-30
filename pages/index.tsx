import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { SendOneLamportToRandomAddress } from '../components/SendLamportExample';

import type { NextPage } from 'next';
import { CreateWrappedNativeAccountExample } from '../components/CreateWrappedNativeAccountExample';
import { GetAccountListingsExample } from '../components/GetAccountListingExample';
import { CreateListingExample } from '../components/CreateListingExample';
import { PurchaseListingExample } from '../components/PurchaseListingExample';
import { Header } from '../components/Header';
import { StoreNav } from '../components/StoreNav';
import { FeaturedGallery } from '../components/Discover/FeaturedGallery';
import { FeaturedGenres } from '../components/Discover/FeaturedGenres';

const Home: NextPage = () => {
  return (
    <div className="text-xl">
      <div>
        <Header />
        <div className="max-w-2xl mx-auto">
          <StoreNav />
          <FeaturedGallery />
          <FeaturedGenres />
          <WalletMultiButton />
          <WalletDisconnectButton />
          <SendOneLamportToRandomAddress />
          <CreateWrappedNativeAccountExample />
          <GetAccountListingsExample />
          <CreateListingExample />
          <PurchaseListingExample />
        </div>

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
