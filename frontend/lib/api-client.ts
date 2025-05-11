// API client for the backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8002';

export interface Agent {
  id: string;
  agentName: string;
  bio: string[];
  type: string;
  knowledge: string[];
  chain: string;
  contractAddress?: string;
  imageName: string;
  port: number;
  createdAt: string;
}

// No mock data - we'll only use agents from the backend

export interface AgentStats {
  totalCharacters: { value: number; change: string };
  totalGames: { value: number; change: string };
  totalDefi: { value: number; change: string };
  totalSocial: { value: number; change: string };
}

export const apiClient = {
  // Fetch all agents from the backend
  getAllAgents: async (): Promise<Agent[]> => {
    try {
      const response = await fetch(`${BACKEND_URL}/create-agent/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching agents: ${response.statusText}`);
      }

      const data = await response.json();
      // Filter out AI companion agents and return up to 4 of the remaining agents
      if (data && data.agents) {
        const filteredAgents = data.agents.filter(agent => agent.type.toLowerCase() !== 'ai-companion');
        return filteredAgents.slice(0, 4);
      }

      // Return empty array if no agents found
      return [];
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Return empty array on error
      return [];
    }
  },

  // Fetch agent statistics from the backend
  getAgentStats: async (): Promise<AgentStats> => {
    try {
      const response = await fetch(`${BACKEND_URL}/create-agent/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Error fetching agent stats: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Stats response:', data);
      if (data && data.stats) {
        return data.stats;
      }

      // Return default stats if none found
      return {
        totalCharacters: { value: 0, change: '+0%' },
        totalGames: { value: 0, change: '+0%' },
        totalDefi: { value: 0, change: '+0%' },
        totalSocial: { value: 0, change: '+0%' }
      };
    } catch (error) {
      console.error('Error fetching agent stats:', error);
      // Return default stats on error
      return {
        totalCharacters: { value: 0, change: '+0%' },
        totalGames: { value: 0, change: '+0%' },
        totalDefi: { value: 0, change: '+0%' },
        totalSocial: { value: 0, change: '+0%' }
      };
    }
  },

  // Communicate with an agent
  communicateWithAgent: async (agentName: string, message: string): Promise<any> => {
    try {
      const response = await fetch(`${BACKEND_URL}/communicate/${agentName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Error communicating with agent: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error communicating with agent:', error);
      throw error;
    }
  }
};
