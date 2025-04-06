"use client";

import AgriHubV3ABI from "@/app/AgriHubV3.abi.json"; // Import the ABI
import { Tab } from "@headlessui/react";
import { ethers } from "ethers";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// Define types
type Product = {
  id: string;
  name: string;
  unit: string;
  enabled: boolean;
};

type Listing = {
  id: string;
  farmerId: string;
  farmerName: string;
  productId: string;
  productName: string;
  quantity: string;
  unit: string;
  price: string;
  dateCreated: string;
  status: string;
};

type Transaction = {
  id: string;
  listingId: string;
  productName: string;
  quantity: string;
  unit: string;
  price: string;
  total: string;
  buyerName: string;
  farmerName: string;
  date: string;
  status: string;
};

type Hub = {
  id: string;
  name: string;
  location: string;
};

type Request = {
  id: string;
  type: "incoming" | "outgoing";
  hubId: string;
  hubName: string;
  productId: string;
  productName: string;
  quantity: string;
  unit: string;
  dateCreated: string;
  status: "pending" | "accepted" | "denied";
  message?: string;
};

// Define additional contract-related types
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
  price: number;
  totalAmount: number;
  buyer: string;
  farmer: string;
};

type ContractRequest = {
  requestIndex: number;
  fromHub: string;
  fromHubName: string;
  productId: number;
  productName: string;
  quantity: number;
  status: number; // 0: pending, 1: accepted, 2: denied
};

export default function HubDashboard() {
  // State for products tab
  const [productName, setProductName] = useState("");
  const [productUnit, setProductUnit] = useState("kg");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productSuccess, setProductSuccess] = useState("");

  // State for requests tab
  const [selectedHub, setSelectedHub] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [requestQuantity, setRequestQuantity] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState("");

  // Contract related state
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isHubRegistered, setIsHubRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hubName, setHubName] = useState("");
  const [hubLocation, setHubLocation] = useState("");
  const [contractProducts, setContractProducts] = useState<ContractProduct[]>([]);
  const [contractTransactions, setContractTransactions] = useState<ContractTransaction[]>([]);
  const [contractRequests, setContractRequests] = useState<ContractRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hubStats, setHubStats] = useState({
    activeListings: 0,
    totalTransactions: 0,
    transactionVolume: 0,
    pendingRequests: 0
  });
  const [otherContractHubs, setOtherContractHubs] = useState<Hub[]>([]);
  const [allProducts, setAllProducts] = useState<{id: string, name: string}[]>([]);
  const [isAddingProductToHub, setIsAddingProductToHub] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);

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

      // Check if the current address is registered as a hub
      const hubInfo = await contract.getHubInfo(walletAddress).catch(() => null);
      const isRegistered = hubInfo !== null;
      setIsHubRegistered(isRegistered);

      if (isRegistered) {
        // Set hub name and location
        setHubName(hubInfo[0]);
        setHubLocation(hubInfo[1]);

        // Load hub products
        const products = await contract.getHubProducts(walletAddress);
        const formattedProducts = products.map((product: any) => ({
          productId: product.productId.toString(),
          name: product.name,
          totalQuantity: product.totalQuantity.toString(),
          weightedPrice: ethers.formatEther(product.weightedPrice),
          active: product.active
        }));
        setContractProducts(formattedProducts);

        // Load hub transactions
        const transactions = await contract.getHubTransactionsStructured(walletAddress);
        const formattedTransactions = transactions.map((tx: any) => ({
          timestamp: tx.timestamp,
          productId: tx.productId,
          productName: tx.productName,
          quantity: tx.quantity,
          price: parseFloat(ethers.formatEther(tx.price)),
          totalAmount: parseFloat(ethers.formatEther(tx.totalAmount)),
          buyer: tx.buyer,
          farmer: tx.farmer
        }));
        setContractTransactions(formattedTransactions);

        // Load hub statistics
        const stats = await contract.getHubStatistics(walletAddress);
        setHubStats({
          activeListings: stats[0],
          totalTransactions: stats[1],
          transactionVolume: parseFloat(ethers.formatEther(stats[2])),
          pendingRequests: stats[3]
        });

        // Load pending requests
        await loadPendingRequests();
      }

      // Load all hubs (except current one)
      const hubAddresses = await contract.getAllHubs();
      const hubsData = await Promise.all(
        hubAddresses.map(async (address: string) => {
          if (address.toLowerCase() === walletAddress.toLowerCase()) return null;
          const hubInfo = await contract.getHubInfo(address);
          return {
            id: address,
            name: hubInfo[0],
            location: hubInfo[1]
          };
        })
      );
      setOtherContractHubs(hubsData.filter(Boolean) as Hub[]);

      // Load all products
      const [productIds, productNames] = await contract.getAllProducts();
      const productsData = productIds.map((id: any, index: number) => ({
        id: id.toString(),
        name: productNames[index]
      }));
      setAllProducts(productsData);

    } catch (error) {
      console.error("Error loading contract data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    if (!contract) return;
    
    try {
      const hubAddresses = await contract.getAllHubs();
      const allRequests: ContractRequest[] = [];
      
      // For each hub, check if there are pending requests to our hub
      for (const fromHub of hubAddresses) {
        if (fromHub.toLowerCase() === walletAddress.toLowerCase()) continue;
        
        // For each product, check requests
        for (const product of allProducts) {
          const [requestIndices, quantities, statuses] = await contract.getAllProductRequests(
            fromHub, 
            walletAddress, 
            product.id
          );
          
          if (requestIndices.length > 0) {
            const hubInfo = await contract.getHubInfo(fromHub);
            
            for (let i = 0; i < requestIndices.length; i++) {
              allRequests.push({
                requestIndex: requestIndices[i].toNumber(),
                fromHub: fromHub,
                fromHubName: hubInfo[0],
                productId: parseInt(product.id),
                productName: product.name,
                quantity: quantities[i].toNumber(),
                status: statuses[i]
              });
            }
          }
        }
      }
      
      setContractRequests(allRequests);
    } catch (error) {
      console.error("Error loading pending requests:", error);
    }
  };

  const registerAsHub = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contract || !hubName || !hubLocation) {
      alert("Please fill in both name and location");
      return;
    }
    
    setIsRegistering(true);
    try {
      const tx = await contract.registerAsHub(hubName, hubLocation);
      await tx.wait();
      setIsHubRegistered(true);
      
      // Reload data after registration
      await loadContractData();
    } catch (error) {
      console.error("Error registering as hub:", error);
      alert("Failed to register as hub. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contract || !productName) {
      alert("Please enter a product name");
      return;
    }
    
    setIsCreatingProduct(true);
    
    try {
      const tx = await contract.createProduct(productName);
      await tx.wait();
      
      setProductSuccess(`Successfully created product: ${productName}`);
      setProductName("");
      
      // Reload products
      await loadContractData();
      
      setTimeout(() => {
        setProductSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product. Please try again.");
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const addProductToHub = async (productId: string) => {
    if (!contract) return;
    
    setIsAddingProductToHub(true);
    
    try {
      const tx = await contract.addProductToHub(productId);
      await tx.wait();
      
      setProductSuccess(`Successfully added product to hub`);
      
      // Reload products
      await loadContractData();
      
      setTimeout(() => {
        setProductSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error adding product to hub:", error);
      alert("Failed to add product to hub. Please try again.");
    } finally {
      setIsAddingProductToHub(false);
    }
  };

  const toggleProductStatus = async (productId: string) => {
    if (!contract) return;
    
    try {
      // Find current status
      const product = contractProducts.find(p => p.productId === productId);
      if (!product) return;
      
      const tx = await contract.toggleProductStatus(productId, !product.active);
      await tx.wait();
      
      // Reload products
      await loadContractData();
    } catch (error) {
      console.error("Error toggling product status:", error);
      alert("Failed to update product status. Please try again.");
    }
  };

  const handleRequestAction = async (requestId: string, fromHub: string, productId: number, requestIndex: number, action: "accept" | "deny") => {
    if (!contract) return;
    
    setIsProcessingRequest(true);
    
    try {
      let tx;
      if (action === "accept") {
        tx = await contract.fulfillProductRequest(fromHub, productId, requestIndex);
      } else {
        tx = await contract.denyProductRequest(fromHub, productId, requestIndex);
      }
      
      await tx.wait();
      
      // Reload data
      await loadContractData();
      await loadPendingRequests();
    } catch (error) {
      console.error(`Error ${action === "accept" ? "accepting" : "denying"} request:`, error);
      alert(`Failed to ${action} request. Please try again.`);
    } finally {
      setIsProcessingRequest(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contract || !selectedHub || !selectedProduct || !requestQuantity) {
      alert("Please fill all required fields");
      return;
    }
    
    setIsSubmittingRequest(true);
    
    try {
      const tx = await contract.requestProductFromHub(
        selectedHub,
        selectedProduct,
        requestQuantity
      );
      
      await tx.wait();
      
      setRequestSuccess(`Request sent to ${otherContractHubs.find(h => h.id === selectedHub)?.name}`);
      
      // Reset form
      setSelectedHub("");
      setSelectedProduct("");
      setRequestQuantity("");
      setRequestMessage("");
      
      // Reload data
      await loadContractData();
      
      setTimeout(() => {
        setRequestSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to send request. Please try again.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Add a disconnect function
  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress("");
    setContract(null);
    setIsHubRegistered(false);
    setContractProducts([]);
    setContractTransactions([]);
    setContractRequests([]);
    // Reset other state as needed
  };

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

  // If hub is not registered, show registration form
  if (!isHubRegistered) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <Image 
              src="/logo.svg" 
              alt="AgriHub Logo" 
              width={48} 
              height={48}
              className="text-green-700"
            />
            <span className="text-2xl font-bold text-green-700 ml-2">AgriHub</span>
          </div>
          <h1 className="text-xl font-semibold text-center mb-6">Register as Hub</h1>
          <p className="text-gray-600 mb-6 text-center">
            Register your address as a hub to start managing agricultural products.
          </p>
          
          <form onSubmit={registerAsHub} className="space-y-4">
            <div>
              <label htmlFor="hubName" className="block text-sm font-medium text-gray-700 mb-1">
                Hub Name
              </label>
              <input
                type="text"
                id="hubName"
                value={hubName}
                onChange={(e) => setHubName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="hubLocation" className="block text-sm font-medium text-gray-700 mb-1">
                Hub Location
              </label>
              <input
                type="text"
                id="hubLocation"
                value={hubLocation}
                onChange={(e) => setHubLocation(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isRegistering}
              className="w-full bg-green-700 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors disabled:bg-gray-400"
            >
              {isRegistering ? "Registering..." : "Register Hub"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalListings = contractProducts.length;
  const totalTransactions = contractTransactions.length;
  const totalVolume = contractTransactions.reduce((sum, transaction) => {
    return sum + transaction.totalAmount;
  }, 0).toFixed(2);
  const pendingRequests = contractRequests.filter(r => r.status === 0).length;

  // Handle adding a new product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingProduct(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsAddingProduct(false);
      setProductSuccess(`Successfully added ${productName} (${productUnit})`);
      setProductName("");
      setProductUnit("kg");
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setProductSuccess("");
      }, 3000);
    }, 1000);
  };


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
            <span className="text-gray-600">Hub Dashboard</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Hub Dashboard</h1>
          <p className="text-gray-600">Manage your hub's products, listings, and inter-hub requests</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Active Listings</p>
                <h3 className="font-bold text-2xl text-gray-900">{hubStats.activeListings}</h3>
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
                <h3 className="font-bold text-2xl text-gray-900">{hubStats.totalTransactions}</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Transaction Volume</p>
                <h3 className="font-bold text-2xl text-gray-900">{hubStats.transactionVolume.toFixed(2)} ETH</h3>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Pending Requests</p>
                <h3 className="font-bold text-2xl text-gray-900">{hubStats.pendingRequests}</h3>
              </div>
            </div>
          </div>
        </div>

        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-green-100 p-1 mb-8">
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected 
                ? 'bg-white text-green-700 shadow' 
                : 'text-green-600 hover:bg-white/[0.12] hover:text-green-700'
              }`
            }>
              Products
            </Tab>
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected 
                ? 'bg-white text-green-700 shadow' 
                : 'text-green-600 hover:bg-white/[0.12] hover:text-green-700'
              }`
            }>
              Listings
            </Tab>
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected 
                ? 'bg-white text-green-700 shadow' 
                : 'text-green-600 hover:bg-white/[0.12] hover:text-green-700'
              }`
            }>
              Transactions
            </Tab>
            <Tab className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected 
                ? 'bg-white text-green-700 shadow' 
                : 'text-green-600 hover:bg-white/[0.12] hover:text-green-700'
              }`
            }>
              Requests
            </Tab>
          </Tab.List>
          
          <Tab.Panels>
            {/* Products Tab */}
            <Tab.Panel>
              <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Product</h2>
                
                {productSuccess && (
                  <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                    {productSuccess}
                  </div>
                )}
                
                <form onSubmit={createProduct} className="space-y-4">
                  <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      id="productName"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={isCreatingProduct}
                      className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors disabled:bg-gray-400"
                    >
                      {isCreatingProduct ? "Creating..." : "Create Product"}
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Available Products</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allProducts
                        .filter(product => !contractProducts.some(p => p.productId.toString() === product.id.toString()))
                        .map((product) => (
                          <tr key={`product-${product.id}-${product.name}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {product.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button 
                                onClick={() => addProductToHub(product.id)}
                                disabled={isAddingProductToHub}
                                className="px-3 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                              >
                                Add to Hub
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                
                {allProducts.filter(product => !contractProducts.some(p => p.productId.toString() === product.id.toString())).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No additional products available to add to your hub.
                  </div>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Hub Products</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price (ETH)
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contractProducts.map((product, index) => (
                        <tr key={`listing-${product.productId}-${index}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.totalQuantity} {productUnit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.weightedPrice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {product.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => toggleProductStatus(product.productId)}
                                className={`px-3 py-1 rounded-md ${
                                  product.active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
                              >
                                {product.active ? 'Disable' : 'Enable'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tab.Panel>
            
            {/* Listings Tab */}
            <Tab.Panel>
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Current Listings</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Farmer
                        </th>
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
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contractProducts.map((product, index) => (
                        <tr key={`listing-${product.productId}-${index}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contractTransactions.find(t => t.productId === parseInt(product.productId))?.timestamp}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {contractProducts.find(p => parseInt(p.productId) === parseInt(product.productId))?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contractProducts.find(p => parseInt(p.productId) === parseInt(product.productId))?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contractProducts.find(p => parseInt(p.productId) === parseInt(product.productId))?.totalQuantity} {productUnit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contractProducts.find(p => parseInt(p.productId) === parseInt(product.productId))?.weightedPrice} ETH
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tab.Panel>
            
            {/* Transactions Tab */}
            <Tab.Panel>
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Hub Transactions</h2>
                
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
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Buyer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Farmer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contractTransactions.map((transaction, index) => (
                        <tr key={`transaction-${transaction.timestamp}-${index}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.timestamp}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {contractProducts.find(p => parseInt(p.productId) === transaction.productId)?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.price} ETH
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.totalAmount} ETH
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.buyer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contractProducts.find(p => parseInt(p.productId) === transaction.productId)?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Completed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tab.Panel>
            
            {/* Requests Tab */}
            <Tab.Panel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Outgoing Requests Form */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Request Products from Other Hubs</h2>
                  
                  {requestSuccess && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                      {requestSuccess}
                    </div>
                  )}
                  
                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="hubSelect" className="block text-sm font-medium text-gray-700 mb-1">
                        Select Hub
                      </label>
                      <select
                        id="hubSelect"
                        value={selectedHub}
                        onChange={(e) => setSelectedHub(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="">Select a hub</option>
                        {otherContractHubs.map((hub) => (
                          <option key={hub.id} value={hub.id}>
                            {hub.name} ({hub.location})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="productSelect" className="block text-sm font-medium text-gray-700 mb-1">
                        Select Product
                      </label>
                      <select
                        id="productSelect"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="">Select a product</option>
                        {allProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        value={requestQuantity}
                        onChange={(e) => setRequestQuantity(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        min="1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Message (Optional)
                      </label>
                      <textarea
                        id="message"
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        disabled={isSubmittingRequest}
                        className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors disabled:bg-gray-400"
                      >
                        {isSubmittingRequest ? "Submitting..." : "Send Request"}
                      </button>
                    </div>
                  </form>
                </div>
                
                {/* Incoming Requests */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Incoming Requests</h2>
                  
                  <div className="overflow-y-auto max-h-96">
                    {contractRequests.filter(req => req.status === 0).length > 0 ? (
                      contractRequests
                        .filter(req => req.status === 0)
                        .map((request, index) => (
                          <div key={`request-${request.fromHub}-${request.productId}-${request.requestIndex}-${index}`} className="mb-4 p-4 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium text-gray-900">{request.fromHubName}</h3>
                                <p className="text-sm text-gray-500">Product: {request.productName}</p>
                              </div>
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">
                              Quantity: {request.quantity}
                            </p>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleRequestAction(
                                  `${request.fromHub}-${request.productId}-${request.requestIndex}`,
                                  request.fromHub,
                                  request.productId,
                                  request.requestIndex,
                                  "accept"
                                )}
                                disabled={isProcessingRequest}
                                className="px-3 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRequestAction(
                                  `${request.fromHub}-${request.productId}-${request.requestIndex}`,
                                  request.fromHub,
                                  request.productId,
                                  request.requestIndex,
                                  "deny"
                                )}
                                disabled={isProcessingRequest}
                                className="px-3 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                              >
                                Deny
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No pending requests from other hubs.
                      </div>
                    )}
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
              All transactions are recorded on-chain and your hub receives commission on all sales.
            </p>
          </div>
          
          {/* Add disconnect button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={disconnectWallet}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 