import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50 font-[family-name:var(--font-geist-sans)]">
      {/* Hero Section */}
      <header className="pt-8 pb-16 px-4 sm:px-8 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-2">
              <Image 
                src="/logo.svg" 
                alt="AgriHub Logo" 
                width={40} 
                height={40}
                className="text-green-700"
              />
              <span className="text-2xl font-bold text-green-700">AgriHub</span>
            </div>
            <nav className="hidden md:flex gap-8">
              <a href="#features" className="text-green-700 hover:text-green-500 transition-colors">Features</a>
              <a href="#how-it-works" className="text-green-700 hover:text-green-500 transition-colors">How It Works</a>
              <a href="#benefits" className="text-green-700 hover:text-green-500 transition-colors">Benefits</a>
              <a href="#contact" className="text-green-700 hover:text-green-500 transition-colors">Contact</a>
            </nav>
            <button className="hidden md:block bg-green-700 hover:bg-green-600 text-white px-6 py-2 rounded-full transition-colors">
              Connect Wallet
            </button>
            <button className="md:hidden text-green-700">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-green-700 mb-6">
                Decentralized Agriculture Marketplace
              </h1>
              <p className="text-lg text-green-600 mb-8">
                Connect farmers and buyers directly through blockchain-powered hubs with fair pricing using weighted average principles.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                <a href="/dashboard/farmer" className="bg-green-700 hover:bg-green-600 text-white px-8 py-3 rounded-full transition-colors font-medium text-center">
                  Join as Farmer
                </a>
                <button className="border-2 border-green-700 text-green-700 hover:bg-green-50 px-8 py-3 rounded-full transition-colors font-medium">
                  Join as Hub
                </button>
                <button className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full transition-colors font-medium">
                  Visit Marketplace
                </button>
              </div>
            </div>
            <div className="md:w-1/2">
              <Image
                src="/MarketPlace.png"
                alt="Farmers marketplace"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-8 md:px-16 lg:px-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-green-700 text-center mb-16">
            How Our Decentralized Hubs Work
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-green-50 p-8 rounded-xl">
              <div className="bg-green-100 w-16 h-16 flex items-center justify-center rounded-full mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-green-700">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-700 mb-3">Fair Pricing</h3>
              <p className="text-green-600">
                Our weighted average pricing model ensures farmers get fair compensation while buyers pay reasonable prices.
              </p>
            </div>
            
            <div className="bg-green-50 p-8 rounded-xl">
              <div className="bg-green-100 w-16 h-16 flex items-center justify-center rounded-full mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-green-700">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-700 mb-3">Blockchain Powered</h3>
              <p className="text-green-600">
                Secure, transparent transactions with immutable records ensuring trust between all parties.
              </p>
            </div>
            
            <div className="bg-green-50 p-8 rounded-xl">
              <div className="bg-green-100 w-16 h-16 flex items-center justify-center rounded-full mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-green-700">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-700 mb-3">Community Hubs</h3>
              <p className="text-green-600">
                Local marketplace hubs connect regional farmers and buyers, reducing transportation costs and emissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4 sm:px-8 md:px-16 lg:px-24 bg-green-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-green-700 text-center mb-16">
            The AgriHub Process
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white w-20 h-20 mx-auto flex items-center justify-center rounded-full mb-6 shadow-md">
                <span className="text-2xl font-bold text-green-700">1</span>
              </div>
              <h3 className="text-xl font-bold text-green-700 mb-3">Farmers List Produce</h3>
              <p className="text-green-600">
                Farmers add their available produce with quantity and suggested price.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-white w-20 h-20 mx-auto flex items-center justify-center rounded-full mb-6 shadow-md">
                <span className="text-2xl font-bold text-green-700">2</span>
              </div>
              <h3 className="text-xl font-bold text-green-700 mb-3">Hub Aggregates</h3>
              <p className="text-green-600">
                Local hubs collect listings and calculate fair market prices.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-white w-20 h-20 mx-auto flex items-center justify-center rounded-full mb-6 shadow-md">
                <span className="text-2xl font-bold text-green-700">3</span>
              </div>
              <h3 className="text-xl font-bold text-green-700 mb-3">Buyers Purchase</h3>
              <p className="text-green-600">
                Buyers browse available produce and make purchases through smart contracts.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-white w-20 h-20 mx-auto flex items-center justify-center rounded-full mb-6 shadow-md">
                <span className="text-2xl font-bold text-green-700">4</span>
              </div>
              <h3 className="text-xl font-bold text-green-700 mb-3">Secure Delivery</h3>
              <p className="text-green-600">
                Produce is delivered and payment is released when confirmed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Inter-Hub Connectivity Section */}
      <section className="py-16 px-4 sm:px-8 md:px-16 lg:px-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-green-700 text-center mb-8">
            Inter-Hub Connectivity
          </h2>
          <p className="text-lg text-green-600 text-center mb-12 max-w-3xl mx-auto">
            Our hubs don't operate in isolation. They form a powerful network that ensures produce availability even during shortages.
          </p>
          
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="md:w-1/2">
              <Image
                src="/dashboard.png"
                alt="Connected agricultural hubs"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
              />
            </div>
            <div className="md:w-1/2">
              <h3 className="text-2xl font-bold text-green-700 mb-4">
                Seamless Resource Sharing
              </h3>
              <p className="text-green-600 mb-6">
                When demand exceeds supply in one region, hubs can instantly request items from other hubs with surplus inventory, ensuring:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-green-700">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-600">
                    <span className="font-medium text-green-700">Consistent Availability:</span> Buyers can always find what they need, even during seasonal shortages.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-green-700">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-600">
                    <span className="font-medium text-green-700">Price Stability:</span> Inter-hub trading helps balance supply and demand, preventing price spikes.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-green-700">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-600">
                    <span className="font-medium text-green-700">Reduced Waste:</span> Surplus produce in one region can be quickly redirected to areas with higher demand.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-green-100 p-1 rounded-full mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-green-700">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-600">
                    <span className="font-medium text-green-700">Smart Logistics:</span> Automated matching algorithms find the most efficient hub to fulfill requests.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-8 md:px-16 lg:px-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-green-700 text-center mb-16">
            What Our Users Say
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-green-50 p-8 rounded-xl">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 mr-4"></div>
                <div>
                  <h4 className="font-bold text-green-700">Maria Rodriguez</h4>
                  <p className="text-green-600">Organic Farmer</p>
                </div>
              </div>
              <p className="text-green-600 italic">
                "AgriHub has transformed how I sell my produce. I'm getting better prices and connecting directly with buyers who value my organic farming methods."
              </p>
            </div>
            
            <div className="bg-green-50 p-8 rounded-xl">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 mr-4"></div>
                <div>
                  <h4 className="font-bold text-green-700">James Chen</h4>
                  <p className="text-green-600">Restaurant Owner</p>
                </div>
              </div>
              <p className="text-green-600 italic">
                "As a restaurant owner, I need reliable access to quality produce. The hub system lets me source directly from local farmers with transparent pricing."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-8 md:px-16 lg:px-24 bg-green-700">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Join the Agricultural Revolution?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
            Whether you're a farmer looking for fair prices or a buyer seeking quality produce, our blockchain-powered hubs are ready for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-700 hover:bg-green-50 px-8 py-3 rounded-full transition-colors font-medium">
              Create an Account
            </button>
            <button className="border-2 border-white text-white hover:bg-green-600 px-8 py-3 rounded-full transition-colors font-medium">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-8 md:px-16 lg:px-24 bg-green-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image 
                  src="/logo-white.svg" 
                  alt="AgriHub Logo" 
                  width={32} 
                  height={32}
                />
                <span className="text-xl font-bold">AgriHub</span>
              </div>
              <p className="text-green-100">
                Revolutionizing agricultural commerce through blockchain technology.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-green-100 hover:text-white transition-colors">Home</a></li>
                <li><a href="#features" className="text-green-100 hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-green-100 hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="text-green-100 hover:text-white transition-colors">About Us</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-green-100 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-green-100 hover:text-white transition-colors">Whitepaper</a></li>
                <li><a href="#" className="text-green-100 hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="text-green-100 hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:info@AgriHub.io" className="text-green-100 hover:text-white transition-colors">info@AgriHub.io</a>
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-green-100">+1 (555) 123-4567</span>
                </li>
              </ul>
              <div className="flex gap-4 mt-4">
                <a href="#" className="text-green-100 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                  </svg>
                </a>
                <a href="#" className="text-green-100 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                  </svg>
                </a>
                <a href="#" className="text-green-100 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-green-800 text-center text-green-100">
            <p>© 2023 AgriHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
