# BitPay: Bitcoin Streaming and Vesting Platform

[![Clarity Smart Contracts](https://img.shields.io/badge/Smart%20Contracts-Clarity-orange)](https://clarity-lang.org/)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js-blue)](https://nextjs.org/)
[![Network](https://img.shields.io/badge/Network-Stacks-purple)](https://stacks.org/)
[![sBTC](https://img.shields.io/badge/Token-sBTC-gold)](https://sbtc.tech/)

**The most advanced platform for continuous Bitcoin payments. Built on Stacks for secure, programmable money flows.**

---

## 🚀 Overview

BitPay revolutionizes how Bitcoin payments are made by introducing **streaming payments** - the ability to send Bitcoin continuously over time rather than in traditional lump sums. Think "Netflix for Money" - just as Netflix streams video content continuously, BitPay streams Bitcoin payments continuously.

### Key Innovation: sBTC Integration

BitPay leverages **sBTC (Stacks Bitcoin)**, a 1:1 Bitcoin-pegged token on the Stacks blockchain, enabling:
- **True Bitcoin streams** with smart contract programmability
- **Instant finality** for payment calculations
- **Lower fees** compared to direct Bitcoin transactions
- **Enterprise-grade security** with Bitcoin's underlying security model

---

## ✨ Features

### 🔄 Core Streaming Capabilities
- **Create Bitcoin Streams**: Set up continuous payments over any time period
- **Real-time Claiming**: Recipients can claim available funds at any block
- **Pause/Resume**: Senders can pause and resume streams as needed
- **Stream Cancellation**: Early termination with automatic refunds

### 🛡️ Enterprise Security
- **Role-based Access Control**: Multi-tiered permission system
- **Emergency Controls**: Circuit breakers for critical situations
- **Audit Trail**: Complete transaction history and event logging
- **Chainhook Integration**: Real-time blockchain event monitoring

### 💼 Business Features
- **Fee Management**: Configurable fee structures for sustainability
- **Treasury Controls**: Secure fee collection and management
- **Analytics Integration**: Comprehensive usage and performance metrics
- **Multi-wallet Support**: Connect and manage multiple Bitcoin wallets

---

## 🏗️ Architecture

### Smart Contract Layer (Clarity)
```
┌─────────────────────────────────────────────────────────────┐
│                    BitPay Smart Contracts                  │
├─────────────────────────────────────────────────────────────┤
│  📋 Access Control    │  💰 Core Streams  │  🏛️ Treasury     │
│  - Role management    │  - Stream logic    │  - Fee collection │
│  - Permissions        │  - Calculations    │  - Fund management│
│  - Admin controls     │  - State tracking  │  - Distribution   │
├─────────────────────────────────────────────────────────────┤
│  🚨 Emergency         │  📊 Analytics      │  🔗 sBTC Integra.│
│  - Circuit breakers   │  - Usage metrics   │  - Token interface│
│  - Emergency stops    │  - Reporting       │  - Balance checks │
│  - Recovery modes     │  - Statistics      │  - Transfers      │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Application (Next.js)
```
┌─────────────────────────────────────────────────────────────┐
│                     BitPay Frontend                        │
├─────────────────────────────────────────────────────────────┤
│  🏠 Landing Page      │  📊 Dashboard      │  👤 Auth System  │
│  - Hero section       │  - Stream overview │  - Wallet connect │
│  - Features showcase  │  - Analytics view  │  - User profiles  │
│  - How it works       │  - Create streams  │  - Session mgmt   │
├─────────────────────────────────────────────────────────────┤
│  💳 Stream Management │  ⚙️ Settings       │  📱 Responsive UI │
│  - Create streams     │  - Preferences     │  - Mobile first   │
│  - Claim payments     │  - Wallet mgmt     │  - Modern design  │
│  - Pause/Resume       │  - Security opts   │  - Animations     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- [Clarinet CLI](https://github.com/hirosystems/clarinet) for smart contract development
- [Stacks Wallet](https://wallet.hiro.so/) for blockchain interaction

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/bitpay.git
cd bitpay
```

### 2. Setup Smart Contracts
```bash
cd contract
npm install

# Run tests
npm test

# Deploy to testnet (requires wallet setup)
clarinet deployments apply --testnet
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Smart contracts: See deployment output for contract addresses

---

## 🔧 Development

### Smart Contract Development

#### Contract Structure
```
contracts/
├── bitpay-core.clar              # Main streaming logic
├── bitpay-access-control.clar    # Permission management
├── bitpay-treasury.clar          # Fee and fund management
├── bitpay-emergency.clar         # Emergency controls
├── bitpay-analytics.clar         # Usage tracking
└── bitpay-sbtc-integration.clar  # sBTC token interface
```

#### Key Functions
```clarity
;; Create a new Bitcoin stream
(create-stream recipient total-amount duration-blocks start-delay metadata)

;; Claim available streaming funds
(claim-stream stream-id)

;; Pause/resume stream management
(pause-stream stream-id)
(resume-stream stream-id)

;; Cancel stream with refunds
(cancel-stream stream-id)
```

#### Testing
```bash
# Run all smart contract tests
npm test

# Run specific contract tests
npm test -- tests/bitpay-core.test.ts

# Generate test coverage report
npm run test:report
```

### Frontend Development

#### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Radix UI components
- **State Management**: React hooks + Context API
- **Blockchain**: Stacks.js for wallet integration
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with wallet-based auth

#### Key Components
```typescript
// Stream creation
import { CreateStreamModal } from '@/components/dashboard/modals/CreateStreamModal'

// Stream management
import { StreamDetailsModal } from '@/components/dashboard/modals/StreamDetailsModal'

// Wallet integration
import { useAuth } from '@/hooks/use-auth'
```

#### API Routes
```
api/
├── auth/
│   ├── login/           # User authentication
│   ├── register/        # User registration
│   └── wallet/          # Wallet connection
├── streams/             # Stream CRUD operations
├── analytics/           # Usage statistics
└── wallets/             # Wallet management
```

---

## 🌐 Deployment

### Testnet Deployment Status

#### Smart Contracts (Deployed)
- **Access Control**: `ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.bitpay-access-control`
- **Core Streams**: `ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.bitpay-core`
- **Network**: Stacks Testnet
- **sBTC Integration**: Connected to official sBTC testnet contracts

#### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel (recommended)
vercel deploy

# Or deploy to any Node.js hosting platform
npm start
```

### Environment Configuration

#### Smart Contracts (.env)
```bash
# Stacks network configuration
STACKS_NETWORK=testnet
STACKS_API_URL=https://api.testnet.hiro.so

# Deployment wallet
DEPLOYER_KEY=your-wallet-private-key
```

#### Frontend (.env.local)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/bitpay

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Stacks configuration
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_STACKS_API_URL=https://api.testnet.hiro.so

# Contract addresses
NEXT_PUBLIC_CORE_CONTRACT=ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.bitpay-core
NEXT_PUBLIC_ACCESS_CONTROL_CONTRACT=ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.bitpay-access-control
```

---

## 📊 Usage Examples

### Creating a Bitcoin Stream

```javascript
// Frontend: Create a 6-month Bitcoin stream
const streamData = {
  recipient: 'SP1234...ABCD',
  totalAmount: 1000000, // 0.01 BTC in satoshis
  durationBlocks: 26280, // ~6 months
  startDelay: 0,
  metadata: 'Salary stream for John Doe'
}

await createStream(streamData)
```

```clarity
;; Smart Contract: Stream creation
(contract-call? .bitpay-core create-stream
  'SP1234...ABCD    ;; recipient
  u1000000          ;; 0.01 BTC in satoshis
  u26280            ;; ~6 months in blocks
  u0                ;; start immediately
  u"Salary stream"  ;; metadata
)
```

### Claiming Stream Funds

```javascript
// Frontend: Claim available stream funds
const claimAmount = await claimStream(streamId)
console.log(`Claimed ${claimAmount} satoshis`)
```

```clarity
;; Smart Contract: Claim stream
(contract-call? .bitpay-core claim-stream u1) ;; stream ID 1
```

---

## 🔒 Security

### Smart Contract Security
- **Access Control**: Role-based permissions with admin oversight
- **Emergency Controls**: Circuit breakers for critical situations
- **Input Validation**: Comprehensive parameter checking
- **Reentrancy Protection**: Proper state management patterns
- **Overflow Protection**: Safe arithmetic operations

### Frontend Security
- **Wallet Integration**: Secure wallet connection via Stacks.js
- **Session Management**: JWT-based authentication
- **Input Sanitization**: Protection against injection attacks
- **HTTPS Enforcement**: Secure communication protocols

### Audit Status
- ✅ Smart contracts reviewed for common vulnerabilities
- ✅ Access control mechanisms tested
- ✅ Emergency procedures validated
- 🔄 External audit pending for mainnet deployment

---

## 📈 Roadmap

### Phase 1: Core Platform (✅ Completed)
- [x] Smart contract development and testing
- [x] Testnet deployment
- [x] Frontend application with wallet integration
- [x] Basic stream creation and management

### Phase 2: Advanced Features (🚧 In Progress)
- [ ] Advanced analytics dashboard
- [ ] Bulk stream operations
- [ ] Stream templates and presets
- [ ] Mobile application

### Phase 3: Enterprise Features (📋 Planned)
- [ ] Multi-signature wallet support
- [ ] Advanced treasury management
- [ ] API for third-party integrations
- [ ] White-label solutions

### Phase 4: Mainnet Launch (🎯 Target)
- [ ] Security audit completion
- [ ] Mainnet smart contract deployment
- [ ] Production infrastructure scaling
- [ ] Marketing and user acquisition

---

## 🤝 Contributing

We welcome contributions from the community! Please see our contributing guidelines:

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- **Smart Contracts**: Follow Clarity best practices
- **Frontend**: Use TypeScript with strict typing
- **Testing**: Maintain >90% test coverage
- **Documentation**: Update docs for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 Acknowledgments

- **Stacks Foundation** for the robust blockchain platform
- **sBTC Team** for the Bitcoin-pegged token innovation
- **Clarity Language** for smart contract security and clarity
- **Next.js Team** for the excellent frontend framework
- **Bitcoin Community** for the foundational technology

---

## 📞 Support & Contact

- **Documentation**: [docs.bitpay.stream](https://docs.bitpay.stream)
- **Discord**: [discord.gg/bitpay](https://discord.gg/bitpay)
- **Twitter**: [@BitPayStream](https://twitter.com/BitPayStream)
- **Email**: support@bitpay.stream

---

## 🏆 Recognition

> "The most innovative Bitcoin streaming platform on Stacks blockchain"

Built with ❤️ by the BitPay Team | Powered by Bitcoin & Stacks