import { MAINNET, TESTNET } from '@strangemood/strangemood';

export const CLUSTER =
  process.env.NODE_ENV === 'development' ? TESTNET : MAINNET;
