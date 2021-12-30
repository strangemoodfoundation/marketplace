import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { useRouter } from 'next/router';
import { tob58 } from '../../lib/b58';

const SERVICES_URL = 'https://api.strangemood.org';

function Page() {
  const router = useRouter();
  const listingPubkey = router.query.pubkey;
  const { publicKey, sendTransaction, signMessage } = useWallet();

  async function postMetadata() {
    if (!signMessage) return;

    let challengeResponse = await fetch(
      SERVICES_URL + '/v1/challenge/' + publicKey,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scope: `listing/${listingPubkey}`,
        }),
      }
    );

    const challenge = await challengeResponse.text();
    let msg = Buffer.from(challenge);
    const result = await signMessage(msg);
    const signature = tob58(result);

    let listingResponse = await fetch(
      SERVICES_URL + '/v1/listings/' + listingPubkey,
      {
        method: 'POST',
        headers: {
          Authorization: signature,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          version: '0.0.1',
          elements: [
            {
              key: 'title',
              type: 'plain/text',
              value: 'Cool Boy 123',
            },
          ],
        }),
      }
    );

    console.log(await listingResponse.json());
  }

  return (
    <div>
      {!publicKey && <WalletMultiButton />}
      <div>
        <button onClick={postMetadata}>{listingPubkey}</button>
      </div>
    </div>
  );
}

export default Page;
