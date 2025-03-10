import { createDeepSeek } from '@ai-sdk/deepseek';
import { streamText } from 'ai';

// Get API key from environment variable
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Create a singleton instance of DeepSeek provider
const deepseekProvider = createDeepSeek({
    apiKey: DEEPSEEK_API_KEY,
    headers: {
        'Content-Type': 'application/json',
    },
    // Custom fetch implementation with reasonable timeout
    fetch: (input, init) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
        
        return fetch(input, {
            ...init,
            signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));
    }
});

export const runtime = 'edge'; // Use Edge runtime for better performance

// Helper function to detect if the query is mathematical
function isMathematicalQuery(query: string): boolean {
    // Check for common math patterns
    const mathPatterns = [
        /\d+\s*[\+\-\*\/]\s*\d+/,  // Basic operations like 1+1, 5*3
        /\d+\s*=\s*\?/,            // Equations like 1+1=?
        /what is \d+\s*[\+\-\*\/]\s*\d+/i, // Questions like "what is 5+3"
        /calculate/i,              // Words like "calculate"
        /solve/i,                  // Words like "solve"
        /equation/i,               // Words like "equation"
        /\d+\s*\^\s*\d+/,          // Exponents like 2^3
        /square root/i,            // Square roots
        /derivative/i,             // Calculus terms
        /integral/i,               // Calculus terms
    ];
    
    return mathPatterns.some(pattern => pattern.test(query));
}

export async function POST(req: Request) {
    try {
        // Parse the request body
        const { messages } = await req.json();

        // Validate API key
        if (!DEEPSEEK_API_KEY) {
            return new Response(
                JSON.stringify({ 
                    error: 'DeepSeek API key is not configured',
                    message: 'Please set the DEEPSEEK_API_KEY environment variable'
                }),
                { 
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Validate messages
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(
                JSON.stringify({ 
                    error: 'Invalid request',
                    message: 'Messages array is required'
                }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Check if the last message is a mathematical query
        const lastMessage = messages[messages.length - 1];
        const isMathQuery = lastMessage.role === 'user' && isMathematicalQuery(lastMessage.content);
        
        // Adjust temperature based on query type
        const temperature = isMathQuery ? 0.1 : 0.3;

        try {
            // Create the stream response
            const response = streamText({
                model: deepseekProvider('deepseek-chat'),
                messages,
                temperature, // Lower temperature for math queries to get more precise answers
            }).toDataStreamResponse({
                sendReasoning: false, // Disable reasoning for faster responses
            });

            return response;
        } catch (streamError) {
            console.error('Error streaming response:', streamError);
            
            return new Response(
                JSON.stringify({ 
                    error: 'Streaming error',
                    message: 'Failed to stream response from DeepSeek API',
                    details: streamError instanceof Error ? streamError.message : 'Unknown error'
                }),
                { 
                    status: 502,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
    } catch (error) {
        console.error('Error in chat API route:', error);
        
        return new Response(
            JSON.stringify({ 
                error: 'An error occurred while processing your request',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}