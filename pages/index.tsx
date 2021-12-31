import type { NextPage } from 'next';

import { useListings } from '../lib/useListing';
import GameView from '../components/GameView';
import { useAnchorProvider } from '../lib/useAnchor';

const Home: NextPage = () => {
  const listings = useListings();
  const provider = useAnchorProvider();

  return (
    <div className="w-full h-full bg-blue-50">
      <div
        className={
          'm-auto h-full px-4 py-4 max-w-2xl bg-white border-l border-r'
        }
      >
        <div className="flex flex-row justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Strangemood</h1>
            <p className="opacity-50">
              This is a stream of listings on the Strangemood protocol.
            </p>
          </div>

          <a href="/upload" className="underline">
            Make a new listing
          </a>
        </div>
        <br />
        {listings.map((l) => (
          <GameView publicKey={l.publicKey.toString()} provider={provider} />
        ))}
      </div>
    </div>
  );
};

export default Home;
