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

        try {
            // Add a system message to instruct the model to provide simple text responses
            const systemMessage = {
                role: 'system',
                content: 'For mathematical calculations, provide simple text responses without LaTeX notation. For example, respond to "What is 2+2?" with "2+2 = 4" rather than using LaTeX formatting.'
            };
            
            // Check if there's already a system message
            const hasSystemMessage = messages.some(msg => msg.role === 'system');
            
            // Create a new messages array with the system message if needed
            const messagesWithSystem = hasSystemMessage 
                ? messages 
                : [systemMessage, ...messages];

            // Create the stream response
            const response = streamText({
                model: deepseekProvider('deepseek-chat'),
                messages: messagesWithSystem,
                temperature: 0.3,
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