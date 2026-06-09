import OpenAI from 'openai';

export function getDeepSeekClient() {
    const keysEnv = process.env.DEEPSEEK_API_KEY || '';

    // Support comma-separated keys for rotation
    const keys = keysEnv.split(',').map(k => k.trim()).filter(k => k.length > 0);

    if (keys.length === 0) {
        throw new Error('DEEPSEEK_API_KEY is not defined');
    }

    // Randomly select one key
    const randomKey = keys[Math.floor(Math.random() * keys.length)];

    /* 
    // Optional: Log which key block is being used (masked) for debugging
    const maskedKey = randomKey.slice(0, 4) + '...' + randomKey.slice(-4);
    console.log(`[AI Client] Using key: ${maskedKey} (Pool size: ${keys.length})`);
    */

    return new OpenAI({
        apiKey: randomKey,
        baseURL: 'https://api.deepseek.com',
    });
}
