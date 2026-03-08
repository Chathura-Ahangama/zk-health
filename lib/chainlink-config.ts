/**
 * Chainlink configuration for MedZK
 *
 * NETWORKS:
 *   - Sepolia (testnet) — for hackathon demo
 *   - Avalanche Fuji — alternative testnet
 *
 * SETUP:
 *   1. Get LINK tokens from faucet: https://faucets.chain.link/
 *   2. Create Functions subscription: https://functions.chain.link/
 *   3. Register Automation upkeep: https://automation.chain.link/
 *   4. Fund both with LINK
 */

export const CHAINLINK_CONFIG = {
  // Sepolia Testnet
  sepolia: {
    chainId: 11155111,
    rpcUrl: "https://rpc.sepolia.org",
    functionsRouter: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    donId: "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000",
    subscriptionId: 0, // Fill after creating subscription
    linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    automationRegistry: "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad",
    explorerUrl: "https://sepolia.etherscan.io",
  },

  // Avalanche Fuji Testnet
  fuji: {
    chainId: 43113,
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    functionsRouter: "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5E6f0",
    donId: "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000",
    subscriptionId: 0,
    linkToken: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
    automationRegistry: "0x819B58A646CDd8289275A87653a2aA4902b14fe6",
    explorerUrl: "https://testnet.snowtrace.io",
  },
} as const;

export type ChainlinkNetwork = keyof typeof CHAINLINK_CONFIG;

/**
 * Contract addresses (filled after deployment)
 */
export const DEPLOYED_CONTRACTS = {
  sepolia: {
    verifier: "", // Fill after nargo codegen + deploy
    claimManager: "", // Fill after deploy
  },
  fuji: {
    verifier: "",
    claimManager: "",
  },
} as const;

/**
 * Chainlink Functions JavaScript source code
 * This runs on Chainlink's DON (Decentralized Oracle Network)
 */
export const FUNCTIONS_SOURCE = {
  /**
   * Fetch medical thresholds from a standards API.
   * For the hackathon demo, we use a mock endpoint.
   * In production, this would query WHO/AHA guidelines.
   */
  fetchThresholds: `
    // Fetch latest medical thresholds
    // In production: query medical standards databases
    const response = await Functions.makeHttpRequest({
      url: "https://api.jsonbin.io/v3/b/YOUR_BIN_ID/latest",
      headers: { "X-Access-Key": secrets.apiKey || "" }
    });

    if (response.error) {
      // Fallback to standard values
      const sugar = 126;
      const cholesterol = 200;
      const bp = 140;
      return Functions.encodeUint256(
        (BigInt(sugar) << 128n) | (BigInt(cholesterol) << 64n) | BigInt(bp)
      );
    }

    const data = response.data.record || response.data;
    const sugar = data.diabetes_fasting_glucose || 126;
    const cholesterol = data.total_cholesterol_healthy || 200;
    const bp = data.hypertension_stage2_systolic || 140;

    return Functions.encodeUint256(
      (BigInt(sugar) << 128n) | (BigInt(cholesterol) << 64n) | BigInt(bp)
    );
  `,

  /**
   * Verify a lab's registration status.
   */
  verifyLab: `
    const labHash = args[0];
    
    // In production: query a medical lab registry API
    // For demo: check against a known list
    const knownLabs = [
      "metro-diagnostics",
      "shanghai-medical", 
      "city-general"
    ];
    
    // Simulate API call
    const isRegistered = knownLabs.some(
      lab => labHash.toLowerCase().includes(lab)
    ) ? 1 : 0;
    
    return Functions.encodeUint256(isRegistered);
  `,
};
