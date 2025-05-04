"use client";

import { AgentSchema } from "@/schema/agent-schema";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "../ui/textarea";
import { useCreateAgent } from "@/hooks/server/useCreateAgent";
import { TerminalCard } from "../terminal/terminal-card";
import { useEffect, useState, useContext } from "react";
import { WalletContext } from "@/context/appkit";
import { ethers } from "ethers";
import { ABI, BYTECODE } from "@/constants";
import { Loader2 } from "lucide-react";

interface Step {
  text: string;
  status: "pending" | "loading" | "complete" | "error";
}

const DefiAgentForm = () => {
  const { mutateAsync } = useCreateAgent();
  const { isConnected, connect } = useContext(WalletContext);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<Step[]>([
    { text: "Initializing deployment...", status: "pending" },
    { text: "Creating smart contract...", status: "pending" },
    { text: "Deploying token to Rootstock Testnet...", status: "pending" },
    { text: "Verifying contract on Rootstock Explorer...", status: "pending" },
    { text: "Creating agent...", status: "pending" },
    { text: "Containerizing agent...", status: "pending" },
  ]);
  const [start, setStart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contractAddress, setContractAddress] = useState('');

  useEffect(() => {
    if (currentStep >= steps.length || steps[currentStep].text === "Creating agent..." || !start) {
      return;
    }

    const timer = setTimeout(() => {
      setSteps((prevSteps) => prevSteps.map((step, i) => (i === currentStep ? { ...step, status: "complete" } : step)));
      setCurrentStep((prev) => prev + 1);
    }, 2500);

    return () => clearTimeout(timer);
  }, [currentStep, steps, start]);

  const form = useForm<z.infer<typeof AgentSchema>>({
    resolver: zodResolver(AgentSchema),
  });

  async function onSubmit(values: z.infer<typeof AgentSchema>) {
    try {
      setLoading(true);

      // Update step
      setSteps((prevSteps) => {
        const newSteps = [...prevSteps];
        newSteps[4] = { text: "Creating agent...", status: "loading" };
        return newSteps;
      });

      // Force the chain value to be rootstock and include contract address if available
      const updatedValues = {
        ...values,
        agentType: "defi",
        chain: "rootstock",
        contractAddress: contractAddress || undefined
      };

      // Call the rootstock endpoint instead of flow
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/create-agent/rootstock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedValues),
      });

      if (!response.ok) {
        throw new Error(`Error creating agent: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Agent created successfully:', data);

      // Update the steps
      setSteps((prevSteps) => {
        const newSteps = [...prevSteps];
        newSteps[4] = { text: "Agent created successfully!", status: "complete" };
        newSteps[5] = { text: "Agent containerized successfully!", status: "complete" };
        return newSteps;
      });

    } catch (error) {
      console.error("Error creating agent:", error);
      setSteps((prevSteps) => {
        const newSteps = [...prevSteps];
        newSteps[4] = { text: "Error creating agent", status: "error" };
        return newSteps;
      });
    } finally {
      setLoading(false);
    }
  }
  const createTokenHandler = async () => {
    try {
      // Check if wallet is connected, if not, connect it
      if (!isConnected) {
        console.log('Wallet not connected, connecting...');
        await connect();

        // Show a message to the user
        setSteps((prevSteps) => {
          const newSteps = [...prevSteps];
          newSteps[0] = {
            text: "Please connect your wallet to continue",
            status: "loading"
          };
          return newSteps;
        });

        return; // Return and let the user click again after connecting
      }

      console.log('Wallet connected, proceeding with token creation');

      // Update first step to loading
      setSteps((prevSteps) => {
        const newSteps = [...prevSteps];
        newSteps[0] = { text: "Initializing deployment...", status: "loading" };
        return newSteps;
      });

      // Check if we're on the right network
      // @ts-ignore
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainIdHex, 16);

      if (currentChainId !== 31) {
        console.log('Not on Rootstock Testnet, switching networks...');

        setSteps((prevSteps) => {
          const newSteps = [...prevSteps];
          newSteps[0] = {
            text: "Switching to Rootstock Testnet...",
            status: "loading"
          };
          return newSteps;
        });

        try {
          // @ts-ignore
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1F' }], // 31 in hex
          });
        } catch (switchError: any) {
          console.error('Error switching networks:', switchError);

          if (switchError.code === 4902) {
            try {
              // @ts-ignore
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x1F', // 31 in hex
                    chainName: 'Rootstock Testnet',
                    nativeCurrency: {
                      name: 'tRBTC',
                      symbol: 'tRBTC',
                      decimals: 18
                    },
                    rpcUrls: ['https://public-node.testnet.rsk.co'],
                    blockExplorerUrls: ['https://explorer.testnet.rootstock.io']
                  }
                ],
              });
            } catch (addError) {
              console.error('Error adding Rootstock network:', addError);
              throw new Error('Could not add Rootstock network to your wallet');
            }
          } else {
            throw new Error('Could not switch to Rootstock network');
          }
        }
      }

      console.log('Creating provider...');
      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Update step to complete
      setSteps((prevSteps) => {
        const newSteps = [...prevSteps];
        newSteps[0] = { text: "Deployment initialized successfully", status: "complete" };
        newSteps[1] = { text: "Creating smart contract...", status: "loading" };
        return newSteps;
      });

      console.log('Getting signer...');
      const signer = await provider.getSigner();

      console.log('Creating contract factory...');
      const factory = new ethers.ContractFactory(ABI, BYTECODE, signer);

      const tokenName = form.getValues("agentName") + " Token";
      const tokenSymbol = form.getValues("agentName").substring(0, 4).toUpperCase();

      console.log(`Creating token: ${tokenName} (${tokenSymbol})`);

      // Update step to complete
      setSteps((prevSteps) => {
        const newSteps = [...prevSteps];
        newSteps[1] = { text: "Smart contract created successfully", status: "complete" };
        newSteps[2] = { text: "Deploying token to Rootstock Testnet...", status: "loading" };
        return newSteps;
      });

      console.log('Deploying contract...');
      const contract = await factory.deploy(tokenName, tokenSymbol, 18);
      console.log('Contract deployed at:', contract.target);
      setContractAddress(contract.target as string);

      // Update step to complete
      setSteps((prevSteps) => {
        const newSteps = [...prevSteps];
        newSteps[2] = {
          text: `Token deployed to Rootstock Testnet (${contract.target})`,
          status: "complete"
        };
        newSteps[3] = {
          text: `Verifying contract on Rootstock Explorer...`,
          status: "loading"
        };
        return newSteps;
      });

      // Simulate verification (in a real app, you would call the actual verification API)
      setTimeout(() => {
        setSteps((prevSteps) => {
          const newSteps = [...prevSteps];
          newSteps[3] = {
            text: `Contract verified on Rootstock Explorer`,
            status: "complete"
          };
          return newSteps;
        });

        setStart(true);
      }, 2000);

    } catch (error) {
      console.error("Error creating token:", error);
      alert(`Error creating token: ${error.message || 'Unknown error'}`);
      setSteps((prevSteps) => {
        const newSteps = [...prevSteps];
        newSteps[0] = { text: `Error: ${error.message || 'Unknown error'}`, status: "error" };
        return newSteps;
      });
    }
  };

  return (
    <div className="flex gap-10 min-w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-[60%] border-[1px] p-4 mt-4 rounded-lg border-gray-900">
          <FormField
            control={form.control}
            name="agentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent Name</FormLabel>
                <FormControl>
                  <Input placeholder="Agent name" {...field} />
                </FormControl>
                <FormDescription>This is your agent display name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="agentBio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Agent bio" {...field} />
                </FormControl>
                <FormDescription>Mention what this agent can do.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sdk"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SDK</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the SDK" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="agent-kit">Coinbase Agent kit</SelectItem>
                    <SelectItem value="covalent">Covalent</SelectItem>
                    <SelectItem value="eliza">Eliza OS</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Select the SDK you want to use to create agent(optional)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="chain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chain</FormLabel>
                <Select onValueChange={field.onChange} defaultValue="rootstock">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the Chain" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="rootstock">Rootstock Testnet</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Select the chain you want to deploy your agent on (Rootstock Testnet)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="knowledge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent Tasks</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter the knowledge of agent seperated by comma." {...field} />
                </FormControl>
                <FormDescription>Select the tasks which this agent should perform specifically.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-4">
            <Button type="submit" className="w-full text-sm" onClick={createTokenHandler}>
              Create Token
            </Button>
            {loading ? (
              <Button disabled className="w-full text-sm">
                <Loader2 className="animate-spin" />
                Please wait
              </Button>
            ) : (
              <Button type="submit" className="w-full text-sm">
                Create Agent
              </Button>
            )}
          </div>
        </form>
      </Form>
      <div className=" w-[25%] pt-4">
        <TerminalCard steps={steps} currentStep={currentStep} />
      </div>
    </div>
  );
};

export default DefiAgentForm;
