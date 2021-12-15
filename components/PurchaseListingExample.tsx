import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { Keypair, Transaction, PublicKey } from '@solana/web3.js';
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import React, { FC } from 'react';
import strangemood, { ListingAccount } from '@strangemood/strangemood';
import {
  createWrappedNativeAccount,
  sendAndConfirmWalletTransaction,
} from '../lib/util';

export const PurchaseListingExample: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  // TODO: replace/abstract
  const getOrCreateAssociatedAccount = async (
    destPublicKey: PublicKey,
    listingAccount: ListingAccount
  ): Promise<PublicKey> => {
    if (!publicKey) throw new WalletNotConnectedError();

    console.log('----------------------here');
    console.log(listingAccount.data.mint.toString());
    console.log(destPublicKey.toString());
    console.log('-----------------------');

    const associatedDestinationTokenAddr =
      await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        listingAccount.data.mint,
        destPublicKey
      );

    // Get the derived address of the destination wallet which will hold the custom token.
    // This account may or may not exist(!!!)
    const associatedDestinationAccount = await connection.getAccountInfo(
      associatedDestinationTokenAddr
    );

    console.log('does this exist??');
    console.log(associatedDestinationAccount?.data);

    if (
      associatedDestinationAccount !== null &&
      associatedDestinationAccount.owner.toBase58() !== destPublicKey.toBase58()
    ) {
      console.log('Associated Destination Account Exists');
    } else {
      const transaction = new Transaction();
      console.log('Associated Destination Account does not exist!');
      if (associatedDestinationAccount === null) {
        transaction.add(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            // strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            listingAccount.data.mint,
            associatedDestinationTokenAddr,
            destPublicKey,
            destPublicKey
          )
        );
      }

      await sendAndConfirmWalletTransaction(
        connection,
        sendTransaction,
        transaction
      );
    }

    return associatedDestinationTokenAddr;
  };

  const purchaseListing = async (listingPublicKey: PublicKey) => {
    if (!publicKey) throw new WalletNotConnectedError();

    console.log('------------- 1. Purchasing Listing');

    // details about the listing we are purchasing
    const listingAccount = await strangemood.client.getListingAccount(
      connection,
      listingPublicKey
    );

    console.log({ listingAccount });

    // a token-specific account that only the purchaser can withdraw from....
    // should this be for the listing ? or ... for que
    let associatedDestinationTokenAddr = await getOrCreateAssociatedAccount(
      publicKey,
      listingAccount
    );

    console.log('------------- 2. Purchasing Listing');

    console.log(
      'WE DERIVED ASSOCAITED DEST!',
      associatedDestinationTokenAddr.toString()
    );

    // wrapped sol in a pre-paid account to pay for the listing

    let solTokenAccountToPayWith = await createWrappedNativeAccount(
      connection,
      sendTransaction,
      publicKey,
      listingAccount.data.price.toNumber()
    );

    console.log('------------- 3. Purchasing Listing');

    const params = {
      listing: listingPublicKey,
      charterGovernance:
        strangemood.MAINNET.STRANGEMOOD_FOUNDATION_CHARTER_GOVERNANCE,
      charter: strangemood.MAINNET.STRANGEMOOD_FOUNDATION_CHARTER,
      realm: strangemood.MAINNET.STRANGEMOOD_FOUNDATION_REALM,
      governanceProgramId: strangemood.MAINNET.GOVERNANCE_PROGRAM_ID,
      communityMint: strangemood.MAINNET.STRANGEMOOD_FOUNDATION_MINT,
    };

    console.log(listingAccount.owner.toString());
    const transaction = await strangemood.client.purchaseListingInstruction({
      listingAccount,
      params,
      conn: connection,
      strangemoodProgramId: strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
      publicKeys: {
        solTokenAccountToPayWith: solTokenAccountToPayWith.publicKey,
        signerPubkey: publicKey,
        listingTokenAccountAddress: associatedDestinationTokenAddr,
      },
    });

    console.log({ transactionPreSent: transaction });

    try {
      const res = await sendAndConfirmWalletTransaction(
        connection,
        sendTransaction,
        transaction
        // { signers: [solTokenAccountToPayWith] }
      );

      console.log({ resultingTransaction: res });
      console.log('------------- 4. Purchasing Listing');
    } catch (err) {
      console.log(publicKey.toString());
      console.log(solTokenAccountToPayWith.toString());
      console.log(transaction.signatures[0].publicKey.toString());
      console.log(transaction.signatures[1].publicKey.toString());
    }
  };

  const onPurchaseListing = () => {
    console.log('Purchasing Listing');
    const exampleListingPubKey = new PublicKey(
      '9rhc18pctFC1JxxYJGroi4uh72DzVykc8WaXXCbH16LN'
    );

    purchaseListing(exampleListingPubKey);
  };

  return (
    <div>
      <button onClick={onPurchaseListing} disabled={!publicKey}>
        Purchase Listing 9rhc18pctFC1JxxYJGroi4uh72DzVykc8WaXXCbH16LN
      </button>
    </div>
  );
};
