import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Login() {
  return (
    <div className="h-full w-full bg-blue-50 flex">
      <div className="m-auto max-w-lg w-full rounded-sm border-blue-100 border bg-white p-4">
        <h2 className="text-xl font-bold mb-1">Login to Strangemood.org</h2>
        <p className="opacity-50 mb-4">
          This demo requires you to login with a Solana compatible
          crypto-wallet, like{' '}
          <a className="underline" href="https://phantom.app/">
            Phantom
          </a>
          ,{' '}
          <a className="underline" href="https://slope.finance/">
            Slope
          </a>
          , or{' '}
          <a className="underline" href="https://www.ledger.com/">
            Ledger
          </a>
          .
        </p>

        <div>
          <WalletMultiButton />
        </div>
      </div>
    </div>
  );
}
