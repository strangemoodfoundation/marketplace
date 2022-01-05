import {
  Connection,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import { Token, NATIVE_MINT, AccountLayout } from '@solana/spl-token';
import {
  SendTransactionOptions,
  WalletNotConnectedError,
} from '@solana/wallet-adapter-base';
import { CLUSTER } from './constants';
import { WalletContextState } from '@solana/wallet-adapter-react';

export const sendAndConfirmWalletTransaction = async (
  connection: Connection,
  sendTransaction: (
    transaction: Transaction,
    connection: Connection,
    options?: SendTransactionOptions
  ) => Promise<TransactionSignature>,
  transaction: Transaction,
  options?: SendTransactionOptions
): Promise<TransactionSignature> => {
  console.log(transaction);

  const signature = await sendTransaction(transaction, connection, {
    preflightCommitment: 'recent',
    skipPreflight: false,
    ...options,
  });
  try {
    await connection.confirmTransaction(signature, 'processed');
  } catch (err) {
    console.error(err);
    console.log('&&& verification of transaction failed');
  }

  return signature;
};

export const createWrappedNativeAccount = async (
  connection: Connection,
  sendTransaction: (
    transaction: Transaction,
    connection: Connection,
    options?: SendTransactionOptions
  ) => Promise<TransactionSignature>,
  publicKey: PublicKey,
  amount: number
) => {
  if (!publicKey) throw new WalletNotConnectedError();

  console.log('createWrappedNativeAccount');

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
      programId: CLUSTER.STRANGEMOOD_PROGRAM_ID,
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
      CLUSTER.STRANGEMOOD_PROGRAM_ID,
      NATIVE_MINT,
      newAccount.publicKey,
      publicKey
    )
  ); // Send the three instructions

  // TODO: do i need any additional signers ??
  await sendAndConfirmWalletTransaction(
    connection,
    sendTransaction,
    transaction,
    { signers: [newAccount] }
  );

  return newAccount.publicKey;
};

export const sendAndSign = async (
  connection: Connection,
  wallet: WalletContextState,
  tx: Transaction,
  signers?: Signer[]
) => {
  console.log('TX:', tx);
  const sig = await wallet.sendTransaction(tx, connection, {
    signers,
  });
  console.log('SIG:', sig);

  const confirmation = await connection.confirmTransaction(sig);
  console.log('CONFIRMED TX:', confirmation);

  return { tx, sig, confirmation };
};
