"use client";

import { useEffect, useState } from "react";
import AgentCard from "./agent-card";
import { apiClient, Agent } from "@/lib/api-client";

// We'll only display agents from the database

const AgentCards = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await apiClient.getAllAgents();
        setAgents(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching agents:", err);
        setError("Failed to load agents");
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  // If loading, show a loading message
  if (loading) {
    return <div className="text-center p-4">Loading agents...</div>;
  }

  // If error, show an error message
  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  // Filter out AI companion agents
  const filteredAgents = agents.filter(agent => agent.type.toLowerCase() !== 'ai-companion');

  // If no non-AI companion agents found, show a message
  if (filteredAgents.length === 0) {
    return <div className="text-center p-4">No agents found. Create your first agent!</div>;
  }

  // Sort agents by creation date (most recent first) and take up to 4
  const sortedAgents = [...filteredAgents].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const displayAgents = sortedAgents.slice(0, 4);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Display up to 4 agents from the database, 2 per row */}
      {displayAgents.map((agent) => {
        // Determine the image path based on agent type
        let imagePath = '/defi.jpg'; // Default image

        if (agent.type.toLowerCase() === 'game' || agent.type.toLowerCase() === 'gaming') {
          imagePath = '/game.jpg';
        } else if (agent.type.toLowerCase() === 'social') {
          imagePath = '/agent.png';
        }
        // AI companion agents are filtered out

        return (
          <AgentCard
            key={agent.id}
            name={agent.agentName}
            description={Array.isArray(agent.bio) ? agent.bio.join(" ") : agent.bio}
            contractAddress={agent.contractAddress || `0x${agent.id.substring(0, 4)}...${agent.id.substring(agent.id.length - 4)}`}
            category={agent.type.charAt(0).toUpperCase() + agent.type.slice(1)} // Capitalize the first letter
            image={imagePath}
          />
        );
      })}
    </div>
  );
};

export default AgentCards;
