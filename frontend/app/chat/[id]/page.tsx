"use client";
import Chat from "@/components/chat";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useState, useEffect } from "react";

const Page = () => {
  const params = useParams();
  const agentId = params.id as string;

  return <Chat agentId={agentId} />;
};

export default Page;
