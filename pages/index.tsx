import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Strangemood from '@strangemood/strangemood';
import type { NextPage } from 'next';
import * as solana from '@solana/web3.js';
import { useFlag } from '../lib/useFlag';
import * as splToken from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

const Home: NextPage = () => {
  const network = useFlag('network', 'mainnet-beta');
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  async function onMakeNewListing() {
    const conn = new solana.Connection(solana.clusterApiUrl(network));
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    let acctKeypair = solana.Keypair.generate();
    let listingBalance = await conn.getMinimumBalanceForRentExemption(
      Strangemood.state.ListingLayout.span
    );
    let mintBalance = await conn.getMinimumBalanceForRentExemption(
      splToken.MintLayout.span
    );

    let mintKeypair = solana.Keypair.generate();
    const create_mint_account_ix = solana.SystemProgram.createAccount({
      fromPubkey: publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: mintBalance,
      space: splToken.MintLayout.span,
      programId: splToken.TOKEN_PROGRAM_ID,
    });

    let tx = new solana.Transaction({
      feePayer: publicKey,
    });
    tx.add(
      create_mint_account_ix,
      Strangemood.ix.createListingAccount({
        lamportsForRent: listingBalance,
        payerPubkey: keys.payer,
        newAccountPubkey: acctKeypair.publicKey,
        strangemoodProgramId,
      }),
      ix.initListing({
        signerPubkey: keys.signer,
        listingPubkey: acctKeypair.publicKey,
        mintPubkey: mintKeypair.publicKey,
        solDepositPubkey: params.solDeposit,
        voteDepositPubkey: params.voteDeposit,
        realmPubkey: params.realm,
        charterGovernancePubkey: params.charterGovernance,
        charterPubkey: params.charter,
        priceInLamports: params.priceInLamports,
        governanceProgramId: params.governanceProgramId,
        strangemoodProgramId: strangemoodProgramId,
      })
    );

    const listing = await Strangemood.client.createListing(
      conn,
      Strangemood.MAINNET.STRANGEMOOD_PROGRAM_ID,
      {
        payer: publicKey,
        signer: publicKey,
      },
      {
        solDeposit: Strangemood.MAINNET.STRANGEMOOD_FOUNDATION_SOL_ACCOUNT,
        voteDeposit: Strangemood.MAINNET.STRANGEMOOD_FOUNDATION_VOTE_ACCOUNT,
        realm: Strangemood.MAINNET.STRANGEMOOD_FOUNDATION_REALM,
        charter: Strangemood.MAINNET.STRANGEMOOD_FOUNDATION_CHARTER,
        charterGovernance:
          Strangemood.MAINNET.STRANGEMOOD_FOUNDATION_CHARTER_GOVERNANCE,
        governanceProgramId: Strangemood.MAINNET.GOVERNANCE_PROGRAM_ID,
        priceInLamports: 10,
      }
    );

    console.log(listing);

    try {
      console.log('sent transaction');
      const signature = await sendTransaction(listing.tx, connection);
      console.log(signature);

      await connection.confirmTransaction(signature, 'processed');
      console.log('processed');
    } catch (err) {
      console.log(err);
    }
  }

  if (!publicKey) {
    return (
      <div>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="text-xl">
      <div>
        <WalletMultiButton />
        {/* <SendOneLamportToRandomAddress /> */}
        <button
          className="px-4 border"
          onClick={() => {
            onMakeNewListing();
          }}
        >
          Make new Listing
        </button>
      </div>
    </div>
  );
};

export default Home;
