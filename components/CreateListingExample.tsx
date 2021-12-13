import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { Keypair, Transaction, PublicKey } from '@solana/web3.js';
import {
  Token,
  NATIVE_MINT,
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
    destPublicKey: PublicKey,
    mint: PublicKey
  ): Promise<PublicKey> => {
    console.log('getOrCreateAssociatedAccount');
    if (!publicKey) throw new WalletNotConnectedError();

    const associatedDestinationTokenAddr =
      await Token.getAssociatedTokenAddress(
        strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
        publicKey,
        mint,
        destPublicKey
      );

    console.log({ associatedDestinationTokenAddr });

    // Get the derived address of the destination wallet which will hold the custom token.
    // This account may or may not exist(!!!)
    const associatedDestinationAccount = await connection.getAccountInfo(
      associatedDestinationTokenAddr
    );

    console.log({ associatedDestinationAccount });

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
          mint,
          associatedDestinationTokenAddr,
          publicKey,
          [],
          0
        )
      );
    }

    // try {

    await sendAndConfirmWalletTransaction(
      connection,
      sendTransaction,
      transaction
    );

    // }

    return associatedDestinationTokenAddr;
  };

  const onCreateListing = async () => {
    console.log('onCreateListing!');
    if (!publicKey) throw new WalletNotConnectedError();

    // TODO
    const ARBITRARY_PRICE_FOR_NOW = 1;

    // a token-specific account that only the purchaser can withdraw from
    const associatedDestinationTokenAddr = await getOrCreateAssociatedAccount(
      publicKey,
      strangemood.MAINNET.STRANGEMOOD_FOUNDATION_MINT
    );
    console.log({ associatedDestinationTokenAddr });

    const associatedAccountWrappedSolAddr = await getOrCreateAssociatedAccount(
      publicKey,
      NATIVE_MINT
    );
    console.log({ associatedAccountWrappedSolAddr });

    const transaction = await strangemood.client.createListingInstruction(
      connection,
      strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
      {
        payer: publicKey,
        signer: publicKey,
      },
      {
        solDeposit: associatedAccountWrappedSolAddr,
        voteDeposit: associatedDestinationTokenAddr,
        priceInLamports: ARBITRARY_PRICE_FOR_NOW,
        charterGovernance:
          strangemood.MAINNET.STRANGEMOOD_FOUNDATION_CHARTER_GOVERNANCE,
        charter: strangemood.MAINNET.STRANGEMOOD_FOUNDATION_CHARTER,
        realm: strangemood.MAINNET.STRANGEMOOD_FOUNDATION_REALM,
        governanceProgramId: strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
      }
    );

    console.log(transaction);

    const res = await sendAndConfirmWalletTransaction(
      connection,
      sendTransaction,
      transaction.tx
      // [
      //   // listingTokenAccount.owner,
      // ]
    );

    console.log(res);
  };

  return (
    <div>
      <button onClick={onCreateListing} disabled={!publicKey}>
        Create Listing
      </button>
    </div>
  );
};
