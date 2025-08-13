'use client';

import { useState } from 'react';

interface StrategyParams {
  asset: string;
  amount: string;
  leverage: number;
  slippage: number;
  ltv: number;
}

export default function AaveLoopingStrategy() {
  const [strategyParams, setStrategyParams] = useState<StrategyParams>({
    asset: 'ETH',
    amount: '',
    leverage: 2,
    slippage: 0.5,
    ltv: 75,
  });

  const [isExecuting, setIsExecuting] = useState(false);

  const handleParamChange = (key: keyof StrategyParams, value: string | number) => {
    setStrategyParams(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const executeStrategy = async () => {
    setIsExecuting(true);
    // Placeholder for strategy execution
    setTimeout(() => {
      setIsExecuting(false);
      alert('Strategy execution simulated! In a real app, this would interact with Aave.');
    }, 2000);
  };

  const calculateExpectedReturn = () => {
    const amount = parseFloat(strategyParams.amount) || 0;
    const leveragedAmount = amount * strategyParams.leverage;
    return leveragedAmount.toFixed(4);
  };

  const assets = ['ETH', 'WBTC', 'USDC', 'DAI'];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Aave Looping Strategy</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure and execute your leveraged position strategy
        </p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Asset Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Asset
          </label>
          <select
            value={strategyParams.asset}
            onChange={(e) => handleParamChange('asset', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {assets.map(asset => (
              <option key={asset} value={asset}>{asset}</option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Initial Amount ({strategyParams.asset})
          </label>
          <input
            type="number"
            value={strategyParams.amount}
            onChange={(e) => handleParamChange('amount', e.target.value)}
            placeholder="0.0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Leverage Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Leverage: {strategyParams.leverage}x
          </label>
          <input
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={strategyParams.leverage}
            onChange={(e) => handleParamChange('leverage', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1x</span>
            <span>2.5x</span>
            <span>5x</span>
          </div>
        </div>

        {/* LTV */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target LTV (Loan-to-Value): {strategyParams.ltv}%
          </label>
          <input
            type="range"
            min="50"
            max="85"
            step="1"
            value={strategyParams.ltv}
            onChange={(e) => handleParamChange('ltv', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>50%</span>
            <span>67.5%</span>
            <span>85%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Higher LTV = more aggressive strategy, lower LTV = more conservative
          </p>
        </div>

        {/* Slippage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Slippage: {strategyParams.slippage}%
          </label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={strategyParams.slippage}
            onChange={(e) => handleParamChange('slippage', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.1%</span>
            <span>1.5%</span>
            <span>3%</span>
          </div>
        </div>

        {/* Strategy Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Strategy Summary</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Initial Amount:</span>
              <span>{strategyParams.amount || '0'} {strategyParams.asset}</span>
            </div>
            <div className="flex justify-between">
              <span>Leverage:</span>
              <span>{strategyParams.leverage}x</span>
            </div>
            <div className="flex justify-between">
              <span>Target LTV:</span>
              <span>{strategyParams.ltv}%</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total Position:</span>
              <span>{calculateExpectedReturn()} {strategyParams.asset}</span>
            </div>
            <div className="flex justify-between">
              <span>Max Slippage:</span>
              <span>{strategyParams.slippage}%</span>
            </div>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Risk Warning</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Leveraged positions amplify both gains and losses. You could lose more than your initial investment.
              </p>
            </div>
          </div>
        </div>

        {/* Execute Button */}
        <button
          onClick={executeStrategy}
          disabled={isExecuting || !strategyParams.amount}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isExecuting ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Executing Strategy...
            </div>
          ) : (
            'Execute Looping Strategy'
          )}
        </button>
      </div>
    </div>
  );
}