"use client";

import AgriHubV3ABI from "@/app/AgriHubV3.abi.json";
import ERC20ABI from "@/app/ERC20.abi.json";
import { ethers } from "ethers";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Marketplace() {
  // Wallet and contract state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // Data from blockchain
  const [contractHubs, setContractHubs] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  
  // Contract addresses - in a real app, these would come from environment variables
  const CONTRACT_ADDRESS = "0xEF44C6f3b11cEacA73D1C7e7bF2C26e1D311212B";
  const TOKEN_ADDRESS = "0x755c8e2A6f1a8F2Eff76d02dC5E60512E404c20D"; // Replace with your token address
  
  // Add state for token symbol and formatted balance
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [tokenBalance, setTokenBalance] = useState<string>("");
  
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
    if (contract) {
      loadContractData();
    }
  }, [contract]);
  
  // Add a new useEffect to fetch token balance when tokenContract is available
  useEffect(() => {
    if (tokenContract && walletConnected) {
      fetchTokenBalance();
    }
  }, [tokenContract, walletConnected]);
  
  const checkIfWalletIsConnected = async () => {
    try {
      if ((window as any).ethereum) {
        // Only check accounts without requesting connection
        const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          setWalletConnected(true);
          setWalletAddress(accounts[0]);
        } else {
          // Even if wallet is not connected, we can still load data in read-only mode
          initializeContractReadOnly();
        }
      } else {
        // If MetaMask is not installed, use read-only mode
        initializeContractReadOnly();
      }
    } catch (error) {
      console.error("Error checking if wallet is connected:", error);
      // Fallback to read-only mode
      initializeContractReadOnly();
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
      
      // Initialize the main contract
      const agriHubContract = new ethers.Contract(CONTRACT_ADDRESS, AgriHubV3ABI, signer);
      setContract(agriHubContract);
      
      // Get the payment token address from the contract
      const paymentTokenAddress = await agriHubContract.paymentToken();
      
      // Initialize the token contract
      const erc20Contract = new ethers.Contract(paymentTokenAddress, ERC20ABI, signer);
      setTokenContract(erc20Contract);
    } catch (error) {
      console.error("Error initializing contract:", error);
      // Fallback to read-only mode
      initializeContractReadOnly();
    }
  };
  
  const initializeContractReadOnly = async () => {
    try {
      // Use a public provider for read-only access
      const provider = new ethers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/your-api-key");
      
      // Initialize the main contract
      const agriHubContract = new ethers.Contract(CONTRACT_ADDRESS, AgriHubV3ABI, provider);
      setContract(agriHubContract);
      
      // Get the payment token address from the contract
      const paymentTokenAddress = await agriHubContract.paymentToken();
      
      // Initialize the token contract
      const erc20Contract = new ethers.Contract(paymentTokenAddress, ERC20ABI, provider);
      setTokenContract(erc20Contract);
    } catch (error) {
      console.error("Error initializing contract in read-only mode:", error);
    }
  };
  
  const loadContractData = async () => {
    setIsLoading(true);
    try {
      if (!contract) return;
      
      // Load all hubs
      const hubAddresses = await contract.getAllHubs();
      
      // Get details for each hub
      const hubsData = await Promise.all(
        hubAddresses.map(async (address: string) => {
          try {
            const hubInfo = await contract.getHubInfo(address);
            
            // Get products for this hub
            const hubProducts = await contract.getHubProducts(address);
            
            // Count active products
            const activeProducts = hubProducts.filter((product: any) => 
              product.active && product.totalQuantity.toString() > "0"
            ).length;
            
            // Calculate average rating (this would typically come from a separate system)
            // For now, we'll generate a random rating between 4.5 and 5.0
            const rating = (4.5 + Math.random() * 0.5).toFixed(1);
            
            return {
              id: address,
              name: hubInfo[0], // name is at index 0
              location: hubInfo[1], // location is at index 1
              rating: parseFloat(rating),
              products: activeProducts,
              // Use a placeholder image for now
              image: `/hubs/hub-${(hubAddresses.indexOf(address) % 6) + 1}.jpg`
            };
          } catch (error) {
            console.error(`Error loading hub ${address}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any null values from failed hub loads
      const validHubs = hubsData.filter(hub => hub !== null);
      setContractHubs(validHubs);
      
      // Load featured products (we'll take a few products from different hubs)
      const allProductsData: any[] = [];
      
      // Get products from each hub
      for (const hubAddress of hubAddresses.slice(0, 3)) { // Limit to first 3 hubs for performance
        try {
          const hubInfo = await contract.getHubInfo(hubAddress);
          const hubProducts = await contract.getHubProducts(hubAddress);
          
          // Add active products with quantity > 0
          const activeProducts = hubProducts
            .filter((product: any) => product.active && product.totalQuantity.toString() > "0")
            .map((product: any) => ({
              id: product.productId.toString(),
              name: product.name,
              price: parseFloat(ethers.formatEther(product.weightedPrice)),
              unit: "unit", // This would ideally come from the contract
              hub: hubInfo[0], // Hub name
              hubAddress: hubAddress,
              quantity: parseInt(product.totalQuantity.toString()),
              // Use a placeholder image based on product ID
              image: `/products/product-${(parseInt(product.productId.toString()) % 8) + 1}.jpg`
            }));
          
          allProductsData.push(...activeProducts);
        } catch (error) {
          console.error(`Error loading products for hub ${hubAddress}:`, error);
        }
      }
      
      // Set all products
      setAllProducts(allProductsData);
      
      // Select featured products (first 4 or fewer)
      setFeaturedProducts(allProductsData.slice(0, 4));
      
    } catch (error) {
      console.error("Error loading contract data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a function to fetch token balance
  const fetchTokenBalance = async () => {
    try {
      if (!tokenContract || !walletAddress) return;
      
      const balance = await tokenContract.balanceOf(walletAddress);
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      
      // Format the balance with the correct number of decimals
      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      setTokenSymbol(symbol);
      setTokenBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };
  
  const purchaseProduct = async (hubAddress: string, productId: string, quantity: number, price: number) => {
    if (!contract || !tokenContract || !walletConnected) {
      alert("Please connect your wallet to make a purchase");
      return;
    }
    
    setIsPurchasing(true);
    try {
      // Calculate total price in wei
      const totalPrice = ethers.parseEther((price * quantity).toString());
      
      // First check token balance
      const balance = await tokenContract.balanceOf(walletAddress);
      if (balance < totalPrice) {
        alert("Insufficient token balance. Please add more tokens to your wallet.");
        return;
      }
      
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(walletAddress, CONTRACT_ADDRESS);
      
      // If allowance is insufficient, request approval
      if (currentAllowance < totalPrice) {
        console.log("Requesting token approval...");
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, totalPrice);
        console.log("Approval transaction sent:", approveTx.hash);
        
        // Wait for approval transaction to be mined
        const approveReceipt = await approveTx.wait();
        console.log("Approval confirmed in block:", approveReceipt.blockNumber);
      }
      
      // Now purchase the product
      console.log("Purchasing product...");
      const tx = await contract.purchaseProduct(hubAddress, productId, quantity);
      console.log("Purchase transaction sent:", tx.hash);
      
      // Wait for purchase transaction to be mined
      const receipt = await tx.wait();
      console.log("Purchase confirmed in block:", receipt.blockNumber);
      
      alert("Purchase successful!");
      
      // Reload data to reflect changes
      loadContractData();
      fetchTokenBalance(); // Update token balance after purchase
    } catch (error) {
      console.error("Error purchasing product:", error);
      alert("Failed to purchase product. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  // Add a function to disconnect wallet
  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress("");
    setTokenBalance("");
    setTokenSymbol("");
    
    // If we have a contract instance, reset it
    if (contract) {
      // Initialize read-only mode after disconnecting
      initializeContractReadOnly();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50 font-[family-name:var(--font-geist-sans)]">
      {/* Header with navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <Image 
                  src="/logo.svg" 
                  alt="AgriHub Logo" 
                  width={32} 
                  height={32} 
                />
                <span className="text-xl font-bold text-green-700">AgriHub</span>
              </Link>
              <nav className="ml-10 hidden md:flex space-x-8">
                <Link href="/" className="text-gray-600 hover:text-green-700">Home</Link>
                <Link href="/marketplace" className="text-green-700 font-medium">Marketplace</Link>
                <Link href="/dashboard" className="text-gray-600 hover:text-green-700">Dashboard</Link>
                <Link href="/about" className="text-gray-600 hover:text-green-700">About</Link>
              </nav>
            </div>
            
            {walletConnected ? (
              <div className="flex items-center gap-4">
                {/* Display token balance in navbar */}
                {tokenBalance && tokenSymbol && (
                  <div className="hidden md:block px-3 py-1 bg-green-50 rounded-full text-sm text-green-700">
                    <span className="font-medium">{parseFloat(tokenBalance).toFixed(2)} {tokenSymbol}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                  <span className="text-sm text-gray-600">
                    {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                  </span>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                </div>
                
                {/* Add disconnect button */}
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
            ) : (
              <button 
                className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-full transition-colors"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </header>
      
      {!walletConnected ? (
        // Show only connect wallet screen when not connected
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="text-center max-w-md">
            <Image 
              src="/logo.svg" 
              alt="AgriHub Logo" 
              width={80} 
              height={80} 
              className="mx-auto mb-6"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to AgriHub Marketplace</h1>
            <p className="text-gray-600 mb-8">
              Connect your wallet to access the decentralized marketplace for agricultural products.
              Buy directly from farmers and agricultural hubs with full transparency.
            </p>
            <button 
              className="bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-full transition-colors text-lg font-medium"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                "Connect Wallet"
              )}
            </button>
            <p className="text-sm text-gray-500 mt-4">
              You need a Web3 wallet like MetaMask to use this application.
            </p>
          </div>
        </div>
      ) : (
        // Show marketplace content when connected
        <>
          {/* Hero section */}
          <section className="relative">
            <div className="h-80 bg-gradient-to-r from-green-700 to-green-500 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
                <h1 className="text-4xl font-bold mb-4">Agricultural Marketplace</h1>
                <p className="text-xl max-w-2xl">
                  Buy fresh produce directly from farmers and agricultural hubs with blockchain-verified authenticity.
                </p>
              </div>
            </div>
            <div className="absolute bottom-0 w-full h-16 bg-white" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}></div>
          </section>

          {/* Featured products section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Products</h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
                </div>
              ) : featuredProducts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No featured products available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="relative h-48">
                        <Image 
                          src={product.image} 
                          alt={product.name} 
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">From {product.hub}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 font-bold">{tokenSymbol} {product.price.toFixed(2)}/{product.unit}</span>
                          <button 
                            className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                            onClick={() => purchaseProduct(product.hubAddress, product.id, 1, product.price)}
                            disabled={isPurchasing}
                          >
                            {isPurchasing ? "Processing..." : "Buy Now"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-8 text-center">
                <Link href="#all-products" className="border-2 border-green-700 text-green-700 hover:bg-green-50 px-6 py-2 rounded-full transition-colors font-medium">
                  View All Products
                </Link>
              </div>
            </div>
          </section>

          {/* All products section */}
          <section id="all-products" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">All Products</h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
                </div>
              ) : allProducts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-600">No products available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                      <div className="relative h-40">
                        <Image 
                          src={product.image} 
                          alt={product.name} 
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4 flex-grow">
                        <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">From {product.hub}</p>
                        <p className="text-sm text-gray-600 mb-4">Available: {product.quantity} {product.unit}</p>
                        <div className="flex justify-between items-center mt-auto">
                          <span className="text-green-700 font-bold">{tokenSymbol} {product.price.toFixed(2)}/{product.unit}</span>
                          <button 
                            className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                            onClick={() => purchaseProduct(product.hubAddress, product.id, 1, product.price)}
                            disabled={isPurchasing}
                          >
                            {isPurchasing ? "Processing..." : "Buy Now"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Hubs section */}
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Agricultural Hubs</h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
                </div>
              ) : contractHubs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No hubs available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {contractHubs.map((hub) => (
                    <div key={hub.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="relative h-40">
                        <Image 
                          src={hub.image} 
                          alt={hub.name} 
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900">{hub.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{hub.location}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="text-yellow-500 mr-1">★</span>
                            <span className="text-sm text-gray-700">{hub.rating}</span>
                          </div>
                          <span className="text-sm text-gray-600">{hub.products} Products</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
} 