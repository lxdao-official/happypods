# Web3 Setup Guide

This project is now integrated with RainbowKit for Web3 wallet connectivity.

## Setup Instructions

### 1. Get WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in to your account
3. Create a new project
4. Copy your Project ID

### 2. Environment Variables

Create a `.env.local` file in the root directory and add:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/happy_pods"

# WalletConnect (Get your project ID from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_project_id_here"
```

### 3. Supported Networks

The app currently supports:
- Ethereum Mainnet
- Sepolia Testnet

You can modify the supported chains in `src/lib/wagmi.ts`.

### 4. Features

- **Connect Wallet**: Users can connect their Web3 wallets
- **Wallet Information**: Display wallet address and balance
- **Multi-chain Support**: Support for multiple Ethereum networks
- **Responsive Design**: Works on desktop and mobile

### 5. Development

Run the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:3016`

### 6. Components

- `ConnectWallet`: RainbowKit connect button
- `WalletInfo`: Display wallet address and balance
- `RainbowKitProviderWrapper`: Provider wrapper for Web3 functionality

### 7. Customization

You can customize the RainbowKit theme and supported wallets by modifying the configuration in `src/lib/wagmi.ts`. 