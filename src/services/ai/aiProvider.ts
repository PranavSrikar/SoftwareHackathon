import { GoogleGenAI } from '@google/genai';

export interface AIProvider {
  generateResponse(prompt: string, systemInstruction: string): Promise<string>;
}

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI | null = null;

  constructor() {
    let apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
      if (apiKey) {
        try {
          this.client = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });
        } catch (err) {
          console.error('[GeminiProvider] Initialization failed:', err);
        }
      }
    }
  }

  async generateResponse(prompt: string, systemInstruction: string): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini API client not initialized. Check GEMINI_API_KEY.');
    }

    const response = await this.client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  }
}

export class MockProvider implements AIProvider {
  async generateResponse(prompt: string, systemInstruction: string): Promise<string> {
    // Generate a fallback offline response depending on keywords in the prompt
    const p = prompt.toLowerCase();
    
    if (p.includes('building') || p.includes('grid') || p.includes('load') || p.includes('transformer')) {
      return `📊 **Offline Energy Insight**: Currently, the grid limit is configured safely. If building load spikes, Voltra's autonomous scheduler throttles low-priority EV charging ports automatically to keep total demand below the safe limit.\n\n*Configure your **GEMINI_API_KEY** to enable full real-time AI reasoning!*`;
    }
    
    if (p.includes('solar') || p.includes('renewable') || p.includes('weather') || p.includes('surplus')) {
      return `☀️ **Offline Solar Update**: Voltra's priority engine maximizes clean solar charging by routing solar surplus directly to connected vehicles at 0% grid surcharge. Peak solar availability usually occurs between 11 AM and 3 PM.\n\n*Configure your **GEMINI_API_KEY** to enable full real-time AI reasoning!*`;
    }

    if (p.includes('ready') || p.includes('departure') || p.includes('slow') || p.includes('boost')) {
      return `🚗 **Offline Charger Status**: Connected vehicles are dynamically allocated power based on their Priority Score. If your vehicle is charging slower than max, it is likely because another vehicle has an urgent departure or because building demand is elevated.\n\n*Configure your **GEMINI_API_KEY** to enable full real-time AI reasoning!*`;
    }

    return `🤖 **Voltra AI Assistant (Offline Mode)**: I can help explain SoC, Priority Scores, Grid Limits, and Solar forecasting.\n\nTo enable full interactive reasoning and personalized charging advice, please add a valid **GEMINI_API_KEY** to your environment variables!`;
  }
}
