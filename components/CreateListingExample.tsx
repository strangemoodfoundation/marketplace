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
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  // TODO: replace/abstract
  const getOrCreateAssociatedAccount = async (
    destPublicKey: PublicKey,
    mint: PublicKey
  ): Promise<PublicKey> => {
    console.log('getOrCreateAssociatedAccount');
    if (!destPublicKey) throw new WalletNotConnectedError();

    const associatedDestinationTokenAddr =
      await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
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

    if (
      associatedDestinationAccount !== null &&
      associatedDestinationAccount.owner.toBase58() !== destPublicKey.toBase58()
    ) {
      console.log('Associated Destination Account Exists');
      // transaction.add(
      //   Token.createSetAuthorityInstruction(
      //     TOKEN_PROGRAM_ID,
      //     ,
      //     destPublicKey,
      //     'AccountOwner',
      //     publicKey,
      //     []
      //   )
      // );
    } else {
      if (associatedDestinationAccount === null) {
        const transaction = new Transaction({
          feePayer: destPublicKey,
        });
        console.log('associatedDestinationAccount === null');
        transaction.add(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mint,
            associatedDestinationTokenAddr,
            destPublicKey,
            destPublicKey
          )
        );
        await sendAndConfirmWalletTransaction(
          connection,
          sendTransaction,
          transaction
        );
        console.log('sent transaction details');
      }
    }

    console.log({ associatedDestinationTokenAddr });

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
        governanceProgramId: strangemood.MAINNET.GOVERNANCE_PROGRAM_ID,
      }
    );

    console.log({ createListingTransaction: transaction });

    const res = await sendAndConfirmWalletTransaction(
      connection,
      sendTransaction,
      transaction.tx,
      { signers: [transaction.listingMint, transaction.listing] }
    );
    console.log('finished transactions');
    console.log({ res });
  };

  return (
    <div>
      <button onClick={onCreateListing} disabled={!publicKey}>
        Create Listing
      </button>
    </div>
  );
};
