import {
    MAINNET,
    fetchStrangemoodProgram,
    Strangemood,
    purchaseListing,
} from '@strangemood/strangemood';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useAnchorProvider } from '../../lib/useAnchor';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Program } from '@project-serum/anchor';
import { useRouter } from 'next/router'
import ErrorPage from 'next/error'

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

function useListing(listingPublicKey: string): Listing | null {
    const [state, setState] = useState<any>();
    const program = useStrangemoodProgram();
    const router = useRouter();

    useEffect(() => {
        if (!program) return;


        program.account.listing.fetch(listingPublicKey).then((listing) => {
            console.log("Found listing");
            console.log(listing);
            setState(listing);
        }).catch(() => {
            setState(null)
        });

    }, [!!program, router]);

    return state;
}

export default function Page() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [signature, setSignature] = useState<string>();
    const provider = useAnchorProvider();
    const { listingPublicKey } = useRouter().query;
    const listing = useListing(listingPublicKey as string);

    async function onPurchaseListing(account: Listing) {
        if (!publicKey || !listingPublicKey) {
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
            {
                publicKey: new PublicKey(listingPublicKey as string),
                account: account
            }
        );

        const sig = await sendTransaction(tx, connection, { signers });
        setSignature(sig);
    }

    if (listing !== undefined && !listing) { // checking undefined on purpose, null means listing not found
        return <ErrorPage statusCode={404} />
    } else if (!listing) {
        return "Loading..." // TODO: replace this with a loading div
    } else if (!listing.isAvailable && listing.isInitialized) {
        return "This listing is not available"
    } else {
        return (
            <div>
                {!publicKey && <WalletMultiButton />}
                <div>Transaction sig: {signature}</div>
                {listingPublicKey}
                <button
                    className="border hover:bg-blue-200"
                    onClick={() => onPurchaseListing(listing)}
                >
                    {listing.price.toString()}
                </button>
            </div>
        );
    }
}
