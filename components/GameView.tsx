import { useSWR } from '../lib/useSWR';
import { OpenMetaGraph } from '../lib/omg';
import { useListing } from '../lib/useListing';
import Link from 'next/link'

function grabValue(data: OpenMetaGraph, key: string): string {
  return (data.elements.find((e) => e.key === key) as any).value;
}

export default function GameView(props: { publicKey: string; provider: any }) {
  const listing = useListing(props.provider, props.publicKey);
  const { data } = useSWR<OpenMetaGraph>(
    listing &&
      listing.uri &&
      `https://ipfs.io/ipfs/${((listing?.uri as string) || '').replace(
        'ipfs://',
        ''
      )}`
  );

  if (!listing || !listing.uri || !data) return null;

  if (!data) {
    return <div className="mx-auto max-w-2xl py-4 animate-pulse h-24"></div>;
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      <h1 className="text-lg font-bold mb-1">{grabValue(data, 'title')}</h1>
      <Link href={`/listing/${props.publicKey}`}>
        <p className="opacity-50 mb-4 text-sm font-mono hover:underline">{props.publicKey}</p>
      </Link>
      <p className="">{grabValue(data, 'description').trim()}</p>
    </div>
  );
}
