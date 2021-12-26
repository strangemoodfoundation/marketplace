import {
  MAINNET,
  fetchStrangemoodProgram,
  Strangemood,
  pda,
  initListing,
  purchaseListing,
} from '@strangemood/strangemood';
import * as anchor from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { useAnchorProvider } from '../lib/useAnchor';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Program } from '@project-serum/anchor';
import * as splToken from '@solana/spl-token';
const { SystemProgram, SYSVAR_RENT_PUBKEY } = anchor.web3;

// export async function initListing(
//   program: Program<any>,
//   conn: Connection,
//   user: PublicKey
// ): Promise<[Transaction, Keypair[]]> {
//   const mintKeypair = anchor.web3.Keypair.generate();

//   let tx = new Transaction();

//   let [listingMintAuthority, listingMintBump] = await pda.mint(
//     program.programId,
//     mintKeypair.publicKey
//   );
//   let [listingPDA, listingBump] = await pda.listing(
//     program.programId,
//     mintKeypair.publicKey
//   );

//   console.log(listingMintAuthority.toString(), listingPDA.toString());

//   // Find or create an associated vote token account
//   let associatedVoteAddress = await splToken.Token.getAssociatedTokenAddress(
//     splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
//     splToken.TOKEN_PROGRAM_ID,
//     MAINNET.STRANGEMOOD_FOUNDATION_MINT,
//     user
//   );
//   if (!(await conn.getAccountInfo(associatedVoteAddress))) {
//     tx.add(
//       splToken.Token.createAssociatedTokenAccountInstruction(
//         splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
//         splToken.TOKEN_PROGRAM_ID,
//         MAINNET.STRANGEMOOD_FOUNDATION_MINT,
//         associatedVoteAddress,
//         user,
//         user
//       )
//     );
//   }

//   // Find or create an associated wrapped sol account
//   let associatedSolAddress = await splToken.Token.getAssociatedTokenAddress(
//     splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
//     splToken.TOKEN_PROGRAM_ID,
//     splToken.NATIVE_MINT,
//     user
//   );
//   if (!(await conn.getAccountInfo(associatedSolAddress))) {
//     tx.add(
//       splToken.Token.createAssociatedTokenAccountInstruction(
//         splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
//         splToken.TOKEN_PROGRAM_ID,
//         splToken.NATIVE_MINT,
//         associatedSolAddress,
//         user,
//         user
//       )
//     );
//   }

//   let init_instruction_ix = program.instruction.initListing(
//     listingMintBump,
//     listingBump,
//     new anchor.BN(10),
//     {
//       accounts: {
//         listing: listingPDA,
//         mint: mintKeypair.publicKey,
//         mintAuthorityPda: listingMintAuthority,
//         rent: SYSVAR_RENT_PUBKEY,
//         solDeposit: associatedSolAddress,
//         voteDeposit: associatedVoteAddress,
//         realm: MAINNET.STRANGEMOOD_FOUNDATION_REALM,
//         governanceProgram: MAINNET.GOVERNANCE_PROGRAM_ID,
//         charter: MAINNET.STRANGEMOOD_FOUNDATION_CHARTER,
//         charterGovernance: MAINNET.STRANGEMOOD_FOUNDATION_CHARTER_GOVERNANCE,
//         tokenProgram: splToken.TOKEN_PROGRAM_ID,
//         user: user,
//         systemProgram: SystemProgram.programId,
//       },
//       signers: [mintKeypair],
//     }
//   );
//   tx.add(init_instruction_ix);

//   return [tx, [mintKeypair]];
// }

function useStrangemoodProgram() {
  const provider = useAnchorProvider();
  const [program, setProgram] = useState<Program<Strangemood>>();

  useEffect(() => {
    fetchStrangemoodProgram(provider).then((program) =>
      setProgram(program as any)
    );
  }, []);

  return program;
}

type Listing = Awaited<
  ReturnType<Program<Strangemood>['account']['listing']['fetch']>
>;

function useListings(): Array<{
  publicKey: PublicKey;
  account: Listing;
}> {
  const [state, setState] = useState<any>([]);
  const program = useStrangemoodProgram();

  useEffect(() => {
    if (!program) return;

    console.log('listings', program);

    program.account.listing.all().then((listings) => {
      console.log('got listings');
      setState(listings);
    });
  }, [!!program]);

  return state;
}

export default function Page() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [signature, setSignature] = useState<string>();
  const provider = useAnchorProvider();
  const listings = useListings();

  async function onNewListing() {
    if (!publicKey) {
      return;
    }

    const strangemood = await fetchStrangemoodProgram(
      provider,
      MAINNET.STRANGEMOOD_PROGRAM_ID
    );
    const [tx, signers] = await initListing(
      strangemood as any,
      connection,
      publicKey
    );
    const sig = await sendTransaction(tx, connection, { signers });
    setSignature(sig);
  }

  async function onPurchaseListing(listing: {
    account: Listing;
    publicKey: PublicKey;
  }) {
    if (!publicKey) {
      return;
    }

    const strangemood = await fetchStrangemoodProgram(
      provider,
      MAINNET.STRANGEMOOD_PROGRAM_ID
    );
    const [tx, signers] = await purchaseListing(
      strangemood as any,
      connection,
      publicKey,
      listing
    );
    const sig = await sendTransaction(tx, connection, { signers });
    setSignature(sig);
  }

  return (
    <div>
      {!publicKey && <WalletMultiButton />}

      <button onClick={onNewListing}>Create Listing</button>
      <div>{signature}</div>

      {listings.map((l) => (
        <div>
          {l.publicKey.toString()}
          <button
            className="border hover:bg-blue-200"
            key={l.publicKey.toString()}
            onClick={() => onPurchaseListing(l)}
          >
            {l.account.price.toString()}
          </button>
        </div>
      ))}
    </div>
  );
}
