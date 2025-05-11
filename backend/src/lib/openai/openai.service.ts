import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    // Initialize OpenAI with API key from environment variables
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey || apiKey === 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      console.warn('OpenAI API key is not set or is using a placeholder. Using fallback responses.');
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'sk-dummy-key',
    });
  }

  /**
   * Generate a response from OpenAI for the given agent and user message
   * @param agentName The name of the agent
   * @param agentBio The bio of the agent
   * @param userMessage The user's message
   * @returns The generated response
   */
  async generateResponse(agentName: string, agentBio: string[], userMessage: string): Promise<string> {
    try {
      // Create a system message that defines the agent's persona
      const bioText = Array.isArray(agentBio) ? agentBio.join(' ') : agentBio;
      const systemMessage = `You are ${agentName}, a DeFi assistant. ${bioText}
      You specialize in helping users with cryptocurrency and decentralized finance tasks.
      You are knowledgeable about the Rootstock Testnet blockchain (chainID: 31, Currency: tRBTC).

      IMPORTANT TRANSACTION CAPABILITIES:
      - You can help users send tRBTC transactions from their connected wallet.
      - When a user asks to send tRBTC to an address, you should:
        1. Confirm the user's intention to send tRBTC
        2. Extract the recipient address and amount from the user's message
        3. Validate that the address is a valid Ethereum address (0x format, 42 characters)
        4. Validate that the amount is a positive number
        5. Respond with a message that includes the exact phrase "Please send [AMOUNT] tRBTC to [ADDRESS]"
           where [AMOUNT] is the amount to send and [ADDRESS] is the recipient address.
           This exact format is required for the wallet integration to work.

      Always be helpful, concise, and stay in character.`;

      const apiKey = this.configService.get<string>('OPENAI_API_KEY');

      // If the API key is not set or is a placeholder, use fallback responses
      if (!apiKey || apiKey === 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
        return this.getFallbackResponse(agentName, userMessage);
      }

      try {
        // Call the OpenAI API
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        // Return the generated text
        return response.choices[0].message.content || 'I apologize, but I could not generate a response.';
      } catch (apiError) {
        console.error('Error calling OpenAI API:', apiError);
        return this.getFallbackResponse(agentName, userMessage);
      }
    } catch (error) {
      console.error('Error generating response from OpenAI:', error);
      return `I apologize, but I encountered an error while processing your request. Please try again later.`;
    }
  }

  /**
   * Get a fallback response when OpenAI is not available
   * @param agentName The name of the agent
   * @param userMessage The user's message
   * @returns A fallback response
   */
  private getFallbackResponse(agentName: string, userMessage: string): string {
    // Check if the user is asking to send a transaction
    const lowerMessage = userMessage.toLowerCase();
    if (
      (lowerMessage.includes('send') || lowerMessage.includes('transfer')) &&
      (lowerMessage.includes('tbtc') || lowerMessage.includes('trbtc') || lowerMessage.includes('btc'))
    ) {
      // Try to extract address and amount
      const addressMatch = userMessage.match(/0x[a-fA-F0-9]{40}/);
      const amountMatch = userMessage.match(/\d+(\.\d+)?/);

      if (addressMatch && amountMatch) {
        const address = addressMatch[0];
        const amount = amountMatch[0];
        return `I'll help you send tRBTC to that address. Please confirm the transaction details:\n\nPlease send ${amount} tRBTC to ${address}\n\nYou can complete this transaction by clicking the "Send" button in your wallet.`;
      } else {
        return `I'd be happy to help you send tRBTC. To proceed, I need both a valid recipient address (starting with 0x) and the amount you want to send. Could you please provide these details?`;
      }
    }

    // Simple fallback responses based on the user's message
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return `Hello! I'm ${agentName}, a DeFi assistant specialized in the Rootstock Testnet blockchain. I can help you with tasks like checking balances, transferring tokens, and providing information about the tRBTC currency. How can I assist you today?`;
    } else if (lowerMessage.includes('what can you do')) {
      return `As ${agentName}, I can help you with various DeFi operations on the Rootstock Testnet blockchain (chainID: 31), including:

1. Providing information about tRBTC tokens and their current market status
2. Sending tRBTC from your connected wallet to any address
3. Guiding you through swapping tokens on decentralized exchanges
4. Helping you understand yield farming and staking opportunities
5. Explaining blockchain concepts in simple terms

What specific DeFi task would you like help with today?`;
    } else {
      return `I understand you're asking about "${userMessage}". As a DeFi assistant for the Rootstock Testnet blockchain, I'd be happy to help with this. Could you provide more details about what you're trying to accomplish so I can give you the most relevant information?`;
    }
  }
}
