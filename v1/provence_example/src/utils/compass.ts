import { CompassApiSDK } from '@compass-labs/api-sdk';

/**
 * Creates and returns a configured Compass API SDK instance
 * @returns CompassApiSDK instance
 * @throws Error if COMPASS_API_KEY is not found in environment variables
 */
export const getCompassSDK = (): CompassApiSDK => {
  const apiKey = process.env.NEXT_PUBLIC_COMPASS_API_KEY;
  
  if (!apiKey) {
    throw new Error('COMPASS_API_KEY not found in environment variables');
  }
  
  return new CompassApiSDK({ apiKeyAuth: apiKey });
};
