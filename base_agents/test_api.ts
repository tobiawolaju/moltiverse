import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function test() {
    try {
        console.log('Testing gemini-1.5-flash generateContent with NO extras...');
        const result = await model.generateContent('hi');
        console.log('Response:', result.response.text());
    } catch (error: any) {
        console.error('API Error:', error.message || error);
    }
}

test();
