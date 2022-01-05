import { Program } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import {
  fetchStrangemoodProgram,
  Listing,
  Strangemood,
} from '@strangemood/strangemood';
import { useEffect, useState } from 'react';
import { CLUSTER } from './constants';
import { OpenMetaGraph } from './omg';
import { useAnchorProvider } from './useAnchor';
import { useSWR } from './useSWR';
import * as splToken from '@solana/spl-token';

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

export function useListingMetadata(listing: any) {
  return useSWR<OpenMetaGraph>(
    listing &&
      listing.uri &&
      `https://ipfs.io/ipfs/${((listing?.uri as string) || '').replace(
        'ipfs://',
        ''
      )}`
  );
}

export function useListing(provider: any, pubkey: string): Listing {
  const [listing, setListing] = useState<Listing>();

  useEffect(() => {
    async function load() {
      if (!provider) return;
      const strangemood = await fetchStrangemoodProgram(
        provider,
        CLUSTER.STRANGEMOOD_PROGRAM_ID
      );

      const listing = await strangemood.account.listing.fetch(pubkey as string);
      setListing(listing);
    }
    load();
  }, [!!provider]);

  return listing as Listing;
}

export function useListings(): Array<{
  publicKey: PublicKey;
  account: Listing;
}> {
  const [state, setState] = useState<any>([]);
  const program = useStrangemoodProgram();

  useEffect(() => {
    if (!program) return;

    program.account.listing.all().then((listings) => {
      setState(listings);
    });
  }, [!!program]);

  return state;
}

export async function getStrangemoodAssociatedTokenAddress(user: PublicKey) {
  // Find or create an associated vote token account
  const associatedVoteAddress = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    CLUSTER.STRANGEMOOD_FOUNDATION_MINT,
    user
  );

  const associatedSolAddress = await splToken.Token.getAssociatedTokenAddress(
    splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
    splToken.TOKEN_PROGRAM_ID,
    splToken.NATIVE_MINT,
    user
  );

  return { associatedVoteAddress, associatedSolAddress };
}
