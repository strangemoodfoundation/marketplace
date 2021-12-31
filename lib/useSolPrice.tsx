import { useSWR } from './useSWR';

export function useSolPrice() {
  const { data, error } = useSWR<any>(
    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
  );

  if (!data) return 0;
  if (error) return 0;

  return data.solana.usd;
}
