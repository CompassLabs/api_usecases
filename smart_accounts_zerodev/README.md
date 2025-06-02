# Smart Accounts Integration with ZeroDev

This project demonstrates the integration of Smart Accounts using ZeroDev's Account Abstraction SDK and Compass Labs' API SDK. It implements a sample application that performs batched transactions on the Arbitrum network, specifically for interacting with Aave V3 protocol.

## Features

- Smart Account creation using ZeroDev's Kernel Account system
- ECDSA validation for account security
- Integration with Compass Labs API for smart account operations
- Batched transaction support for efficient operations
- Built-in gas sponsorship using ZeroDev's paymaster

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- An Arbitrum network connection
- Required API keys and credentials

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
ZERODEV_RPC=your_zerodev_rpc_url
PRIVATE_KEY=your_private_key
COMPASS_API_KEY=your_compass_api_key
```

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

The project demonstrates how to:
1. Create a Kernel Account with ECDSA validation
2. Set up a ZeroDev paymaster for gas sponsorship
3. Execute batched transactions using Compass Labs API
4. Perform AAVE operations (allowance increase and supply)

To run the example:

```bash
npm start
```

## Example Operations

The current implementation showcases two batched operations:
1. Increasing USDC allowance for AaveV3Pool
2. Supplying USDC to Aave

## Dependencies

- @compass-labs/api-sdk: Integration with Compass Labs API
- @zerodev/sdk: Account Abstraction implementation
- @zerodev/ecdsa-validator: Account validation
- viem: Ethereum interaction library
- dotenv: Environment variable management

## Development

```bash
# Run in development mode with ts-node
npx ts-node src/index.ts

# Build the project
npm run build

# Run the built version
npm start
```

## Security Notes

- Never commit your `.env` file or expose your private keys
- Always use secure and private RPC endpoints
- Validate all transaction parameters before execution
