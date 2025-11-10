
import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
    'MONGODB_URI',
    'PRIVATE_KEY',
    'RPC_URL',
    'CONTRACT_ADDRESS'
];

const optionalEnvVars = {
    PORT: 4000,
    NODE_ENV: 'development',
    CORS_ORIGIN: 'http://localhost:5173,http://localhost:3000',
    API_BASE_URL: null
};

// Validate required environment variables
function validateEnv() {
    const missing = [];

    for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(v => console.error(`   - ${v}`));
        console.error('\n💡 Please create a .env file with all required variables.');
        process.exit(1);
    }

    // Set optional defaults
    for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
        if (!process.env[key] && defaultValue !== null) {
            process.env[key] = String(defaultValue);
        }
    }

    // Validate formats
    if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
        console.warn('⚠️  MONGODB_URI should start with "mongodb://" or "mongodb+srv://"');
    }

    if (process.env.PRIVATE_KEY && !process.env.PRIVATE_KEY.startsWith('0x')) {
        // Auto-fix: add 0x prefix if missing
        if (process.env.PRIVATE_KEY.length === 64) {
            process.env.PRIVATE_KEY = '0x' + process.env.PRIVATE_KEY;
            console.log('✅ Auto-added "0x" prefix to PRIVATE_KEY');
        } else {
            console.warn('⚠️  PRIVATE_KEY should start with "0x" and be 66 characters long');
        }
    }

    if (process.env.RPC_URL && !process.env.RPC_URL.startsWith('http')) {
        console.warn('⚠️  RPC_URL should be a valid HTTP/HTTPS URL');
    }

    console.log('✅ Environment variables validated');
}

// Export validated config
export const config = {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodb: {
        uri: process.env.MONGODB_URI
    },
    blockchain: {
        rpcUrl: process.env.RPC_URL,
        privateKey: process.env.PRIVATE_KEY,
        contractAddress: process.env.CONTRACT_ADDRESS
    },
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000']
    },
    api: {
        baseUrl: process.env.API_BASE_URL || null
    }
};

// Run validation on import
validateEnv();

export default config;

