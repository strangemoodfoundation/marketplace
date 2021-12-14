import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { Token, NATIVE_MINT, AccountLayout } from '@solana/spl-token';
import React, { FC, useState } from 'react';
import strangemood from '@strangemood/strangemood';
import { sendAndConfirmWalletTransaction } from '../lib/util';

export const CreateWrappedNativeAccountExample: FC = () => {
  const [wrappedNativeAccountId, setWrappedNativeAccountId] = useState<
    undefined | string
  >(undefined);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const createWrappedNativeAccount = async (amount: number) => {
    if (!publicKey) throw new WalletNotConnectedError();

    // Allocate memory for the account
    const balanceNeeded = await Token.getMinBalanceRentForExemptAccount(
      connection
    ); // Create a new account

    const newAccount = Keypair.generate();
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: newAccount.publicKey,
        lamports: balanceNeeded,
        space: AccountLayout.span,
        programId: strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
      })
    ); // Send lamports to it (these will be wrapped into native tokens by the token program)

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: newAccount.publicKey,
        lamports: amount,
      })
    ); // Assign the new account to the native token mint.
    // the account will be initialized with a balance equal to the native token balance.
    // (i.e. amount)

    transaction.add(
      Token.createInitAccountInstruction(
        strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
        NATIVE_MINT,
        newAccount.publicKey,
        publicKey
      )
    );

    // Send the three instructions
    sendAndConfirmWalletTransaction(connection, sendTransaction, transaction);

    return newAccount.publicKey;
  };

  const onCreateWrappedNativeAccount = async () => {
    const newAccountPubkey = await createWrappedNativeAccount(1);
    setWrappedNativeAccountId(newAccountPubkey.toString());
  };

  return (
    <div>
      <button onClick={onCreateWrappedNativeAccount} disabled={!publicKey}>
        Create Wrapped Native Account!
      </button>

      <h1>Wrapped Account Id: {wrappedNativeAccountId ?? 'not created'}</h1>
    </div>
  );
};
