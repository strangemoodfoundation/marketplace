import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { Keypair, Transaction, PublicKey } from '@solana/web3.js';
import {
  Token,
  NATIVE_MINT,
  AccountLayout,
  MintLayout,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import React, { FC, useState } from 'react';
import strangemood from '@strangemood/strangemood';
import {
  createWrappedNativeAccount,
  sendAndConfirmWalletTransaction,
} from '../lib/util';

export const CreateListingExample: FC = () => {
  const [wrappedNativeAccount, setWrappedNativeAccount] = useState<
    undefined | Keypair
  >(undefined);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  // TODO: replace/abstract
  const getOrCreateAssociatedAccount = async (
    destPublicKey: PublicKey
  ): Promise<PublicKey> => {
    if (!publicKey) throw new WalletNotConnectedError();

    const associatedDestinationTokenAddr =
      await Token.getAssociatedTokenAddress(
        strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
        publicKey,
        strangemood.MAINNET.STRANGEMOOD_FOUNDATION_MINT,
        destPublicKey
      );

    // Get the derived address of the destination wallet which will hold the custom token.
    // This account may or may not exist(!!!)
    const associatedDestinationAccount = await connection.getAccountInfo(
      associatedDestinationTokenAddr
    );

    const transaction = new Transaction();
    if (
      associatedDestinationAccount !== null &&
      associatedDestinationAccount.owner.toBase58() !== destPublicKey.toBase58()
    ) {
      transaction.add(
        Token.createSetAuthorityInstruction(
          TOKEN_PROGRAM_ID,
          publicKey,
          destPublicKey,
          'AccountOwner',
          publicKey,
          []
        )
      );
    } else {
      if (associatedDestinationAccount === null) {
        transaction.add(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            strangemood.MAINNET.STRANGEMOOD_FOUNDATION_VOTE_ACCOUNT,
            associatedDestinationTokenAddr,
            destPublicKey,
            publicKey
          )
        );
      }
      transaction.add(
        Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          strangemood.MAINNET.STRANGEMOOD_FOUNDATION_MINT,
          associatedDestinationTokenAddr,
          publicKey,
          [],
          1
        )
      );
    }

    await sendAndConfirmWalletTransaction(connection, transaction, []);

    return associatedDestinationTokenAddr;
  };

  const onCreateListing = async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    // TODO
    const ARBITRARY_PRICE_FOR_NOW = 1000;

    const wrappedSolAccount = await createWrappedNativeAccount(
      connection,
      publicKey,
      ARBITRARY_PRICE_FOR_NOW
    );

    // a token-specific account that only the purchaser can withdraw from
    const associatedDestinationTokenAddr = await getOrCreateAssociatedAccount(
      publicKey
    );

    const transaction = await strangemood.client.createListingInstruction(
      connection,
      strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
      {
        payer: publicKey,
        signer: publicKey, /////////////// NOPE.... who is signing ?????
      },
      {
        solDeposit: wrappedSolAccount,
        voteDeposit: associatedDestinationTokenAddr,
        priceInLamports: ARBITRARY_PRICE_FOR_NOW,
        charterGovernance:
          strangemood.MAINNET.STRANGEMOOD_FOUNDATION_CHARTER_GOVERNANCE,
        charter: strangemood.MAINNET.STRANGEMOOD_FOUNDATION_CHARTER,
        realm: strangemood.MAINNET.STRANGEMOOD_FOUNDATION_REALM,
        governanceProgramId: strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
      }
    );

    sendAndConfirmWalletTransaction(connection, transaction.tx, [
      // listingTokenAccount.owner,
    ]);
  };

  return (
    <div>
      <button onClick={onCreateListing} disabled={!publicKey}>
        Create Listing
      </button>
    </div>
  );
};
