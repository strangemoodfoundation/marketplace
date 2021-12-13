import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import {
  Keypair,
  SystemProgram,
  Transaction,
  PublicKey,
} from '@solana/web3.js';
import {
  Token,
  NATIVE_MINT,
  AccountLayout,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import React, { FC, useState } from 'react';
import strangemood from '@strangemood/strangemood';
import { getListingAccount } from '@strangemood/strangemood/dist/strangemood';
import {
  createWrappedNativeAccount,
  sendAndConfirmWalletTransaction,
} from '../lib/util';
import { ListingAccount } from '../../strangemood/js/dist/strangemood/types';

export const PurchaseListingExample: FC = () => {
  const [wrappedNativeAccount, setWrappedNativeAccount] = useState<
    undefined | Keypair
  >(undefined);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  // TODO: replace/abstract
  const getOrCreateAssociatedAccount = async (
    destPublicKey: PublicKey,
    listingAccount: ListingAccount
    // mintToken: Token
    // receiverAccount: string
  ): Promise<PublicKey> => {
    if (!publicKey) throw new WalletNotConnectedError();

    const associatedDestinationTokenAddr =
      await Token.getAssociatedTokenAddress(
        strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
        publicKey,
        listingAccount.data.mint,
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
            // strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            listingAccount.data.communityTokenAccount,
            associatedDestinationTokenAddr,
            destPublicKey,
            publicKey
          )
        );
      }
      transaction.add(
        Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          listingAccount.data.mint,
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

  const purchaseListing = async (listingPublicKey: PublicKey) => {
    if (!publicKey) throw new WalletNotConnectedError();

    // details about the listing we are purchasing
    const listingAccount = await getListingAccount(
      connection,
      listingPublicKey
    );

    // a token-specific account that only the purchaser can withdraw from
    let associatedDestinationTokenAddr = await getOrCreateAssociatedAccount(
      publicKey,
      listingAccount
    );

    // wrapped sol in a pre-paid account to pay for the listing
    let solTokenAccountToPayWith = await createWrappedNativeAccount(
      connection,
      publicKey,
      listingAccount.data.price.toNumber()
    );

    const params = {
      listing: listingPublicKey,
      charterGovernance:
        strangemood.MAINNET.STRANGEMOOD_FOUNDATION_CHARTER_GOVERNANCE,
      charter: strangemood.MAINNET.STRANGEMOOD_FOUNDATION_CHARTER,
      realm: strangemood.MAINNET.STRANGEMOOD_FOUNDATION_REALM,
      governanceProgramId: strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
      communityMint: strangemood.MAINNET.STRANGEMOOD_FOUNDATION_MINT,
    };

    const transaction = await strangemood.client.purchaseListingInstruction({
      listingAccount,
      params,
      conn: connection,
      strangemoodProgramId: strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
      publicKeys: {
        solTokenAccountToPayWith,
        signerPubkey: publicKey,
        listingTokenAccountAddress: associatedDestinationTokenAddr,
      },
    });

    sendAndConfirmWalletTransaction(connection, transaction, [
      // listingTokenAccount.owner,
    ]);
  };

  const onPurchaseListing = () => {
    const exampleListingAcct = Keypair.generate();

    purchaseListing(exampleListingAcct.publicKey);
  };

  return (
    <div>
      <button onClick={onPurchaseListing} disabled={!publicKey}>
        Purchase Listing
      </button>
    </div>
  );
};
