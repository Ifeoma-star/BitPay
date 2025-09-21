import { StxBalanceResponse, WalletInfo } from '@/types/wallet';
import { 
  connect, 
  isConnected,
  disconnect,
  request,
  getLocalStorage
} from '@stacks/connect';
import { 
  verifyMessageSignature
} from '@stacks/encryption';
import { 
  STACKS_TESTNET, 
  STACKS_MAINNET,
  StacksNetwork 
} from '@stacks/network';

// Extend window interface for wallet providers
declare global {
  interface Window {
    StacksProvider?: any;
    LeatherProvider?: any;
    XverseProviders?: any;
  }
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

/**
 * WalletService - Complete BitPay wallet connection and authentication
 * 
 * This service handles:
 * 1. Wallet connection (Stacks wallets like Leather, Xverse)
 * 2. Message signing for authentication
 * 3. Challenge retrieval from backend
 * 4. Registration and login flows with backend
 * 5. Bitcoin streaming integration
 */
class WalletService {
  private network: StacksNetwork;
  private baseURL: string;
  private appConfig = {
    name: 'BitPay',
    icon: typeof window !== 'undefined' ? window.location.origin + '/icons/apple-touch-icon.png' : '',
  };

  // Track explicit wallet connection state
  private explicitlyConnected: boolean = false;

  constructor() {
    const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
    this.network = isMainnet ? STACKS_MAINNET : STACKS_TESTNET;
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    // Check if there's a stored explicit connection
    if (typeof window !== 'undefined') {
      this.explicitlyConnected = localStorage.getItem('bitpay_wallet_explicitly_connected') === 'true';
    }
  }

  /**
   * Mark wallet as explicitly connected
   */
  private markAsExplicitlyConnected(): void {
    this.explicitlyConnected = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('bitpay_wallet_explicitly_connected', 'true');
    }
  }

  /**
   * Clear explicit connection state
   */
  private clearExplicitConnection(): void {
    this.explicitlyConnected = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bitpay_wallet_explicitly_connected');
    }
  }

  /**
   * Check if wallet is explicitly connected through our app
   */
  isExplicitlyConnected(): boolean {
    return this.explicitlyConnected;
  }

  /**
   * Connect to a Stacks wallet
   */
  async connectWallet(appDetails?: {
    name: string;
    icon: string;
  }): Promise<WalletInfo> {
    try {
      console.log("Starting BitPay wallet connection...");
      const response = await connect();
      console.log("Wallet connection response:", response);

      const userData = getLocalStorage();
      console.log("User Data:", userData);
      
      // Helper to safely access wallet response
      const getWalletAddresses = (response: any) => {
        return {
          stx: response?.addresses?.stx?.[0]?.address,
          btc: response?.addresses?.btc?.[0]?.address
        };
      };

      const { stx, btc } = getWalletAddresses(userData);
      console.log("Extracted addresses:", { stx, btc });
      
      if (stx && btc) {
        // Mark as explicitly connected ONLY after successful connection
        this.markAsExplicitlyConnected();
        
        return {
          address: stx,
          publicKey: (userData as any)?.profile?.publicKey || (userData as any)?.publicKey || '',
          profile: (userData as any)?.profile || userData,
          isConnected: true,
        };
      } else {
        throw new Error("Failed to retrieve wallet addresses");
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw new Error('Failed to connect wallet');
    }
  }

  /**
   * Get STX balance for connected wallet
   */
  async getStxBalance(): Promise<bigint> {
    try {
      // First check if wallet was explicitly connected through our app
      if (!this.explicitlyConnected) {
        console.log("Wallet not explicitly connected through BitPay app");
        return BigInt(0);
      }

      const address = await this.getCurrentAddress();
      if (!address) {
        throw new Error('No wallet connected');
      }

      // Use the better API endpoint (v2)
      const apiUrl = this.network === STACKS_MAINNET 
        ? 'https://api.hiro.so'
        : 'https://api.testnet.hiro.so';

      const response = await fetch(`${apiUrl}/extended/v2/addresses/${address}/balances/stx?include_mempool=false`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json() as StxBalanceResponse;
      console.log("STX Balance Response:", data);
      
      // Return balance in microSTX
      return BigInt(data.balance || '0');
    } catch (error) {
      console.error('Error getting STX balance:', error);
      throw new Error('Failed to get STX balance');
    }
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return {
      network: this.network,
      isMainnet: this.network === STACKS_MAINNET,
      stacksApiUrl: this.network === STACKS_MAINNET 
        ? 'https://api.mainnet.hiro.so'
        : 'https://api.testnet.hiro.so',
    };
  }

  /**
   * Get current wallet address if explicitly connected
   */
  async getCurrentAddress(): Promise<string | null> {
    try {
      // First check if wallet was explicitly connected through our app
      if (!this.explicitlyConnected) {
        console.log("Wallet not explicitly connected through BitPay app");
        return null;
      }

      if (!isConnected()) {
        // Clear our explicit connection flag if Stacks connect says not connected
        this.clearExplicitConnection();
        return null;
      }

      const userData = getLocalStorage();
      
      // Helper to safely access wallet response
      const getWalletAddresses = (response: any) => {
        return {
          stx: response?.addresses?.stx?.[0]?.address,
          btc: response?.addresses?.btc?.[0]?.address
        };
      };

      const { stx } = getWalletAddresses(userData);
      return stx || null;
    } catch (error) {
      console.error('Error getting wallet address:', error);
      return null;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    try {
      await disconnect();
      this.clearExplicitConnection();
      console.log('✅ BitPay: Wallet disconnected');
    } catch (error) {
      console.error('❌ Wallet disconnection failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to disconnect wallet');
    }
  }

  async isWalletConnected(): Promise<boolean> {
    try {
      return await isConnected() && this.explicitlyConnected;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }

  /**
   * Get current wallet data if explicitly connected through our app
   */
  async getCurrentWalletData(): Promise<WalletConnectionResult | null> {
    try {
      // First check if wallet was explicitly connected through our app
      if (!this.explicitlyConnected) {
        console.log("Wallet not explicitly connected through BitPay app");
        return null;
      }

      const connected = await isConnected();
      if (!connected) {
        console.log("Stacks wallet not connected");
        // Clear our explicit connection flag if Stacks connect says not connected
        this.clearExplicitConnection();
        return null;
      }

      const walletData = getLocalStorage();
      if (!walletData) {
        console.log("No wallet data available");
        return null;
      }

      console.log("Explicitly connected walletData", walletData)

      // Helper to safely access wallet response
      const getWalletAddresses = (response: any) => {
        return {
          stx: response?.addresses?.stx?.[0]?.address,
          btc: response?.addresses?.btc?.[0]?.address
        };
      };

      const { stx, btc } = getWalletAddresses(walletData);

      if (!stx) {
        console.log("No Stacks address found in wallet data");
        return null;
      }

      return {
        address: stx,
        publicKey: (walletData as any)?.profile?.publicKey || (walletData as any)?.publicKey || '',
        profile: (walletData as any)?.profile || walletData,
        isConnected: true,
        walletType: this.detectWalletType(),
        network: this.network === STACKS_MAINNET ? 'mainnet' : 'testnet',
      };
    } catch (error) {
      console.error('❌ Failed to get current wallet data:', error);
      return null;
    }
  }

  /**
   * Detect wallet type based on available providers
   */
  private detectWalletType(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    if (window.LeatherProvider) return 'leather';
    if (window.XverseProviders) return 'xverse';
    if (window.StacksProvider) return 'stacks';
    
    return 'unknown';
  }

  /**
   * Sign a message with the connected wallet
   */
  async signMessage(message: string): Promise<WalletSignatureResult> {
    try {
      const walletData = await this.getCurrentWalletData();
      if (!walletData) {
        throw new Error('No wallet connected');
      }

      console.log('✍️ BitPay: Signing message with wallet...');
      console.log('📝 Message to sign:', message);
      console.log('🔑 Using public key:', walletData.publicKey);

      // Use the modern request API for message signing
      const result = await request('stx_signMessage', {
        message,
        publicKey: walletData.publicKey
      });

      console.log('✅ Message signed successfully');
      console.log('🔏 Raw signature result:', result);

      return {
        signature: result.signature,
        publicKey: result.publicKey,
        address: walletData.address,
        message: message,
      };

    } catch (error) {
      console.error('❌ Message signing failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to sign message');
    }
  }

  /**
   * Verify a message signature locally
   */
  verifySignature(message: string, signature: string, publicKey: string): boolean {
    try {
      return verifyMessageSignature({
        message,
        signature,
        publicKey,
      });
    } catch (error) {
      console.error('❌ Local signature verification failed:', error);
      return false;
    }
  }

  // =================================================================
  // BACKEND INTEGRATION METHODS
  // =================================================================

  /**
   * Get challenge from backend for wallet authentication
   */
  private async getChallengeFromBackend(
    address: string, 
    type: 'connection' | 'payment' = 'connection',
    paymentId?: string,
    amount?: number
  ): Promise<{ challenge: string; expiresAt: string }> {
    try {
      console.log('🔄 Getting challenge from backend for address:', address);
      console.log('🌐 Base URL:', this.baseURL);
      
      const params = new URLSearchParams({
        address,
        type,
        ...(paymentId && { paymentId }),
        ...(amount && { amount: amount.toString() }),
      });

      const fullUrl = `${this.baseURL}/api/auth/wallet/challenge?${params}`;
      console.log('📡 Making request to:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies in request
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get challenge from backend');
      }

      console.log('✅ Challenge received from backend');
      return {
        challenge: data.challenge,
        expiresAt: data.expiresAt
      };
      
    } catch (error) {
      console.error('❌ Failed to get challenge from backend:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get authentication challenge');
    }
  }

  /**
   * Register new user with wallet authentication
   */
  async registerWithWallet(): Promise<any> {
    try {
      console.log('🔄 Starting BitPay wallet registration...');

      // Step 1: Connect wallet
      const walletData = await this.connectWallet();
      console.log('✅ Wallet connected for registration');

      // Step 2: Get challenge from backend
      const { challenge } = await this.getChallengeFromBackend(walletData.address, 'connection');
      console.log('🔑 Received challenge from backend:', challenge);

      // Step 3: Sign the challenge
      const signatureData = await this.signMessage(challenge);
      console.log('✍️ Signed challenge, message being sent:', challenge);

      // Step 4: Send registration data to backend
      const registrationData = {
        address: walletData.address,
        signature: signatureData.signature,
        message: challenge,
        publicKey: signatureData.publicKey,
        walletType: 'stacks' as const,
      };

      console.log('📤 Sending registration data:', {
        address: registrationData.address,
        message: registrationData.message,
        signature: registrationData.signature,
        publicKey: registrationData.publicKey,
        walletType: registrationData.walletType,
      });
      
      const response = await fetch(`${this.baseURL}/api/auth/register/wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies in request
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Registration failed' }));
        console.error('❌ Backend registration error:', errorData);
        throw new Error(errorData.error || `Registration failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      console.log('✅ BitPay wallet registration successful', {
        profileComplete: result.user?.profileComplete,
        message: result.message
      });
      
      // No need to store tokens - they are in httpOnly cookies
      return result;
      
    } catch (error) {
      console.error('❌ Wallet registration failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to register with wallet');
    }
  }

  /**
   * Login with wallet authentication
   */
  async loginWithWallet(): Promise<any> {
    try {
      console.log('🔄 Starting BitPay wallet login...');

      // Step 1: Connect wallet (or use existing connection)
      const walletData = await this.connectWallet();
      console.log('✅ Wallet connected for login');

      // Step 2: Get challenge from backend
      const { challenge } = await this.getChallengeFromBackend(walletData.address, 'connection');

      // Step 3: Sign the challenge
      const signatureData = await this.signMessage(challenge);

      // Step 4: Send login data to backend
      const loginData = {
        address: walletData.address,
        signature: signatureData.signature,
        message: challenge,
        publicKey: signatureData.publicKey,
        walletType: 'stacks' as const,
      };

      console.log('📤 Sending login to backend...');
      const response = await fetch(`${this.baseURL}/api/auth/login/wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies in request
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(errorData.error || `Login failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      console.log('✅ BitPay wallet login successful');
      
      // No need to store tokens - they are in httpOnly cookies
      return result;
      
    } catch (error) {
      console.error('❌ Wallet login failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to login with wallet');
    }
  }
}

// Export singleton instance
export const walletService = new WalletService();
export default walletService;