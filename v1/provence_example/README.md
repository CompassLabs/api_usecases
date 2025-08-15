# Vault Management Application

A modern React application for managing DeFi vaults using the Compass Labs API. This application provides a comprehensive interface for viewing vault performance, managing deposits and withdrawals, and optimizing gas costs through transaction bundling.

## 🚀 Features

### **Vault Overview Dashboard**
- **Real-time Vault Loading**: Automatically fetches all available vaults from Compass API on startup
- **APY Performance Ranking**: Vaults are automatically sorted by APY in descending order (highest performing first)
- **Performance Metrics**: Summary statistics including total vaults, highest APY, and average APY
- **Comprehensive Vault Information**: Name, protocol, APY, address, and chain details

### **Transaction Management**
- **Deposit & Withdrawal**: Full support for vault deposits and withdrawals
- **Transaction Bundler Integration**: Uses Compass transaction bundler for gas optimization
- **Authorization Flow**: Implements the complete authorization → signing → execution flow
- **Gas Optimization**: Bundles multiple actions (allowance + deposit/withdraw) into single transactions

### **User Interface**
- **Responsive Design**: Modern, clean interface built with Tailwind CSS
- **Interactive Modals**: User-friendly deposit and withdrawal forms
- **Real-time Updates**: Live vault data with refresh capabilities
- **Loading States**: Comprehensive loading indicators and error handling

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Next.js 14
- **Styling**: Tailwind CSS
- **API Integration**: Compass Labs API SDK
- **State Management**: React Hooks
- **Transaction Handling**: Compass Transaction Bundler

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Compass Labs API key

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd provence_example
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```bash
   NEXT_PUBLIC_COMPASS_API_KEY=your_actual_api_key_here
   ```
   
   **Important**: Replace `your_actual_api_key_here` with your real Compass API key.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── app/
│   └── page.tsx                 # Main application page
├── components/
│   ├── Header.tsx               # Application header
│   ├── LoadingSpinner.tsx       # Loading indicator component
│   ├── VaultList.tsx            # Main vault table display
│   └── VaultActions.tsx         # Deposit/withdrawal actions
├── hooks/
│   └── useVaults.ts             # Vault data management hook
└── types/                       # TypeScript type definitions
```

## 🔌 API Integration

### **Compass API Endpoints Used**
- **Vault Data**: `compassApiSDK.morpho.morphoVaults({})`
- **Transaction Authorization**: `compassApiSDK.transactionBundler.transactionBundlerAuthorization()`
- **Transaction Execution**: `compassApiSDK.transactionBundler.transactionBundlerExecute()`

### **Transaction Flow**
1. **Authorization Request**: Get authorization data from Compass API
2. **User Signing**: User signs the authorization (implemented by Provence)
3. **Bundled Execution**: Execute allowance + deposit/withdraw in single transaction

## 📊 Vault Information Displayed

Each vault in the list shows:
- **Rank**: Position based on APY performance
- **Vault Name**: Human-readable vault identifier
- **Protocol**: The protocol the vault belongs to (e.g., Morpho)
- **APY**: Annual Percentage Yield (color-coded by performance)
- **Address**: Shortened contract address
- **Actions**: Deposit and withdrawal buttons

## 🎨 APY Performance Indicators

- **🟢 Green**: APY > 5% (High performance)
- **🟡 Yellow**: APY 2-5% (Medium performance)
- **⚫ Gray**: APY < 2% or unavailable (Low performance)

## 🔐 Security Features

- **Environment Variables**: API keys stored securely in `.env.local`
- **Input Validation**: Form validation for amounts and user inputs
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Transaction Security**: Proper authorization flow for all transactions

## 🚧 Current Implementation Status

### **✅ Completed**
- Vault data loading and display
- APY-based sorting and ranking
- Transaction bundler integration structure
- User interface components
- Error handling and loading states

### **🔄 In Progress**
- Transaction authorization signing (requires Provence integration)
- Real wallet connection for transaction signing

### **📋 Future Enhancements**
- Multi-chain support
- Historical APY data
- Portfolio tracking
- Advanced filtering and search
- Export functionality

## 🐛 Troubleshooting

### **Common Issues**

1. **"COMPASS_API_KEY not found"**
   - Ensure `.env.local` file exists in project root
   - Verify API key is correctly set
   - Restart development server after changes

2. **"Failed to load vaults"**
   - Check API key validity and permissions
   - Verify network connectivity
   - Check browser console for detailed error messages

3. **Transaction Authorization Issues**
   - Ensure proper API key permissions
   - Check transaction bundler service status
   - Verify chain configuration

### **Development Commands**

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [Compass Labs API documentation](https://docs.compasslabs.ai/)
- Review the browser console for error details
- Ensure all environment variables are properly configured

## 🔄 Version History

- **v1.0.0**: Initial release with vault management and transaction bundler integration
- Basic vault display and APY sorting
- Transaction bundler structure
- User interface components

---

**Note**: This application is designed to work with the Compass Labs API and requires proper API key configuration. Ensure you have the necessary permissions and follow security best practices when deploying to production environments. 