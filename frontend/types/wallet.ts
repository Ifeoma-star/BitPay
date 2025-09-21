export interface StxBalanceResponse {
  balance: string;
  locked: string;
  total_sent: string;
  total_received: string;
  total_fees_sent: string;
  total_miner_rewards_received: string;
  burn_block_time: number;
  burn_block_height: number;
  last_tx_id: string;
}

export interface WalletInfo {
  address: string;
  publicKey: string;
  profile?: any;
  isConnected: boolean;
}

export interface WalletConnectionResult {
  address: string;
  publicKey: string;
  profile?: any;
  isConnected: boolean;
  walletType: string;
  network: 'mainnet' | 'testnet';
}

export interface WalletSignatureResult {
  signature: string;
  publicKey: string;
  address: string;
  message: string;
}

export interface WalletAuthData {
  address: string;
  signature: string;
  message: string;
  publicKey: string;
  walletType: 'stacks';
  verified: boolean;
}

export interface WalletRegistrationData extends WalletAuthData {
  businessName: string;
  businessType: string;
  email?: string;
}