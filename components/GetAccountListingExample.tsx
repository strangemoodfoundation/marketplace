import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { AccountInfo, PublicKey } from '@solana/web3.js';
import React, { FC, useState } from 'react';
import strangemood from '@strangemood/strangemood';
import _ from 'lodash';

type ListingResponseType = { pubkey: PublicKey; account: AccountInfo<Buffer> };

export const GetAccountListingsExample: FC = () => {
  // const [listings, setListings] = useState<ListingResponseType[]>([]);
  const [listings, setListings] = useState<string[]>([]);

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const onGetListings = async () => {
    console.log('getting listings');
    if (!publicKey) throw new WalletNotConnectedError();

    const listingRes1 = await strangemood.client.getListingAccount(
      connection,
      new PublicKey('9rhc18pctFC1JxxYJGroi4uh72DzVykc8WaXXCbH16LN')
    );
    console.log('RESS', listingRes1);

    // 2xg9nw4KjxA9mAvNnLmnNzqZ7MFUayFPLrwQR75W4pG5
    // 9rhc18pctFC1JxxYJGroi4uh72DzVykc8WaXXCbH16LN
    // H5uw6GzzcF8nnHs6dJz8XWYEcrnyjJZdADczUS9duidL

    const listingRes = await strangemood.client.getAllListings(
      connection,
      strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID
    );

    console.log(listingRes);
    listingRes.forEach((l) => {
      console.log(l.pubkey.toString());
    });

    setListings(_.map(listingRes, (l) => l.pubkey.toString()));
  };

  return (
    <div>
      <button onClick={onGetListings} disabled={!publicKey}>
        Get Listings!
      </button>

      <h1>Listings</h1>
      <h1>{JSON.stringify(listings)}</h1>
      {listings.forEach((l) => {
        // return <p>{l.pubkey.toString()}</p>;
        return <p>{l}</p>;
      })}
    </div>
  );
};
