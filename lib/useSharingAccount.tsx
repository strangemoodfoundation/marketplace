import { AccountClient, Program, web3 } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Keypair,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  fetchSharingProgram,
  getSharingProvider,
  initSharingAccount,
  updateSharingAccountSplitPercent,
  recover,
  Sharing,
  purchaseAssetByAffiliate,
  deriveSharingAccountAddress,
  getOrCreateAssociatedTokenAccount,
  unBorshifyFloat,
  sharingPDA,
} from '@strangemood/sharing';
import { useEffect, useState } from 'react';
import { CLUSTER } from './constants';
import { sendAndSign } from './util';

import * as splToken from '@solana/spl-token';

const DEMO_ASSET_PUBKEY = '6Y7vqCM3c7xSNcfL6d5dpboudvVRpbzigpUkUBuavXSt';

export const useSharingAccount = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<Program<Sharing> | undefined>(
    undefined
  );

  const fetchProgram = async () => {
    // @ts-ignore
    const sharingProvider = await getSharingProvider(connection, wallet);
    const sharingProgram = await fetchSharingProgram(sharingProvider);

    setProgram(sharingProgram);
  };

  useEffect(() => {
    fetchProgram();
  }, []);

  const initializeTx = async (
    assetKeypair: PublicKey,
    splitPercent: number
  ) => {
    if (!wallet.publicKey || !program) throw new Error('Not Connected');

    const { tx, signers } = await initSharingAccount(
      connection,
      program,
      wallet.publicKey,
      assetKeypair,
      {
        splitPercent,
      }
    );

    return { tx, signers };
    // return await sendAndSign(connection, wallet, tx, signers);
  };

  const updateSplitPercent = async (splitPercent: number) => {
    if (!wallet.publicKey || !program) throw new Error('Not Connected');

    const asset = new web3.PublicKey(DEMO_ASSET_PUBKEY);
    console.log('Using asset keypair:', asset.toString());

    const { tx } = await updateSharingAccountSplitPercent(
      connection,
      program,
      wallet.publicKey,
      asset,
      {
        splitPercent,
      }
    );

    return await sendAndSign(connection, wallet, tx);
  };

  const recoverAccountTokens = async () => {
    if (!wallet.publicKey || !program) throw new Error('Not Connected');

    const asset = new web3.PublicKey(DEMO_ASSET_PUBKEY);
    console.log('Using asset keypair:', asset.toString());

    const { tx } = await recover(
      connection,
      program,
      wallet.publicKey,
      wallet.publicKey,
      asset
    );

    return await sendAndSign(connection, wallet, tx);
  };

  const executePurchaseViaAffiliate = async (
    affiliate: web3.PublicKey,
    listing: PublicKey,
    solDeposit: PublicKey,
    purchaseTx: { tx: Transaction | TransactionInstruction; signers?: Signer[] }
  ) => {
    const tx = new Transaction();
    if (!wallet.publicKey || !program) throw new Error('Not Connected');

    const {
      address: associatedAddressOfAffiliate,
      instruction: createTokenAcctTx,
    } = await getOrCreateAssociatedTokenAccount(
      connection,
      affiliate,
      wallet.publicKey
    );

    createTokenAcctTx && tx.add(createTokenAcctTx);

    const sharingAddr = await sharingPDA(solDeposit, listing);

    tx.add(
      (
        await purchaseAssetByAffiliate(
          program,
          wallet.publicKey,
          sharingAddr[0],
          associatedAddressOfAffiliate,
          purchaseTx.tx
        )
      ).tx
    );

    // tx.instructions.
    // tx.instructions.forEach((ix) => {
    //   console.log(ix.data.byteLength);
    //   console.log({ keys: ix.keys, programId: ix.programId.toString() });
    //   // console.log(ix.ac.byteLength);
    // });
    // // console.log({ size: tx..inserialize().byteLength });
    // console.log({ size: tx.serialize().byteLength });

    return await sendAndSign(connection, wallet, tx, purchaseTx.signers);
  };

  const getAssociatedUserSolTokenAddress = async () => {
    if (!wallet.publicKey || !program) throw new Error('Not Connected');
    const associatedTokenAddress =
      await splToken.Token.getAssociatedTokenAddress(
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        splToken.TOKEN_PROGRAM_ID,
        splToken.NATIVE_MINT,
        wallet.publicKey
      );

    return associatedTokenAddress;
  };

  const getSharingAccount = async (
    solDeposit: PublicKey,
    listingAddress: PublicKey
  ) => {
    const sharingAddr = await sharingPDA(solDeposit, listingAddress);

    if (!sharingAddr || !program)
      throw new Error('This Listing Address has no sharing account associated');

    const account: any = await program?.account.sharingAccount.fetch(
      sharingAddr[0]
    );
    const { splitPercentAmount, splitPercentDecimals } = account;

    const splitPercent = unBorshifyFloat(
      splitPercentAmount,
      splitPercentDecimals
    );

    return {
      splitPercent,
      ...account,
    };
  };

  return {
    initializeTx,
    updateSplitPercent,
    recoverAccountTokens,
    executePurchaseViaAffiliate,
    getSharingAccount,
    getAssociatedUserSolTokenAddress,
  };
};
