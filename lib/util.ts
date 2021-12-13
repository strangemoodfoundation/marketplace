import {
  Account,
  Connection,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import {
  Token,
  NATIVE_MINT,
  AccountLayout,
  MintLayout,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  SendTransactionOptions,
  WalletNotConnectedError,
} from '@solana/wallet-adapter-base';
import strangemood from '@strangemood/strangemood';

export const sendAndConfirmWalletTransaction = async (
  connection: Connection,
  transaction: Transaction,
  signers: Signer[],
  options?: SendTransactionOptions
): Promise<TransactionSignature> => {
  const signature = await connection.sendTransaction(transaction, signers, {
    preflightCommitment: 'recent',
    skipPreflight: false,
    ...options,
  });
  await connection.confirmTransaction(signature, 'processed');

  return signature;
};

export const createWrappedNativeAccount = async (
  connection: Connection,
  publicKey: PublicKey,
  amount: number
) => {
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
  ); // Send the three instructions

  // TODO: do i need any additional signers ??
  await sendAndConfirmWalletTransaction(connection, transaction, [newAccount]);

  return newAccount.publicKey;
};
