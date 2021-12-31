import { useRouter } from 'next/router';

export default function Checkout() {
  const router = useRouter();

  return (
    <div className="bg-blue-50 h-full w-full">
      <div className="flex flex-col mx-auto max-w-2xl border-l border-r bg-white h-full px-4 py-4">
        <h2 className="mb-1 text-xl font-bold">Hey there</h2>
        <p className="opacity-50 mb-4">Hey there</p>
        {router.query.pubkey}
      </div>
    </div>
  );
}
