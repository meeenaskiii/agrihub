"use client";

import AgriHubV3ABI from "@/app/AgriHubV3.abi.json"; // Assuming the ABI is at the root
import { Tab } from "@headlessui/react";
import { ethers } from "ethers";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Define types for our data structures
type Hub = {
  id: string;
  name: string;
  location: string;
};

type Product = {
  id: string;
  name: string;
  unit: string;
};

type ProductsByHub = {
  [key: string]: Product[];
};

type Listing = {
  id: string;
  product: string;
  quantity: string;
  unit: string;
  price: string;
  hub: string;
  status: string;
  dateCreated: string;
};

type Transaction = {
  id: string;
  date: string;
  productName: string;
  quantity: string;
  sharePercentage: string;
  buyer: string;
  totalAmount: string;
  shareAmount: string;
  status: string;
};

// Add contract-related types
type ContractProduct = {
  productId: string;
  name: string;
  totalQuantity: string;
  weightedPrice: string;
  active: boolean;
};

type ContractTransaction = {
  timestamp: number;
  productId: number;
  productName: string;
  quantity: number;
  sharePercentage: number;
  buyer: string;
  totalAmount: number;
  shareAmount: number;
};

export default function FarmerDashboard() {
  const [selectedHub, setSelectedHub] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Contract related state
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [contractProducts, setContractProducts] = useState<ContractProduct[]>([]);
  const [contractTransactions, setContractTransactions] = useState<ContractTransaction[]>([]);
  const [isFarmerRegistered, setIsFarmerRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [farmerEarnings, setFarmerEarnings] = useState("0");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHubAddress, setSelectedHubAddress] = useState("");
  const [contractHubs, setContractHubs] = useState<{id: string, name: string, location: string}[]>([]);
  const [isContributing, setIsContributing] = useState(false);

  // Contract address - in a real app, this would come from environment variables
  const CONTRACT_ADDRESS = "0xEF44C6f3b11cEacA73D1C7e7bF2C26e1D311212B"; // Replace with actual contract address

  // Check if wallet is already connected on component mount
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  // Initialize contract when wallet is connected
  useEffect(() => {
    if (walletConnected) {
      initializeContract();
    }
  }, [walletConnected]);

  // Load data when contract is initialized
  useEffect(() => {
    if (contract && walletAddress) {
      loadContractData();
    }
  }, [contract, walletAddress]);

  const checkIfWalletIsConnected = async () => {
    try {
      if ((window as any).ethereum) {
        // Only check accounts without requesting connection
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          setWalletConnected(true);
          setWalletAddress(accounts[0]);
        }
      }
    } catch (error) {
      console.error("Error checking if wallet is connected:", error);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      if ((window as any).ethereum) {
        // This will trigger the MetaMask popup
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
          setWalletConnected(true);
          setWalletAddress(accounts[0]);
        }
      } else {
        alert("MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html");
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const initializeContract = async () => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const agriHubContract = new ethers.Contract(CONTRACT_ADDRESS, AgriHubV3ABI, signer);
      
      setContract(agriHubContract);
    } catch (error) {
      console.error("Error initializing contract:", error);
    }
  };

  const loadContractData = async () => {
    setIsLoading(true);
    try {
      if (!contract) return;

      // Check if the current address is registered as a farmer
      const isRegistered = await contract.farmerExists(walletAddress);
      setIsFarmerRegistered(isRegistered);

      if (isRegistered) {
        // Load farmer earnings
        const earnings = await contract.getFarmerEarnings(walletAddress);
        setFarmerEarnings(ethers.formatEther(earnings));

        // Load farmer transactions
        const transactions = await contract.getFarmerTransactionsStructured(walletAddress);
        const formattedTransactions = transactions.map((tx: any) => ({
          timestamp: Number(tx.timestamp),
          productId: Number(tx.productId),
          productName: tx.productName,
          quantity: Number(tx.quantity),
          sharePercentage: Number(tx.sharePercentage),
          buyer: tx.buyer,
          totalAmount: parseFloat(ethers.formatEther(tx.totalAmount)),
          shareAmount: parseFloat(ethers.formatEther(tx.shareAmount))
        }));
        setContractTransactions(formattedTransactions);
      }

      // Load all hubs
      const hubAddresses = await contract.getAllHubs();
      const hubsData = await Promise.all(
        hubAddresses.map(async (address: string) => {
          const hubInfo = await contract.getHubInfo(address);
          return {
            id: address,
            name: hubInfo.name,
            location: hubInfo.location
          };
        })
      );
      setContractHubs(hubsData);

    } catch (error) {
      console.error("Error loading contract data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const registerAsFarmer = async () => {
    if (!contract) return;
    
    setIsRegistering(true);
    try {
      const tx = await contract.registerAsFarmer();
      await tx.wait();
      setIsFarmerRegistered(true);
      
      // Reload data after registration
      await loadContractData();
    } catch (error) {
      console.error("Error registering as farmer:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  const loadHubProducts = async (hubAddress: string) => {
    if (!contract) return;
    
    try {
      // Instead of loading all hub products, we need to load only the farmer's contributions
      const farmerContributions = await contract.getFarmerContributions(walletAddress);
      
      // Filter contributions for the selected hub
      const hubContributions = farmerContributions.filter(
        (contribution: any) => contribution.hubAddress.toLowerCase() === hubAddress.toLowerCase()
      );
      
      // Get product details for each contribution
      const formattedProducts = await Promise.all(
        hubContributions.map(async (contribution: any) => {
          const productId = contribution.productId.toString();
          const productDetails = await contract.getProductDetails(productId);
          const hubProductDetails = await contract.getHubProductDetails(hubAddress, productId);
          
          return {
            productId: productId,
            name: productDetails,
            totalQuantity: contribution.quantity.toString(),
            weightedPrice: ethers.formatEther(hubProductDetails[2]), // weightedPrice is at index 2
            active: true // We assume the product is active if the farmer has contributed
          };
        })
      );
      
      setContractProducts(formattedProducts);
    } catch (error) {
      console.error("Error loading farmer's hub products:", error);
    }
  };

  const contributeProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contract || !selectedHubAddress || !selectedProduct || !quantity || !price) {
      alert("Please fill all fields");
      return;
    }
    
    setIsContributing(true);
    
    try {
      // Convert price to wei (assuming price is in inr)
      const priceInWei = ethers.parseEther(price);
      
      const tx = await contract.contributeProduct(
        selectedHubAddress,
        selectedProduct,
        quantity,
        priceInWei
      );
      
      await tx.wait();
      
      setSuccessMessage("Your produce has been listed successfully!");
      
      // Reset form
      setSelectedProduct("");
      setQuantity("");
      setPrice("");
      
      // Reload data
      await loadContractData();
      if (selectedHubAddress) {
        await loadHubProducts(selectedHubAddress);
      }
      
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error contributing product:", error);
      alert("Failed to list product. Please try again.");
    } finally {
      setIsContributing(false);
    }
  };

  const handleWithdraw = async () => {
    // In this contract, earnings are automatically transferred to the farmer
    // This function is kept for UI consistency but doesn't need to do anything
    setIsWithdrawing(true);
    
    setTimeout(() => {
      setIsWithdrawing(false);
      setWithdrawSuccess(`Your earnings have already been transferred to your wallet.`);
      
      setTimeout(() => {
        setWithdrawSuccess("");
      }, 3000);
    }, 1500);
  };

  // Format timestamp to date string
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Add disconnect function
  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress("");
    setContract(null);
    setContractProducts([]);
    setContractTransactions([]);
    setIsFarmerRegistered(false);
    setFarmerEarnings("0");
    // Reset other state as needed
  };

  // If wallet is not connected, show connect wallet screen
  if (!walletConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <Image 
              src="/logo.svg" 
              alt="AgriHub Logo" 
              width={64} 
              height={64}
              className="text-green-700"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to AgriHub</h1>
          <p className="text-gray-600 mb-8">Connect your wallet to access the farmer dashboard</p>
          
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-green-700 hover:bg-green-600 text-white py-3 px-4 rounded-md transition-colors flex items-center justify-center mb-4"
          >
            {isConnecting ? (
              "Connecting..."
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1-2.257-2.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
                Connect with MetaMask
              </>
            )}
          </button>
          
          {/* Add Home button */}
          <Link href="/" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-md transition-colors flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Back to Home
          </Link>
          
          <p className="text-sm text-gray-500 mt-4">
            Don't have MetaMask? <a href="https://metamask.io/download.html" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-500">Download here</a>
          </p>
        </div>
      </div>
    );
  }

  // If wallet is connected but not registered as farmer
  if (walletConnected && !isFarmerRegistered && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image 
                src="/logo.svg" 
                alt="AgriHub Logo" 
                width={32} 
                height={32}
                className="text-green-700"
              />
              <span className="text-xl font-bold text-green-700">AgriHub</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Add Home button */}
              <Link href="/" className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Home
              </Link>
              <div className="flex items-center bg-green-50 px-3 py-1 rounded-full text-sm text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </div>
              <button
                onClick={disconnectWallet}
                className="text-sm bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded-md transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zm7 5a1 1 0 10-2 0v4.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 12.586V8z" clipRule="evenodd" />
                </svg>
                Disconnect
              </button>
            </div>
          </div>
        </header>

        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <Image 
                src="/logo.svg" 
                alt="AgriHub Logo" 
                width={64} 
                height={64}
                className="text-green-700"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to AgriHub</h1>
            <p className="text-gray-600 mb-8">Register as a farmer to start listing your produce</p>
            
            <button
              onClick={registerAsFarmer}
              disabled={isRegistering}
              className="w-full bg-green-700 hover:bg-green-600 text-white py-3 px-4 rounded-md transition-colors flex items-center justify-center"
            >
              {isRegistering ? (
                "Registering..."
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Register as Farmer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-700"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image 
              src="/logo.svg" 
              alt="AgriHub Logo" 
              width={32} 
              height={32}
              className="text-green-700"
            />
            <span className="text-xl font-bold text-green-700">AgriHub</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Farmer Dashboard</span>
            {/* Add Home button */}
            <Link href="/" className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Home
            </Link>
            <div className="flex items-center bg-green-50 px-3 py-1 rounded-full text-sm text-green-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
            </div>
            <button
              onClick={disconnectWallet}
              className="text-sm bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded-md transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zm7 5a1 1 0 10-2 0v4.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 12.586V8z" clipRule="evenodd" />
              </svg>
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Farmer Dashboard</h1>
          <p className="text-gray-600">Manage your produce listings and track transactions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Total Earnings</p>
                <h3 className="font-bold text-2xl text-gray-900">{farmerEarnings} INR</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Active Listings</p>
                <h3 className="font-bold text-2xl text-gray-900">{contractProducts.length}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Total Transactions</p>
                <h3 className="font-bold text-2xl text-gray-900">{contractTransactions.length}</h3>
              </div>
            </div>
          </div>
        </div>

        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-green-50 p-1 mb-8">
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected 
                ? 'bg-white text-green-700 shadow' 
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-green-600'
              }`
            }>
              Produce
            </Tab>
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected 
                ? 'bg-white text-green-700 shadow' 
                : 'text-gray-600 hover:bg-white/[0.12] hover:text-green-600'
              }`
            }>
              Transactions
            </Tab>
          </Tab.List>
          
          <Tab.Panels>
            {/* Produce Tab */}
            <Tab.Panel>
              <div className="grid md:grid-cols-3 gap-8">
                {/* List New Produce Form */}
                <div className="md:col-span-1 bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">List New Produce</h2>
                  
                  {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                      {successMessage}
                    </div>
                  )}
                  
                  <form onSubmit={contributeProduct}>
                    <div className="mb-4">
                      <label htmlFor="hub" className="block text-sm font-medium text-gray-700 mb-1">
                        Select Hub
                      </label>
                      <select
                        id="hub"
                        value={selectedHubAddress}
                        onChange={(e) => {
                          setSelectedHubAddress(e.target.value);
                          if (e.target.value) {
                            loadHubProducts(e.target.value);
                          }
                        }}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        required
                      >
                        <option value="">Select a hub</option>
                        {contractHubs.map((hub) => (
                          <option key={hub.id} value={hub.id}>
                            {hub.name} - {hub.location}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
                        Select Product
                      </label>
                      <select
                        id="product"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        disabled={!selectedHubAddress}
                        required
                      >
                        <option value="">Select a product</option>
                        {contractProducts.map((product) => (
                          <option key={product.productId} value={product.productId}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        placeholder="Enter quantity"
                        min="1"
                        required
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                        Price per Unit (INR)
                      </label>
                      <input
                        type="number"
                        id="price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        placeholder="Enter price per unit"
                        step="0.0001"
                        min="0.0001"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-green-700 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors"
                      disabled={isContributing}
                    >
                      {isContributing ? "Submitting..." : "List Produce"}
                    </button>
                  </form>
                </div>
                
                {/* Current Listings */}
                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Your Current Listings</h2>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hub
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {contractProducts.map((product) => {
                          const hub = contractHubs.find(h => h.id === selectedHubAddress);
                          return (
                            <tr key={product.productId}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {product.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {product.totalQuantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {product.weightedPrice} INR
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {hub?.name || "Unknown Hub"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  product.active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {product.active ? "Active" : "Inactive"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {contractProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      You don't have any active listings. Use the form to list your produce.
                    </div>
                  )}
                </div>
              </div>
            </Tab.Panel>
            
            {/* Transactions Tab */}
            <Tab.Panel>
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Your Transactions</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Share %
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Your Share
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Buyer
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contractTransactions.map((transaction, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(transaction.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.productName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(transaction.sharePercentage / 100).toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.totalAmount.toFixed(4)} INR
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.shareAmount.toFixed(4)} INR
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.buyer.substring(0, 6)}...{transaction.buyer.substring(transaction.buyer.length - 4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {contractTransactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    You don't have any transactions yet.
                  </div>
                )}

                {/* Earnings Section */}
                <div className="mt-8 p-6 bg-green-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Your Earnings</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-600">Total Earnings:</p>
                      <p className="text-2xl font-bold text-gray-900">{farmerEarnings} INR</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Earnings are automatically transferred to your wallet when a purchase is made
                      </p>
                    </div>
                    <div>
                      {withdrawSuccess && (
                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                          {withdrawSuccess}
                        </div>
                      )}
                      <button
                        onClick={handleWithdraw}
                        disabled={isWithdrawing || parseFloat(farmerEarnings) === 0}
                        className={`bg-green-700 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors ${
                          isWithdrawing || parseFloat(farmerEarnings) === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isWithdrawing ? "Processing..." : "Check Earnings"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        {/* Contract Information Section */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contract Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Contract Address:</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                {CONTRACT_ADDRESS}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Your Wallet Address:</p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                {walletAddress}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              This dashboard interacts with the AgriHubV3 smart contract on the Ethereum blockchain.
              All transactions are recorded on-chain and your earnings are automatically transferred to your wallet.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 