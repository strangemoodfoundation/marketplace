import {
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { SendOneLamportToRandomAddress } from '../components/SendLamportExample';

const sendLamportExample = () => {};

import Strangemood from '@strangemood/strangemood';
import type { NextPage } from 'next';
import * as solana from '@solana/web3.js';
import { useRouter } from 'next/router';
import { useFlag } from '../lib/useFlag';
import { CreateWrappedNativeAccountExample } from '../components/CreateWrappedNativeAccountExample';
import { GetAccountListingsExample } from '../components/GetAccountListingExample';
import { CreateListingExample } from '../components/CreateListingExample';
import { PurchaseListingExample } from '../components/PurchaseListingExample';

const Home: NextPage = () => {
  const network = useFlag('network', 'mainnet-beta');

  // function onMakeNewListing() {
  //   const conn = new solana.Connection(solana.clusterApiUrl(network));
  //   // Strangemood.client.createListing(
  //   //   conn,
  //   //   Strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
  //   //   {}
  //   // );
  // }

  return (
    <div className="text-xl">
      <div>
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
