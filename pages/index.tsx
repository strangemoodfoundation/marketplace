import type { NextPage } from 'next';
import { useListings } from '../lib/useListing';
import GameView from '../components/GameView';
import { useAnchorProvider } from '../lib/useAnchor';
import Link from 'next/link';

const Home: NextPage = () => {
  const listings = useListings();
  const provider = useAnchorProvider();

  return (
    <div className="w-full bg-blue-50 scroll-auto">
      <div
        className={
          'm-auto h-full px-4 py-4 max-w-2xl bg-white border-l border-r'
        }
      >
        <div className="flex flex-row justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Strangemood</h1>
            <p className="opacity-50 ">
              This is a stream of listings on the Strangemood protocol.{' '}
            </p>
          </div>

          <Link href="/upload">
            <a className="underline">Make a new listing</a>
          </Link>
        </div>
        <br />
        {listings.map((l) => (
          <GameView
            key={l.publicKey.toString()}
            publicKey={l.publicKey.toString()}
            listingAccount={l.account}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
