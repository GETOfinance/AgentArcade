"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { GoPeople } from "react-icons/go";
import { apiClient, AgentStats } from "@/lib/api-client";

// Default data structure to use while loading
const DEFAULT_DATA = [
  {
    title: "Total Characters",
    value: 0,
    change: "+0%",
    icon: <GoPeople />,
  },
  {
    title: "Total Games",
    value: 0,
    change: "+0%",
    icon: <GoPeople />,
  },
  {
    title: "Total Defi",
    value: 0,
    change: "+0%",
    icon: <GoPeople />,
  },
  {
    title: "Total Social",
    value: 0,
    change: "+0%",
    icon: <GoPeople />,
  },
];

const AgentSummary = () => {
  const [stats, setStats] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.getAgentStats();

        // Transform the data to match our component's format
        const formattedStats = [
          {
            title: "Total Characters",
            value: data.totalCharacters.value,
            change: data.totalCharacters.change,
            icon: <GoPeople />,
          },
          {
            title: "Total Games",
            value: data.totalGames.value,
            change: data.totalGames.change,
            icon: <GoPeople />,
          },
          {
            title: "Total Defi",
            value: data.totalDefi.value,
            change: data.totalDefi.change,
            icon: <GoPeople />,
          },
          {
            title: "Total Social",
            value: data.totalSocial.value,
            change: data.totalSocial.change,
            icon: <GoPeople />,
          },
        ];

        setStats(formattedStats);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching agent stats:", err);
        setError("Failed to load agent statistics");
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="px-16">
      <div className="flex justify-between gap-4">
        {stats.map((item) => {
          return (
            <Card key={item.title} className="w-[220px]">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between py-2">
                <div className="flex gap-2 items-center">
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <Button size="sm" className="h-6 text-xs">{item.change}</Button>
                </div>
                <div>
                  <Button variant={"secondary"} size="sm" className="h-8 w-8">{item.icon}</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {error && <div className="text-red-500 mt-4 text-center">{error}</div>}
    </div>
  );
};

export default AgentSummary;
