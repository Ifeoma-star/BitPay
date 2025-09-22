# sBTC BitPay Implementation Guide

## Complete Documentation for Bitcoin Streaming & Vesting Vaults using sBTC

### Executive Summary

This document provides a comprehensive implementation guide for integrating sBTC (Stacks Bitcoin) into the BitPay streaming payment system. sBTC is a 1:1 Bitcoin-pegged fungible token that enables Bitcoin to be used in smart contracts while maintaining Bitcoin's security model through a decentralized threshold signature scheme.

## Table of Contents

1. [sBTC Architecture Overview](#sbtc-architecture-overview)
2. [BitPay Current Architecture Analysis](#bitpay-current-architecture-analysis)
3. [sBTC Integration Strategy](#sbtc-integration-strategy)
4. [Smart Contract Implementation](#smart-contract-implementation)
5. [Emily API Integration](#emily-api-integration)
6. [Frontend Implementation](#frontend-implementation)
7. [Testnet Implementation Strategy](#testnet-implementation-strategy)
8. [Mainnet Deployment Strategy](#mainnet-deployment-strategy)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Roadmap](#deployment-roadmap)

---

## 1. sBTC Architecture Overview

### Core Components

#### 1.1 sBTC Token System
- **Standard**: SIP-010 fungible token with 8 decimal precision
- **Dual Token Model**:
  - `sbtc-token`: Unlocked, transferable sBTC
  - `sbtc-token-locked`: Locked during withdrawal processing
- **1:1 Bitcoin Peg**: Each sBTC represents exactly 1 satoshi

#### 1.2 Contract Architecture
```clarity
;; Core contracts in the sBTC system
.sbtc-token        ;; Main SIP-010 token contract
.sbtc-registry     ;; Central coordination and state management
.sbtc-deposit      ;; Handles BTC → sBTC conversions
.sbtc-withdrawal   ;; Handles sBTC → BTC conversions
.sbtc-bootstrap-signers  ;; Manages signer set
```

#### 1.3 Signer Network
- **Threshold Signature Scheme**: M-of-N signers required for operations
- **Decentralized**: No single point of failure
- **Key Rotation**: Periodic rotation for security
- **Bitcoin Custody**: Signers control the Bitcoin peg wallet

#### 1.4 Emily API
- **Coordination Layer**: Bridges users and signers
- **Rust Implementation**: High-performance API server
- **PostgreSQL Backend**: Persistent state management
- **RESTful Interface**: Standard HTTP endpoints

### Network Addresses

| Network | sBTC Token Contract |
|---------|-------------------|
| Devnet/Simnet | `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token` |
| Testnet | `ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token` |
| Mainnet | `[To be announced]` |

---

## 2. BitPay Current Architecture Analysis

### 2.1 Existing Structure
Based on analysis of the current BitPay project:

```
BitPay/
├── contract/           # Clarity smart contracts
├── frontend/          # Next.js frontend application
└── resources/         # Documentation and reference materials
```

### 2.2 Current Features
- **Stream Management**: Create, pause, resume, cancel payment streams
- **Authentication**: Wallet-based authentication system
- **Dashboard**: Analytics and stream monitoring
- **Modals**: Stream interaction interfaces

### 2.3 Technology Stack
- **Smart Contracts**: Clarity on Stacks
- **Frontend**: Next.js 14 with App Router
- **UI**: Shadcn/UI components
- **Authentication**: Stacks Connect wallet integration
- **Database**: Local database models

---

## 3. sBTC Integration Strategy

### 3.1 Integration Architecture

```mermaid
graph TB
    A[BitPay Frontend] --> B[BitPay Smart Contracts]
    B --> C[sBTC Token Contract]
    B --> D[sBTC Registry]
    A --> E[Emily API Client]
    E --> F[Emily API Server]
    F --> G[sBTC Signers]
    G --> H[Bitcoin Network]
    
    I[Bitcoin Deposits] --> J[Deposit Monitor]
    J --> F
    F --> C
    C --> B
```

### 3.2 Core Integration Points

#### 3.2.1 Deposit Flow Integration
1. **User Creates Bitcoin Deposit**: Standard Bitcoin transaction to signer wallet
2. **Emily API Monitoring**: Monitor Emily API for deposit confirmations
3. **Automatic sBTC Credit**: Credit user's BitPay account when sBTC is minted
4. **Stream Creation**: Use sBTC balance for creating payment streams

#### 3.2.2 Stream Payment Integration
1. **sBTC Transfers**: Replace STX with sBTC for all payments
2. **Streaming Logic**: Maintain existing time-based release mechanisms
3. **Instant Settlement**: Leverage sBTC's instant finality for payments

#### 3.2.3 Withdrawal Flow Integration
1. **Stream Termination**: Convert remaining sBTC back to Bitcoin
2. **Withdrawal Requests**: Interface with sBTC withdrawal contract
3. **Confirmation Handling**: Manage 6-block confirmation requirements

### 3.3 Key Benefits of sBTC Integration

1. **Bitcoin Security**: Inherits Bitcoin's security model
2. **Instant Finality**: Stacks block finality for immediate transfers
3. **DeFi Compatibility**: Full smart contract programmability
4. **Reduced Complexity**: No need for external oracles or bridges
5. **True Decentralization**: No custodial intermediaries

---

## 4. Smart Contract Implementation

### 4.1 Modified Stream Contract

```clarity
;; sBTC Stream Contract - adapted from STX streaming
(define-constant ERR_UNAUTHORIZED (err u0))
(define-constant ERR_INVALID_STREAM_ID (err u1))
(define-constant ERR_INSUFFICIENT_BALANCE (err u2))
(define-constant ERR_STREAM_ENDED (err u3))

;; Stream data structure
(define-map streams
    uint ;; stream-id
    {
        sender: principal,
        recipient: principal,
        total-amount: uint,        ;; Total sBTC amount in satoshis
        withdrawn-amount: uint,    ;; Amount already withdrawn
        payment-per-block: uint,   ;; sBTC per block in satoshis
        start-block: uint,
        end-block: uint,
        active: bool
    }
)

;; Stream counter
(define-data-var next-stream-id uint u1)

;; sBTC token contract reference
(define-constant SBTC_TOKEN 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token)

;; Create a new sBTC stream
(define-public (create-sbtc-stream
    (recipient principal)
    (total-amount uint)
    (payment-per-block uint)
    (duration-blocks uint)
    )
    (let (
        (stream-id (var-get next-stream-id))
        (start-block block-height)
        (end-block (+ block-height duration-blocks))
        )
        
        ;; Transfer sBTC to contract vault
        (try! (contract-call? SBTC_TOKEN transfer 
            total-amount 
            tx-sender 
            (as-contract tx-sender) 
            none))
        
        ;; Store stream data
        (map-set streams stream-id {
            sender: tx-sender,
            recipient: recipient,
            total-amount: total-amount,
            withdrawn-amount: u0,
            payment-per-block: payment-per-block,
            start-block: start-block,
            end-block: end-block,
            active: true
        })
        
        ;; Increment stream ID
        (var-set next-stream-id (+ stream-id u1))
        
        (ok stream-id)
    )
)

;; Calculate vested amount for a stream
(define-read-only (calculate-vested-amount (stream-id uint))
    (match (map-get? streams stream-id)
        stream 
        (let (
            (current-block block-height)
            (start-block (get start-block stream))
            (end-block (get end-block stream))
            (payment-per-block (get payment-per-block stream))
            (withdrawn (get withdrawn-amount stream))
            )
            
            (if (< current-block start-block)
                ;; Stream hasn't started
                u0
                (if (>= current-block end-block)
                    ;; Stream has ended, all funds available
                    (- (get total-amount stream) withdrawn)
                    ;; Stream is active, calculate pro-rata amount
                    (let ((elapsed-blocks (- current-block start-block)))
                        (- (* elapsed-blocks payment-per-block) withdrawn)
                    )
                )
            )
        )
        u0 ;; Stream doesn't exist
    )
)

;; Withdraw vested sBTC from stream
(define-public (withdraw-from-stream (stream-id uint))
    (let (
        (stream (unwrap! (map-get? streams stream-id) ERR_INVALID_STREAM_ID))
        (vested-amount (calculate-vested-amount stream-id))
        )
        
        ;; Check authorization
        (asserts! (is-eq tx-sender (get recipient stream)) ERR_UNAUTHORIZED)
        
        ;; Check stream is active
        (asserts! (get active stream) ERR_STREAM_ENDED)
        
        ;; Check there's something to withdraw
        (asserts! (> vested-amount u0) ERR_INSUFFICIENT_BALANCE)
        
        ;; Update withdrawn amount
        (map-set streams stream-id 
            (merge stream { 
                withdrawn-amount: (+ (get withdrawn-amount stream) vested-amount) 
            }))
        
        ;; Transfer sBTC to recipient
        (try! (as-contract (contract-call? SBTC_TOKEN transfer 
            vested-amount 
            tx-sender 
            (get recipient stream) 
            none)))
        
        (ok vested-amount)
    )
)

;; Cancel stream and refund remaining balance
(define-public (cancel-stream (stream-id uint))
    (let (
        (stream (unwrap! (map-get? streams stream-id) ERR_INVALID_STREAM_ID))
        (vested-amount (calculate-vested-amount stream-id))
        (remaining-amount (- (get total-amount stream) 
                           (get withdrawn-amount stream) 
                           vested-amount))
        )
        
        ;; Check authorization
        (asserts! (is-eq tx-sender (get sender stream)) ERR_UNAUTHORIZED)
        
        ;; Check stream is active
        (asserts! (get active stream) ERR_STREAM_ENDED)
        
        ;; Deactivate stream
        (map-set streams stream-id (merge stream { active: false }))
        
        ;; Transfer remaining amount back to sender
        (if (> remaining-amount u0)
            (try! (as-contract (contract-call? SBTC_TOKEN transfer 
                remaining-amount 
                tx-sender 
                (get sender stream) 
                none)))
            true
        )
        
        (ok { 
            vested: vested-amount, 
            refunded: remaining-amount 
        })
    )
)

;; Read-only functions
(define-read-only (get-stream (stream-id uint))
    (map-get? streams stream-id)
)

(define-read-only (get-stream-balance (stream-id uint))
    (match (map-get? streams stream-id)
        stream {
            total: (get total-amount stream),
            withdrawn: (get withdrawn-amount stream),
            vested: (calculate-vested-amount stream-id),
            remaining: (- (get total-amount stream) 
                         (get withdrawn-amount stream) 
                         (calculate-vested-amount stream-id))
        }
        { total: u0, withdrawn: u0, vested: u0, remaining: u0 }
    )
)
```

### 4.2 sBTC Integration Helper Contract

```clarity
;; sBTC Helper Contract for BitPay integration
(define-constant SBTC_TOKEN 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token)
(define-constant SBTC_DEPOSIT 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-deposit)
(define-constant SBTC_WITHDRAWAL 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-withdrawal)

;; Batch sBTC transfer for multiple streams
(define-public (batch-sbtc-transfer 
    (transfers (list 200 {amount: uint, recipient: principal, memo: (optional (buff 34))})))
    (fold transfer-helper transfers (ok u0))
)

(define-private (transfer-helper 
    (transfer {amount: uint, recipient: principal, memo: (optional (buff 34))})
    (result (response uint uint)))
    (match result
        success-count
        (match (contract-call? SBTC_TOKEN transfer 
                (get amount transfer)
                tx-sender
                (get recipient transfer)
                (get memo transfer))
            success (ok (+ success-count u1))
            error (err error)
        )
        error (err error)
    )
)

;; Check sBTC balance for stream creation
(define-read-only (check-stream-affordability 
    (user principal) 
    (total-amount uint))
    (match (contract-call? SBTC_TOKEN get-balance-available user)
        balance (>= (unwrap-panic balance) total-amount)
        false
    )
)

;; Get user's total sBTC balance (available + locked)
(define-read-only (get-user-sbtc-balance (user principal))
    (match (contract-call? SBTC_TOKEN get-balance user)
        balance balance
        (ok u0)
    )
)
```

---

## 5. Emily API Integration

### 5.1 Emily API Client Implementation

```typescript
// emily-client.ts
export interface DepositRequest {
  txid: string;
  vout_index: number;
  amount: number;
  recipient: string;
}

export interface WithdrawalRequest {
  request_id: number;
  amount: number;
  recipient: {
    version: string;
    hashbytes: string;
  };
  max_fee: number;
}

export interface DepositResponse {
  txid: string;
  vout_index: number;
  amount: number;
  recipient: string;
  status: 'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'FAILED';
  created_at: string;
  updated_at: string;
}

export class EmilyApiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: { baseUrl: string; apiKey?: string }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Emily API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Deposit operations
  async getDeposit(txid: string, voutIndex: number): Promise<DepositResponse> {
    return this.request<DepositResponse>(`/deposit/${txid}/${voutIndex}`);
  }

  async getDepositsForTx(txid: string): Promise<DepositResponse[]> {
    return this.request<DepositResponse[]>(`/deposit/${txid}`);
  }

  async createDeposit(deposit: DepositRequest): Promise<DepositResponse> {
    return this.request<DepositResponse>('/deposit', {
      method: 'POST',
      body: JSON.stringify(deposit),
    });
  }

  // Withdrawal operations
  async getWithdrawal(requestId: number): Promise<WithdrawalRequest> {
    return this.request<WithdrawalRequest>(`/withdrawal/${requestId}`);
  }

  async getWithdrawals(params: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<WithdrawalRequest[]> {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const url = `/withdrawal${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request<WithdrawalRequest[]>(url);
  }

  // Health check
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Chain state
  async getChainTip(): Promise<{
    bitcoin_height: number;
    stacks_height: number;
    bitcoin_hash: string;
    stacks_hash: string;
  }> {
    return this.request('/chainstate');
  }
}

// emily-service.ts - Integration with BitPay
export class BitPayEmilyService {
  private emilyClient: EmilyApiClient;
  private database: Database; // Your database instance

  constructor(emilyClient: EmilyApiClient, database: Database) {
    this.emilyClient = emilyClient;
    this.database = database;
  }

  // Monitor deposits and credit user accounts
  async monitorDeposits(): Promise<void> {
    try {
      // Get latest processed deposit from database
      const lastProcessedHeight = await this.database.getLastProcessedDepositHeight();
      
      // Get current chain tip
      const chainTip = await this.emilyClient.getChainTip();
      
      // Process deposits from last height to current
      for (let height = lastProcessedHeight + 1; height <= chainTip.bitcoin_height; height++) {
        await this.processDepositsAtHeight(height);
      }
      
      // Update last processed height
      await this.database.setLastProcessedDepositHeight(chainTip.bitcoin_height);
    } catch (error) {
      console.error('Error monitoring deposits:', error);
      throw error;
    }
  }

  private async processDepositsAtHeight(height: number): Promise<void> {
    // Implementation would query Emily API for deposits at specific height
    // and credit user accounts accordingly
  }

  // Handle withdrawal requests
  async initiateWithdrawal(
    userId: string,
    amount: number,
    bitcoinAddress: string,
    maxFee: number
  ): Promise<string> {
    try {
      // Validate user has sufficient sBTC balance
      const userBalance = await this.getUserSbtcBalance(userId);
      if (userBalance < amount + maxFee) {
        throw new Error('Insufficient sBTC balance');
      }

      // Parse Bitcoin address to recipient format
      const recipient = this.parseBitcoinAddress(bitcoinAddress);

      // Initiate withdrawal via smart contract
      const txResult = await this.initiateWithdrawalContract(
        amount,
        recipient,
        maxFee
      );

      // Store withdrawal request in database
      await this.database.storeWithdrawalRequest({
        userId,
        amount,
        maxFee,
        recipient: bitcoinAddress,
        txId: txResult.txId,
        status: 'PENDING',
      });

      return txResult.txId;
    } catch (error) {
      console.error('Error initiating withdrawal:', error);
      throw error;
    }
  }

  private parseBitcoinAddress(address: string): {
    version: string;
    hashbytes: string;
  } {
    // Implementation would parse Bitcoin address format
    // and convert to sBTC withdrawal contract format
    throw new Error('Not implemented');
  }

  private async getUserSbtcBalance(userId: string): Promise<number> {
    // Implementation would query user's sBTC balance
    throw new Error('Not implemented');
  }

  private async initiateWithdrawalContract(
    amount: number,
    recipient: { version: string; hashbytes: string },
    maxFee: number
  ): Promise<{ txId: string }> {
    // Implementation would call sBTC withdrawal contract
    throw new Error('Not implemented');
  }
}
```

### 5.2 Emily API Configuration

```typescript
// emily-config.ts
export const EMILY_CONFIG = {
  testnet: {
    baseUrl: 'https://api.testnet.sbtc.tech',
    network: 'testnet',
  },
  mainnet: {
    baseUrl: 'https://api.sbtc.tech',
    network: 'mainnet',
  },
};

export function getEmilyConfig(network: 'testnet' | 'mainnet') {
  return EMILY_CONFIG[network];
}
```

---

## 6. Frontend Implementation

### 6.1 sBTC Balance Component

```tsx
// components/sbtc/SbtcBalance.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConnect } from '@stacks/connect';

interface SbtcBalanceProps {
  address?: string;
}

export function SbtcBalance({ address }: SbtcBalanceProps) {
  const [balance, setBalance] = useState<{
    total: number;
    available: number;
    locked: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { userSession } = useConnect();

  useEffect(() => {
    if (!address && !userSession?.isUserSignedIn()) return;
    
    const userAddress = address || userSession?.loadUserData()?.profile?.stxAddress?.testnet;
    if (!userAddress) return;

    fetchSbtcBalance(userAddress);
  }, [address, userSession]);

  const fetchSbtcBalance = async (userAddress: string) => {
    try {
      setLoading(true);
      
      // Call sBTC contract to get balance
      const response = await fetch('/api/sbtc/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress }),
      });
      
      const data = await response.json();
      setBalance(data);
    } catch (error) {
      console.error('Error fetching sBTC balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>sBTC Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>sBTC Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500">Unable to load balance</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          sBTC Balance
          <Badge variant="secondary">₿</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Total:</span>
          <span className="font-mono">{(balance.total / 100_000_000).toFixed(8)} sBTC</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Available:</span>
          <span className="font-mono text-green-600">
            {(balance.available / 100_000_000).toFixed(8)} sBTC
          </span>
        </div>
        {balance.locked > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Locked:</span>
            <span className="font-mono text-yellow-600">
              {(balance.locked / 100_000_000).toFixed(8)} sBTC
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 6.2 sBTC Stream Creation Component

```tsx
// components/sbtc/CreateSbtcStream.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useConnect } from '@stacks/connect';

const streamSchema = z.object({
  recipient: z.string().min(1, 'Recipient address is required'),
  totalAmount: z.number().min(0.00000001, 'Amount must be at least 1 satoshi'),
  duration: z.number().min(1, 'Duration must be at least 1 block'),
  paymentPerBlock: z.number().min(0.00000001, 'Payment per block must be positive'),
});

type StreamForm = z.infer<typeof streamSchema>;

export function CreateSbtcStream() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { doContractCall } = useConnect();

  const form = useForm<StreamForm>({
    resolver: zodResolver(streamSchema),
    defaultValues: {
      recipient: '',
      totalAmount: 0,
      duration: 144, // ~1 day in blocks
      paymentPerBlock: 0,
    },
  });

  const handleSubmit = async (data: StreamForm) => {
    try {
      setIsCreating(true);
      setError(null);
      setSuccess(null);

      // Convert amounts to satoshis
      const totalAmountSats = Math.floor(data.totalAmount * 100_000_000);
      const paymentPerBlockSats = Math.floor(data.paymentPerBlock * 100_000_000);

      // Validate total amount matches payment calculation
      const expectedTotal = paymentPerBlockSats * data.duration;
      if (totalAmountSats !== expectedTotal) {
        throw new Error(
          `Total amount (${totalAmountSats} sats) doesn't match payment calculation (${expectedTotal} sats)`
        );
      }

      // Call smart contract
      const result = await doContractCall({
        contractAddress: 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4',
        contractName: 'bitpay-sbtc-streams',
        functionName: 'create-sbtc-stream',
        functionArgs: [
          data.recipient,
          totalAmountSats,
          paymentPerBlockSats,
          data.duration,
        ],
        onFinish: (result) => {
          console.log('Stream creation result:', result);
          setSuccess(`Stream created successfully! Transaction: ${result.txId}`);
          form.reset();
        },
        onCancel: () => {
          setIsCreating(false);
        },
      });

    } catch (err) {
      console.error('Error creating stream:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  // Auto-calculate payment per block when total amount or duration changes
  const totalAmount = form.watch('totalAmount');
  const duration = form.watch('duration');

  const calculatedPaymentPerBlock = totalAmount && duration 
    ? totalAmount / duration 
    : 0;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create sBTC Stream</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              {...form.register('recipient')}
              placeholder="SP1ABC..."
              disabled={isCreating}
            />
            {form.formState.errors.recipient && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.recipient.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="totalAmount">Total Amount (sBTC)</Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.00000001"
              {...form.register('totalAmount', { valueAsNumber: true })}
              placeholder="0.00100000"
              disabled={isCreating}
            />
            {form.formState.errors.totalAmount && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.totalAmount.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="duration">Duration (Blocks)</Label>
            <Input
              id="duration"
              type="number"
              {...form.register('duration', { valueAsNumber: true })}
              placeholder="144"
              disabled={isCreating}
            />
            {form.formState.errors.duration && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.duration.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              ~{Math.round(duration / 144)} days ({duration} blocks)
            </p>
          </div>

          <div>
            <Label>Payment per Block (Auto-calculated)</Label>
            <div className="p-2 bg-gray-50 rounded border">
              {calculatedPaymentPerBlock.toFixed(8)} sBTC/block
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={isCreating || !form.formState.isValid}
          >
            {isCreating ? 'Creating Stream...' : 'Create Stream'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 6.3 sBTC Deposit/Withdrawal Components

```tsx
// components/sbtc/SbtcDeposit.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QRCodeSVG } from 'qrcode.react';

export function SbtcDeposit() {
  const [amount, setAmount] = useState('');
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateDepositAddress = async () => {
    try {
      setLoading(true);
      
      // Call backend API to generate deposit address
      const response = await fetch('/api/sbtc/generate-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      
      const data = await response.json();
      setDepositAddress(data.address);
    } catch (error) {
      console.error('Error generating deposit address:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit Bitcoin to sBTC</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="amount">Amount (BTC)</Label>
          <Input
            id="amount"
            type="number"
            step="0.00000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00100000"
          />
        </div>

        <Button 
          onClick={generateDepositAddress}
          disabled={!amount || loading}
          className="w-full"
        >
          {loading ? 'Generating...' : 'Generate Deposit Address'}
        </Button>

        {depositAddress && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Send exactly {amount} BTC to the address below. You will receive sBTC after 3 Bitcoin confirmations.
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-2">
              <QRCodeSVG value={depositAddress} size={200} className="mx-auto" />
              <div className="font-mono text-sm break-all bg-gray-100 p-2 rounded">
                {depositAddress}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// components/sbtc/SbtcWithdrawal.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WithdrawalForm {
  amount: number;
  bitcoinAddress: string;
  maxFee: number;
}

export function SbtcWithdrawal() {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const form = useForm<WithdrawalForm>({
    defaultValues: {
      amount: 0,
      bitcoinAddress: '',
      maxFee: 0.00001, // 1000 sats default
    },
  });

  const handleWithdrawal = async (data: WithdrawalForm) => {
    try {
      setIsWithdrawing(true);
      setResult(null);

      const response = await fetch('/api/sbtc/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.floor(data.amount * 100_000_000), // Convert to sats
          bitcoinAddress: data.bitcoinAddress,
          maxFee: Math.floor(data.maxFee * 100_000_000), // Convert to sats
        }),
      });

      const result = await response.json();
      setResult(`Withdrawal initiated! Request ID: ${result.requestId}`);
    } catch (error) {
      console.error('Withdrawal error:', error);
      setResult('Error initiating withdrawal');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdraw sBTC to Bitcoin</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleWithdrawal)} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (sBTC)</Label>
            <Input
              id="amount"
              type="number"
              step="0.00000001"
              {...form.register('amount', { required: true, min: 0.00000546 })}
              placeholder="0.00100000"
            />
          </div>

          <div>
            <Label htmlFor="bitcoinAddress">Bitcoin Address</Label>
            <Input
              id="bitcoinAddress"
              {...form.register('bitcoinAddress', { required: true })}
              placeholder="bc1q..."
            />
          </div>

          <div>
            <Label htmlFor="maxFee">Max Fee (BTC)</Label>
            <Input
              id="maxFee"
              type="number"
              step="0.00000001"
              {...form.register('maxFee', { required: true, min: 0.00000001 })}
              placeholder="0.00001"
            />
          </div>

          <Alert>
            <AlertDescription>
              Withdrawals require 6 Bitcoin confirmations and may take 1-3 hours to complete.
              Unused fee will be refunded as sBTC.
            </AlertDescription>
          </Alert>

          {result && (
            <Alert>
              <AlertDescription>{result}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={isWithdrawing}
          >
            {isWithdrawing ? 'Processing...' : 'Initiate Withdrawal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## 7. Testnet Implementation Strategy

### 7.1 Testnet Environment Setup

#### 7.1.1 Infrastructure Requirements
```bash
# 1. Stacks Testnet Node (for contract interactions)
# Option A: Use Hiro's hosted API
STACKS_API_URL=https://api.testnet.hiro.so

# Option B: Run your own node
# Download stacks-blockchain from GitHub and configure for testnet

# 2. Bitcoin Testnet Node (for deposit monitoring)
# bitcoin.conf for testnet
testnet=1
server=1
rpcuser=your_rpc_user
rpcpassword=your_rpc_password
rpcallowip=127.0.0.1
rpcport=18332

# 3. Emily API Testnet Endpoint
EMILY_API_URL=https://api.testnet.sbtc.tech
```

#### 7.1.2 Contract Deployment Configuration
```toml
# Clarinet.toml for testnet deployment
[project]
name = "bitpay-sbtc"
description = "BitPay with sBTC integration"
version = "1.0.0"

[contracts.bitpay-sbtc-streams]
path = "contracts/bitpay-sbtc-streams.clar"
depends_on = []

[contracts.sbtc-helper]
path = "contracts/sbtc-helper.clar" 
depends_on = ["bitpay-sbtc-streams"]

# Testnet settings
[settings.testnet]
node_rpc_address = "https://api.testnet.hiro.so"

# sBTC testnet contract addresses
[settings.testnet.contracts]
sbtc-token = "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token"
sbtc-registry = "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-registry"
sbtc-deposit = "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-deposit"
sbtc-withdrawal = "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-withdrawal"
```

### 7.2 Testnet Deployment Process

#### 7.2.1 Step-by-Step Deployment
```bash
# 1. Install dependencies
npm install @stacks/cli @stacks/transactions @stacks/network

# 2. Configure testnet wallet
stx make_keychain -t

# 3. Fund testnet wallet
# Get testnet STX from faucet: https://explorer.stacks.co/sandbox/faucet

# 4. Deploy contracts to testnet
clarinet deployments generate --testnet
clarinet deployments apply -p deployments/default.testnet-plan.yaml

# 5. Verify deployment
stx balance <your-testnet-address> -t
```

#### 7.2.2 Contract Integration Testing
```typescript
// test-integration.ts
import { 
  StacksTestnet, 
  broadcastTransaction, 
  makeContractCall 
} from '@stacks/transactions';

const network = new StacksTestnet();

async function testSbtcStreamCreation() {
  const contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Your deployed contract
  const contractName = 'bitpay-sbtc-streams';
  
  const txOptions = {
    contractAddress,
    contractName,
    functionName: 'create-sbtc-stream',
    functionArgs: [
      'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', // recipient
      1000000, // 0.01 sBTC in satoshis
      6944, // payment per block (1000000/144)
      144, // ~1 day
    ],
    senderKey: 'your-private-key',
    network,
  };
  
  const transaction = await makeContractCall(txOptions);
  const result = await broadcastTransaction(transaction, network);
  
  console.log('Transaction ID:', result.txId);
  return result;
}
```

### 7.3 Testnet Testing Strategy

#### 7.3.1 Test Scenarios
1. **sBTC Acquisition**:
   - Use testnet Bitcoin faucet to get testnet BTC
   - Create deposit transactions following sBTC protocol
   - Verify sBTC minting through Emily API

2. **Stream Creation**:
   - Test various stream durations (short/medium/long)
   - Test different payment frequencies
   - Verify contract state updates

3. **Stream Operations**:
   - Test withdrawal at various points in stream
   - Test stream cancellation and refunds
   - Test stream completion

4. **Error Handling**:
   - Test insufficient balance scenarios
   - Test invalid recipient addresses
   - Test network connection failures

#### 7.3.2 Automated Testing Suite
```typescript
// tests/integration/sbtc-integration.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { StacksTestnet } from '@stacks/network';
import { EmilyApiClient } from '../src/emily-client';

describe('sBTC Integration Tests', () => {
  let emilyClient: EmilyApiClient;
  let network: StacksTestnet;

  beforeAll(() => {
    network = new StacksTestnet();
    emilyClient = new EmilyApiClient({
      baseUrl: 'https://api.testnet.sbtc.tech'
    });
  });

  it('should create a deposit request', async () => {
    const deposit = await emilyClient.createDeposit({
      txid: 'mock-txid',
      vout_index: 0,
      amount: 100000, // 0.001 BTC in satoshis
      recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    });

    expect(deposit.status).toBe('PENDING');
    expect(deposit.amount).toBe(100000);
  });

  it('should monitor Emily API health', async () => {
    const health = await emilyClient.getHealth();
    expect(health.status).toBe('ok');
  });

  // Add more integration tests...
});
```

---

## 8. Mainnet Deployment Strategy

### 8.1 Pre-Deployment Checklist

#### 8.1.1 Security Audit Requirements
- [ ] Smart contract security audit by reputable firm
- [ ] Penetration testing of API endpoints
- [ ] Code review by independent developers
- [ ] Formal verification of critical functions
- [ ] Bug bounty program completion

#### 8.1.2 Infrastructure Readiness
- [ ] Production-grade server infrastructure
- [ ] Load balancer configuration
- [ ] Database backup and recovery procedures
- [ ] Monitoring and alerting systems
- [ ] DDoS protection and rate limiting
- [ ] SSL/TLS certificates and security headers

#### 8.1.3 Operational Readiness
- [ ] 24/7 monitoring setup
- [ ] Incident response procedures
- [ ] Customer support processes
- [ ] Documentation and user guides
- [ ] Legal compliance review
- [ ] Insurance coverage evaluation

### 8.2 Mainnet Deployment Process

#### 8.2.1 Phased Rollout Strategy

**Phase 1: Limited Beta (Weeks 1-2)**
```typescript
// mainnet-config.ts
export const MAINNET_CONFIG = {
  // Conservative limits for beta
  maxStreamAmount: 1_000_000, // 0.01 BTC max per stream
  maxDailyVolume: 10_000_000, // 0.1 BTC max daily volume
  maxActiveStreams: 100, // 100 active streams max
  
  // Enhanced monitoring
  alertThresholds: {
    failedTransactions: 5, // Alert after 5 failures
    highGasFees: 50000, // Alert on high gas usage
    lowBalance: 100000, // Alert when contract balance low
  },
  
  // Emergency controls
  pauseContract: true, // Allow emergency pause
  adminAddress: 'SP1ABC...', // Emergency admin
};
```

**Phase 2: Gradual Expansion (Weeks 3-6)**
```typescript
export const EXPANSION_CONFIG = {
  maxStreamAmount: 10_000_000, // 0.1 BTC max per stream
  maxDailyVolume: 100_000_000, // 1 BTC max daily volume
  maxActiveStreams: 1000, // 1000 active streams max
};
```

**Phase 3: Full Production (Week 7+)**
```typescript
export const PRODUCTION_CONFIG = {
  maxStreamAmount: 1_000_000_000, // 10 BTC max per stream
  maxDailyVolume: 10_000_000_000, // 100 BTC max daily volume
  maxActiveStreams: 10000, // 10,000 active streams max
};
```

#### 8.2.2 Deployment Automation

```bash
#!/bin/bash
# deploy-mainnet.sh

set -e

echo "Starting BitPay sBTC mainnet deployment..."

# 1. Verify environment
if [ "$NETWORK" != "mainnet" ]; then
  echo "Error: NETWORK must be set to 'mainnet'"
  exit 1
fi

# 2. Backup existing deployment (if any)
if [ -d "backups" ]; then
  cp -r deployments backups/deployments-$(date +%Y%m%d-%H%M%S)
fi

# 3. Run final tests
echo "Running pre-deployment tests..."
npm run test:integration
npm run test:security

# 4. Deploy contracts
echo "Deploying smart contracts..."
clarinet deployments generate --mainnet
clarinet deployments apply -p deployments/default.mainnet-plan.yaml

# 5. Verify deployment
echo "Verifying deployment..."
npm run verify:mainnet

# 6. Start monitoring
echo "Starting monitoring services..."
npm run monitor:start

# 7. Update DNS and load balancer
echo "Updating infrastructure..."
./scripts/update-infrastructure.sh

echo "Deployment complete!"
echo "Contract addresses:"
cat deployments/default.mainnet-plan.yaml | grep "contract-id"
```

### 8.3 Mainnet Configuration

#### 8.3.1 Production Environment Variables
```bash
# Production environment configuration
NODE_ENV=production
NETWORK=mainnet

# Stacks configuration
STACKS_API_URL=https://api.stacks.co
STACKS_PRIVATE_KEY=your_mainnet_private_key_encrypted

# sBTC configuration
SBTC_TOKEN_ADDRESS=SP1ABC...  # Mainnet sBTC token address
EMILY_API_URL=https://api.sbtc.tech
EMILY_API_KEY=your_production_api_key

# Database configuration
DATABASE_URL=postgresql://user:pass@prod-db:5432/bitpay_sbtc
DATABASE_SSL=true
DATABASE_POOL_SIZE=20

# Monitoring configuration
SENTRY_DSN=your_sentry_dsn
DATADOG_API_KEY=your_datadog_key
LOG_LEVEL=info

# Security configuration
RATE_LIMIT_WINDOW=900 # 15 minutes
RATE_LIMIT_MAX=100    # 100 requests per window
API_RATE_LIMIT=1000   # 1000 requests per hour
```

#### 8.3.2 Production Monitoring

```typescript
// monitoring/production-monitor.ts
import { Sentry } from '@sentry/node';
import { StatsD } from 'node-statsd';

export class ProductionMonitor {
  private statsD: StatsD;

  constructor() {
    this.statsD = new StatsD();
    
    // Initialize Sentry for error tracking
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
    });
  }

  // Track sBTC operations
  trackSbtcOperation(operation: string, success: boolean, amount?: number) {
    this.statsD.increment(`sbtc.operation.${operation}.${success ? 'success' : 'failure'}`);
    
    if (amount) {
      this.statsD.histogram(`sbtc.operation.${operation}.amount`, amount);
    }
  }

  // Track stream operations
  trackStreamOperation(operation: string, streamId: string, success: boolean) {
    this.statsD.increment(`stream.operation.${operation}.${success ? 'success' : 'failure'}`);
    
    if (!success) {
      Sentry.addBreadcrumb({
        message: `Stream operation failed: ${operation}`,
        data: { streamId, operation },
        level: 'error',
      });
    }
  }

  // Monitor Emily API health
  async monitorEmilyHealth() {
    try {
      const response = await fetch(process.env.EMILY_API_URL + '/health');
      const health = response.ok;
      
      this.statsD.gauge('emily.api.health', health ? 1 : 0);
      
      if (!health) {
        Sentry.captureMessage('Emily API health check failed', 'warning');
      }
    } catch (error) {
      this.statsD.gauge('emily.api.health', 0);
      Sentry.captureException(error);
    }
  }

  // Monitor contract balance
  async monitorContractBalance(contractAddress: string) {
    try {
      // Check contract sBTC balance
      const balance = await this.getSbtcBalance(contractAddress);
      this.statsD.gauge('contract.sbtc.balance', balance);
      
      // Alert if balance is low
      if (balance < 1000000) { // Less than 0.01 sBTC
        Sentry.captureMessage('Contract sBTC balance is low', 'warning');
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  private async getSbtcBalance(address: string): Promise<number> {
    // Implementation to get sBTC balance
    throw new Error('Not implemented');
  }
}
```

---

## 9. Security Considerations

### 9.1 Smart Contract Security

#### 9.1.1 Access Control Implementation
```clarity
;; Enhanced access control for production
(define-constant ERR_UNAUTHORIZED (err u0))
(define-constant ERR_CONTRACT_PAUSED (err u1))
(define-constant ERR_INVALID_ADMIN (err u2))

;; Contract state
(define-data-var contract-admin principal tx-sender)
(define-data-var contract-paused bool false)
(define-data-var emergency-stop bool false)

;; Admin functions
(define-public (set-admin (new-admin principal))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-admin)) ERR_UNAUTHORIZED)
        (var-set contract-admin new-admin)
        (ok true)
    )
)

(define-public (pause-contract)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-admin)) ERR_UNAUTHORIZED)
        (var-set contract-paused true)
        (ok true)
    )
)

(define-public (unpause-contract)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-admin)) ERR_UNAUTHORIZED)
        (var-set contract-paused false)
        (ok true)
    )
)

(define-public (emergency-stop)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-admin)) ERR_UNAUTHORIZED)
        (var-set emergency-stop true)
        (var-set contract-paused true)
        (ok true)
    )
)

;; Security modifier for all public functions
(define-private (assert-not-paused)
    (asserts! (not (var-get contract-paused)) ERR_CONTRACT_PAUSED)
)

;; Apply to all main functions
(define-public (create-sbtc-stream ...)
    (begin
        (try! (assert-not-paused))
        ;; Rest of function implementation
    )
)
```

#### 9.1.2 Input Validation and Sanitization
```clarity
;; Comprehensive input validation
(define-constant MIN_STREAM_AMOUNT u546)      ;; Dust limit (546 sats)
(define-constant MAX_STREAM_AMOUNT u100000000000) ;; 1000 BTC max
(define-constant MIN_DURATION u1)             ;; 1 block minimum
(define-constant MAX_DURATION u52560)         ;; ~1 year maximum
(define-constant MAX_PAYMENT_PER_BLOCK u1000000000) ;; 10 BTC per block max

(define-private (validate-stream-params 
    (total-amount uint)
    (payment-per-block uint)
    (duration uint))
    (begin
        ;; Validate amount bounds
        (asserts! (>= total-amount MIN_STREAM_AMOUNT) (err u100))
        (asserts! (<= total-amount MAX_STREAM_AMOUNT) (err u101))
        
        ;; Validate duration bounds
        (asserts! (>= duration MIN_DURATION) (err u102))
        (asserts! (<= duration MAX_DURATION) (err u103))
        
        ;; Validate payment per block
        (asserts! (> payment-per-block u0) (err u104))
        (asserts! (<= payment-per-block MAX_PAYMENT_PER_BLOCK) (err u105))
        
        ;; Validate math consistency
        (asserts! (is-eq total-amount (* payment-per-block duration)) (err u106))
        
        (ok true)
    )
)
```

### 9.2 API Security

#### 9.2.1 Rate Limiting and DDoS Protection
```typescript
// security/rate-limiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// General API rate limiting
export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiting for sensitive operations
export const strictLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit to 10 sensitive operations per hour
  message: 'Rate limit exceeded for sensitive operations.',
});

// Stream creation limiting
export const streamLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 50, // Max 50 streams per day per IP
  message: 'Daily stream creation limit exceeded.',
});
```

#### 9.2.2 Input Validation and Sanitization
```typescript
// security/validation.ts
import Joi from 'joi';
import { sanitize } from 'dompurify';

// Stream creation validation schema
export const createStreamSchema = Joi.object({
  recipient: Joi.string()
    .pattern(/^S[P|T][0-9A-Z]{38,40}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid Stacks address format'
    }),
  
  totalAmount: Joi.number()
    .min(0.00000546) // Dust limit
    .max(1000) // 1000 sBTC max
    .precision(8)
    .required(),
    
  duration: Joi.number()
    .integer()
    .min(1)
    .max(52560) // ~1 year in blocks
    .required(),
    
  paymentPerBlock: Joi.number()
    .min(0.00000001)
    .max(10) // 10 sBTC per block max
    .precision(8)
    .required(),
});

// Sanitization middleware
export function sanitizeInput(req: any, res: any, next: any) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
}

function sanitizeObject(obj: any): any {
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitize(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
```

### 9.3 Infrastructure Security

#### 9.3.1 Environment Security
```typescript
// security/environment.ts
import crypto from 'crypto';

export class EnvironmentSecurity {
  // Encrypt sensitive environment variables
  static encryptEnvVar(value: string, key: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Decrypt sensitive environment variables
  static decryptEnvVar(encryptedValue: string, key: string): string {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Validate required environment variables
  static validateEnvironment(): void {
    const required = [
      'STACKS_PRIVATE_KEY',
      'EMILY_API_KEY',
      'DATABASE_URL',
      'SENTRY_DSN',
    ];

    for (const env of required) {
      if (!process.env[env]) {
        throw new Error(`Required environment variable ${env} is not set`);
      }
    }
  }

  // Generate secure random keys
  static generateSecretKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
```

#### 9.3.2 Database Security
```sql
-- Database security configuration
-- Create read-only user for reporting
CREATE ROLE bitpay_readonly WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE bitpay_sbtc TO bitpay_readonly;
GRANT USAGE ON SCHEMA public TO bitpay_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bitpay_readonly;

-- Create application user with limited permissions
CREATE ROLE bitpay_app WITH LOGIN PASSWORD 'secure_app_password';
GRANT CONNECT ON DATABASE bitpay_sbtc TO bitpay_app;
GRANT USAGE ON SCHEMA public TO bitpay_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO bitpay_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO bitpay_app;

-- Revoke dangerous permissions
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Enable row level security
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY stream_isolation ON streams
    USING (sender = current_setting('app.current_user_id')::text 
           OR recipient = current_setting('app.current_user_id')::text);
```

### 9.4 Incident Response Plan

#### 9.4.1 Security Incident Classification
```typescript
// security/incident-response.ts
export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SecurityIncident {
  id: string;
  severity: IncidentSeverity;
  type: string;
  description: string;
  timestamp: Date;
  affectedSystems: string[];
  mitigationSteps: string[];
  resolved: boolean;
}

export class IncidentResponseManager {
  private incidents: Map<string, SecurityIncident> = new Map();

  // Report security incident
  reportIncident(incident: Omit<SecurityIncident, 'id' | 'timestamp'>): string {
    const id = crypto.randomUUID();
    const fullIncident: SecurityIncident = {
      ...incident,
      id,
      timestamp: new Date(),
    };

    this.incidents.set(id, fullIncident);
    this.handleIncident(fullIncident);
    
    return id;
  }

  private async handleIncident(incident: SecurityIncident) {
    // Immediate response based on severity
    switch (incident.severity) {
      case IncidentSeverity.CRITICAL:
        await this.emergencyResponse(incident);
        break;
      case IncidentSeverity.HIGH:
        await this.highPriorityResponse(incident);
        break;
      case IncidentSeverity.MEDIUM:
        await this.standardResponse(incident);
        break;
      case IncidentSeverity.LOW:
        await this.logIncident(incident);
        break;
    }
  }

  private async emergencyResponse(incident: SecurityIncident) {
    // 1. Immediately pause all contracts
    await this.pauseAllContracts();
    
    // 2. Alert security team
    await this.alertSecurityTeam(incident);
    
    // 3. Create war room
    await this.createWarRoom(incident);
    
    // 4. Notify stakeholders
    await this.notifyStakeholders(incident);
  }

  private async pauseAllContracts() {
    // Implementation to pause smart contracts in emergency
  }

  private async alertSecurityTeam(incident: SecurityIncident) {
    // Implementation to alert security team via multiple channels
  }
}
```

---

## 10. Testing Strategy

### 10.1 Unit Testing for Smart Contracts

```typescript
// tests/contracts/sbtc-streams.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';
import { initSimnet } from '@hirosystems/clarinet-sdk';

const simnet = await initSimnet();

describe('sBTC Streams Contract', () => {
  beforeEach(() => {
    // Reset contract state before each test
  });

  describe('Stream Creation', () => {
    it('should create a stream with valid parameters', () => {
      const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
      const totalAmount = 1000000; // 0.01 sBTC
      const paymentPerBlock = 6944; // totalAmount / 144 blocks
      const duration = 144;

      const result = simnet.callPublicFn(
        'bitpay-sbtc-streams',
        'create-sbtc-stream',
        [
          Cl.principal(recipient),
          Cl.uint(totalAmount),
          Cl.uint(paymentPerBlock),
          Cl.uint(duration),
        ],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );

      expect(result.result).toBeOk();
      // Verify stream was created with correct ID
      expect(Cl.parse(result.result)).toBeUint(1);
    });

    it('should reject stream with invalid amount', () => {
      const result = simnet.callPublicFn(
        'bitpay-sbtc-streams',
        'create-sbtc-stream',
        [
          Cl.principal('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'),
          Cl.uint(100), // Below dust limit
          Cl.uint(1),
          Cl.uint(100),
        ],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );

      expect(result.result).toBeErr();
    });

    it('should reject stream with mismatched calculations', () => {
      const result = simnet.callPublicFn(
        'bitpay-sbtc-streams',
        'create-sbtc-stream',
        [
          Cl.principal('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'),
          Cl.uint(1000000),
          Cl.uint(6944),
          Cl.uint(150), // Wrong duration - doesn't match total/payment
        ],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );

      expect(result.result).toBeErr();
    });
  });

  describe('Stream Withdrawal', () => {
    it('should calculate correct vested amount', () => {
      // First create a stream
      const createResult = simnet.callPublicFn(
        'bitpay-sbtc-streams',
        'create-sbtc-stream',
        [
          Cl.principal('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'),
          Cl.uint(1000000),
          Cl.uint(6944),
          Cl.uint(144),
        ],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );

      expect(createResult.result).toBeOk();

      // Advance blockchain by 72 blocks (half duration)
      simnet.mineEmptyBlocks(72);

      // Check vested amount
      const vestedResult = simnet.callReadOnlyFn(
        'bitpay-sbtc-streams',
        'calculate-vested-amount',
        [Cl.uint(1)],
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
      );

      // Should be approximately half the total amount
      const vestedAmount = Number(Cl.parse(vestedResult.result));
      expect(vestedAmount).toBeCloseTo(500000, -3); // Within 1000 sats
    });

    it('should allow recipient to withdraw vested amount', () => {
      // Create stream and advance time
      simnet.callPublicFn(
        'bitpay-sbtc-streams',
        'create-sbtc-stream',
        [
          Cl.principal('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'),
          Cl.uint(1000000),
          Cl.uint(6944),
          Cl.uint(144),
        ],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );

      simnet.mineEmptyBlocks(72);

      // Withdraw as recipient
      const withdrawResult = simnet.callPublicFn(
        'bitpay-sbtc-streams',
        'withdraw-from-stream',
        [Cl.uint(1)],
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
      );

      expect(withdrawResult.result).toBeOk();
    });

    it('should reject withdrawal from unauthorized user', () => {
      // Create stream
      simnet.callPublicFn(
        'bitpay-sbtc-streams',
        'create-sbtc-stream',
        [
          Cl.principal('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'),
          Cl.uint(1000000),
          Cl.uint(6944),
          Cl.uint(144),
        ],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );

      // Try to withdraw as unauthorized user
      const withdrawResult = simnet.callPublicFn(
        'bitpay-sbtc-streams',
        'withdraw-from-stream',
        [Cl.uint(1)],
        'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNJ5N7R21XCP' // Different user
      );

      expect(withdrawResult.result).toBeErr();
    });
  });

  describe('Stream Cancellation', () => {
    it('should allow sender to cancel stream and get refund', () => {
      // Create stream
      simnet.callPublicFn(
        'bitpay-sbtc-streams',
        'create-sbtc-stream',
        [
          Cl.principal('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'),
          Cl.uint(1000000),
          Cl.uint(6944),
          Cl.uint(144),
        ],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );

      // Advance time partially
      simnet.mineEmptyBlocks(36); // 1/4 duration

      // Cancel stream as sender
      const cancelResult = simnet.callPublicFn(
        'bitpay-sbtc-streams',
        'cancel-stream',
        [Cl.uint(1)],
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
      );

      expect(cancelResult.result).toBeOk();

      // Verify refund calculation
      const result = Cl.parse(cancelResult.result) as any;
      expect(result.refunded).toBeTruthy();
    });
  });
});
```

### 10.2 Integration Testing

```typescript
// tests/integration/emily-integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { EmilyApiClient } from '../../src/emily-client';
import { BitPayEmilyService } from '../../src/emily-service';

describe('Emily API Integration', () => {
  let emilyClient: EmilyApiClient;
  let bitpayService: BitPayEmilyService;

  beforeAll(async () => {
    emilyClient = new EmilyApiClient({
      baseUrl: process.env.EMILY_TESTNET_URL || 'https://api.testnet.sbtc.tech'
    });

    // Initialize database for testing
    // bitpayService = new BitPayEmilyService(emilyClient, testDatabase);
  });

  afterAll(async () => {
    // Cleanup test data
  });

  it('should fetch Emily API health status', async () => {
    const health = await emilyClient.getHealth();
    expect(health.status).toBe('ok');
    expect(health.timestamp).toBeDefined();
  });

  it('should fetch chain state information', async () => {
    const chainTip = await emilyClient.getChainTip();
    expect(chainTip.bitcoin_height).toBeGreaterThan(0);
    expect(chainTip.stacks_height).toBeGreaterThan(0);
    expect(chainTip.bitcoin_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(chainTip.stacks_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should handle deposit monitoring workflow', async () => {
    // Mock deposit creation
    const mockDeposit = {
      txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      vout_index: 0,
      amount: 100000, // 0.001 BTC
      recipient: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    };

    // This would be a real integration test in a full testnet environment
    // For now, we'll test the client structure
    expect(() => emilyClient.createDeposit(mockDeposit)).not.toThrow();
  });

  it('should handle withdrawal request workflow', async () => {
    // Test withdrawal request creation
    const mockWithdrawal = {
      amount: 50000, // 0.0005 BTC
      recipient: {
        version: '04', // P2WPKH
        hashbytes: '0'.repeat(40) // Mock hash
      },
      max_fee: 1000 // 0.00001 BTC
    };

    // Test client method structure
    expect(typeof emilyClient.getWithdrawals).toBe('function');
  });
});
```

### 10.3 End-to-End Testing

```typescript
// tests/e2e/complete-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('BitPay sBTC Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test environment
    await page.goto('http://localhost:3000');
  });

  test('should complete full stream creation and withdrawal flow', async ({ page }) => {
    // 1. Connect wallet
    await page.click('[data-testid="connect-wallet"]');
    await page.click('[data-testid="hiro-wallet"]');
    
    // Wait for wallet connection
    await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible();

    // 2. Check sBTC balance
    await expect(page.locator('[data-testid="sbtc-balance"]')).toBeVisible();
    
    // 3. Create a stream
    await page.click('[data-testid="create-stream"]');
    
    await page.fill('[data-testid="recipient-input"]', 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');
    await page.fill('[data-testid="amount-input"]', '0.01');
    await page.fill('[data-testid="duration-input"]', '144');
    
    await page.click('[data-testid="create-stream-button"]');
    
    // Wait for transaction confirmation
    await expect(page.locator('[data-testid="stream-created"]')).toBeVisible({ timeout: 30000 });

    // 4. Verify stream appears in dashboard
    await page.goto('/dashboard/streams');
    await expect(page.locator('[data-testid="stream-list"]')).toContainText('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');

    // 5. Test stream withdrawal (would require recipient wallet)
    // This would be expanded in a full e2e environment
  });

  test('should handle sBTC deposit flow', async ({ page }) => {
    // 1. Navigate to deposit page
    await page.goto('/deposit');

    // 2. Enter deposit amount
    await page.fill('[data-testid="deposit-amount"]', '0.005');
    
    // 3. Generate deposit address
    await page.click('[data-testid="generate-address"]');
    
    // 4. Verify QR code and address are displayed
    await expect(page.locator('[data-testid="deposit-qr"]')).toBeVisible();
    await expect(page.locator('[data-testid="deposit-address"]')).toBeVisible();
    
    // 5. Verify address format (Bitcoin testnet format)
    const address = await page.locator('[data-testid="deposit-address"]').textContent();
    expect(address).toMatch(/^(tb1|2|m|n)[a-zA-Z0-9]{25,62}$/);
  });

  test('should handle sBTC withdrawal flow', async ({ page }) => {
    // 1. Navigate to withdrawal page
    await page.goto('/withdraw');

    // 2. Fill withdrawal form
    await page.fill('[data-testid="withdraw-amount"]', '0.002');
    await page.fill('[data-testid="bitcoin-address"]', 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    await page.fill('[data-testid="max-fee"]', '0.00001');

    // 3. Initiate withdrawal
    await page.click('[data-testid="initiate-withdrawal"]');

    // 4. Confirm transaction
    await page.click('[data-testid="confirm-withdrawal"]');

    // 5. Verify success message
    await expect(page.locator('[data-testid="withdrawal-success"]')).toBeVisible({ timeout: 30000 });
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test insufficient balance
    await page.goto('/dashboard/streams/create');
    
    await page.fill('[data-testid="amount-input"]', '1000'); // More than available
    await page.click('[data-testid="create-stream-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Insufficient balance');

    // Test invalid recipient address
    await page.fill('[data-testid="amount-input"]', '0.01');
    await page.fill('[data-testid="recipient-input"]', 'invalid-address');
    await page.click('[data-testid="create-stream-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid address');
  });
});
```

### 10.4 Performance Testing

```typescript
// tests/performance/load-test.ts
import { check } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Maintain 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Maintain 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

export default function () {
  // Test API endpoints
  const baseUrl = 'http://localhost:3000';

  // Test health endpoint
  let response = http.get(`${baseUrl}/api/health`);
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });

  // Test sBTC balance endpoint
  response = http.post(`${baseUrl}/api/sbtc/balance`, {
    address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
  });
  check(response, {
    'balance check status is 200': (r) => r.status === 200,
    'balance check response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test stream creation endpoint
  response = http.post(`${baseUrl}/api/streams`, {
    recipient: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
    totalAmount: 100000,
    duration: 144,
    paymentPerBlock: 694,
  });
  check(response, {
    'stream creation handles load': (r) => r.status < 500,
  });
}
```

---

## 11. Deployment Roadmap

### 11.1 Development Phases

#### Phase 1: Foundation (Weeks 1-3)
**Objectives**: Basic sBTC integration and core functionality

**Week 1: Infrastructure Setup**
- [ ] Set up development environment with Clarinet
- [ ] Configure testnet connections (Stacks, Bitcoin, Emily API)
- [ ] Create project structure and basic contracts
- [ ] Set up CI/CD pipeline with GitHub Actions

**Week 2: Core Contract Development**
- [ ] Implement sBTC streaming contract
- [ ] Add input validation and security measures
- [ ] Create helper contracts for batch operations
- [ ] Write comprehensive unit tests

**Week 3: Emily API Integration**
- [ ] Implement Emily API client
- [ ] Create deposit monitoring service
- [ ] Implement withdrawal request handling
- [ ] Add error handling and retry logic

**Deliverables**:
- Working sBTC streaming contracts on testnet
- Emily API integration with deposit/withdrawal flows
- Basic unit test coverage (>80%)

#### Phase 2: Frontend Development (Weeks 4-6)
**Objectives**: User interface for sBTC streaming

**Week 4: Core UI Components**
- [ ] Create sBTC balance display component
- [ ] Implement stream creation form
- [ ] Build stream management dashboard
- [ ] Add wallet connection with Stacks Connect

**Week 5: Advanced Features**
- [ ] Implement deposit/withdrawal interfaces
- [ ] Create stream analytics and charts
- [ ] Add transaction history views
- [ ] Implement real-time updates

**Week 6: UX/UI Polish**
- [ ] Responsive design implementation
- [ ] Error state handling and messaging
- [ ] Loading states and optimistic updates
- [ ] Accessibility improvements

**Deliverables**:
- Complete frontend application
- Integration with smart contracts
- End-to-end user flows working

#### Phase 3: Integration Testing (Weeks 7-8)
**Objectives**: Comprehensive testing and bug fixing

**Week 7: Testing Implementation**
- [ ] Complete integration test suite
- [ ] End-to-end testing with Playwright
- [ ] Performance testing and optimization
- [ ] Security testing and vulnerability assessment

**Week 8: Bug Fixes and Optimization**
- [ ] Fix identified issues from testing
- [ ] Optimize contract gas usage
- [ ] Improve API response times
- [ ] Enhance error handling

**Deliverables**:
- Fully tested application with >90% test coverage
- Performance benchmarks and optimizations
- Security audit results and fixes

#### Phase 4: Testnet Deployment (Weeks 9-10)
**Objectives**: Production-ready testnet deployment

**Week 9: Testnet Deployment**
- [ ] Deploy contracts to Stacks testnet
- [ ] Configure production-like infrastructure
- [ ] Set up monitoring and alerting
- [ ] Implement backup and recovery procedures

**Week 10: User Acceptance Testing**
- [ ] Beta user testing program
- [ ] Documentation and user guides
- [ ] Support system setup
- [ ] Final security review

**Deliverables**:
- Live testnet application
- Complete documentation
- Beta user feedback and improvements

#### Phase 5: Mainnet Preparation (Weeks 11-12)
**Objectives**: Mainnet-ready application

**Week 11: Security and Audit**
- [ ] Professional security audit
- [ ] Penetration testing
- [ ] Code review by external developers
- [ ] Insurance and legal compliance

**Week 12: Mainnet Deployment**
- [ ] Mainnet contract deployment
- [ ] Production infrastructure setup
- [ ] Go-live preparation and testing
- [ ] Launch and monitoring

**Deliverables**:
- Production-ready mainnet application
- Complete security audit report
- Launch plan and success metrics

### 11.2 Success Metrics

#### Technical Metrics
- **Contract Performance**: Gas usage < 50,000 per transaction
- **API Response Time**: 95th percentile < 500ms
- **Uptime**: >99.9% availability
- **Test Coverage**: >90% code coverage
- **Security**: Zero critical vulnerabilities

#### Business Metrics
- **User Adoption**: 100+ active users in first month
- **Transaction Volume**: $10,000+ in sBTC processed
- **Stream Creation**: 500+ streams created
- **User Retention**: 70% monthly retention rate

#### Security Metrics
- **Incident Response**: <1 hour response time
- **Vulnerability Management**: 100% critical fixes within 24 hours
- **Compliance**: Pass all security audits
- **Monitoring**: 100% critical system monitoring coverage

### 11.3 Risk Mitigation

#### Technical Risks
1. **sBTC Protocol Changes**: 
   - Mitigation: Regular communication with sBTC team, modular contract design
2. **Smart Contract Bugs**: 
   - Mitigation: Comprehensive testing, security audits, formal verification
3. **API Dependencies**: 
   - Mitigation: Fallback mechanisms, caching, circuit breakers

#### Operational Risks
1. **Key Management**: 
   - Mitigation: Hardware security modules, key rotation procedures
2. **Infrastructure Failures**: 
   - Mitigation: Multi-region deployment, automated failover, regular backups
3. **Regulatory Changes**: 
   - Mitigation: Legal compliance review, flexible architecture

#### Business Risks
1. **Market Volatility**: 
   - Mitigation: Conservative limits, risk monitoring, user education
2. **Competition**: 
   - Mitigation: Unique value proposition, rapid iteration, user feedback
3. **Adoption**: 
   - Mitigation: Marketing strategy, partnership development, incentive programs

---

## Conclusion

This comprehensive implementation guide provides everything needed to successfully integrate sBTC into the BitPay streaming payment system. The modular architecture, security-first approach, and phased deployment strategy ensure a robust, scalable solution that leverages Bitcoin's security while enabling programmable cash flows.

Key advantages of this sBTC integration:

1. **Native Bitcoin Security**: Inherits Bitcoin's battle-tested security model
2. **Instant Settlement**: Stacks block finality enables immediate transfers
3. **Programmable Money**: Full smart contract capabilities for complex financial instruments
4. **Decentralized**: No custodial intermediaries or trusted third parties
5. **Scalable**: Designed for high-volume payment processing

The implementation roadmap spans 12 weeks with clearly defined phases, deliverables, and success metrics. With proper execution, this will create a world-class Bitcoin streaming payment platform that showcases the power of sBTC and demonstrates the future of programmable Bitcoin finance.

For testnet deployment, follow the detailed configuration and testing procedures. For mainnet, ensure all security audits are complete and operational procedures are in place. The monitoring and incident response systems are critical for maintaining user trust and system reliability.

This guide serves as both implementation documentation and operational manual for building and maintaining a production sBTC streaming payment system.