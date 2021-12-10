import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { AccountInfo, PublicKey } from '@solana/web3.js';
import React, { FC, useState } from 'react';
import strangemood from '@strangemood/strangemood';

type ListingResponseType = { pubkey: PublicKey; account: AccountInfo<Buffer> };

export const GetAccountListingsExample: FC = () => {
  const [listings, setListings] = useState<ListingResponseType[]>([]);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const onGetListings = async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    // get listings
    const listings = await strangemood.client.getAllListings(
      connection,
      strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID
    );

    setListings(listings);
  };

  return (
    <div>
      <button onClick={onGetListings} disabled={!publicKey}>
        Get Listings!
      </button>

      <h1>Listings</h1>
      {listings &&
        listings.length &&
        listings.forEach((l) => {
          return <p>{l.pubkey}</p>;
        })}
    </div>
  );
};
