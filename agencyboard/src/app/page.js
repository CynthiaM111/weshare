'use client';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Add intersection observer for fade-in animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
        }
      });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('.fade-in-section').forEach(section => {
      observer.observe(section);
    });

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap');
        
        :root {
          --font-syncopate: 'Syncopate', sans-serif;
          --font-inter: 'Inter', sans-serif;
        }
        
        * {
          font-family: var(--font-inter);
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .fade-in-section {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out;
        }
        
        .fade-in-section.fade-in {
          opacity: 1;
          transform: translateY(0);
        }
        
        .floating {
          animation: float 6s ease-in-out infinite;
        }
        
        .pulse-animation {
          animation: pulse 3s ease-in-out infinite;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #007BFF 0%, #00C6FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .gradient-bg {
          background: linear-gradient(135deg, #007BFF 0%, #00C6FF 100%);
        }
        
        .light-gradient-bg {
          background: linear-gradient(135deg, rgba(0, 123, 255, 0.1) 0%, rgba(0, 198, 255, 0.1) 100%);
        }
        
        .card-shadow {
          box-shadow: 0 4px 20px rgba(0, 123, 255, 0.1);
        }
        
        .soft-shadow {
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }
        
        .login-button {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
        }
        
        .login-button:hover {
          background: linear-gradient(135deg, #007BFF 0%, #00C6FF 100%);
          border-color: #007BFF;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3);
        }
      `}</style>

      <div className="min-h-screen bg-white text-gray-800 overflow-x-hidden">
        {/* Fixed Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              {/* Logo */}
              <Link href="/" className="flex items-center">
                <h1 className="text-2xl font-bold tracking-wide gradient-text" style={{ fontFamily: 'var(--font-syncopate)' }}>
                  WeShare
                </h1>
              </Link>

              {/* Navigation Buttons */}
              <div className="flex items-center space-x-4">
                <Link href="/login" className="px-6 py-3 login-button text-gray-700 rounded-xl font-semibold transition-all duration-300">
                  Login
                </Link>
                <Link href="/signup" className="px-6 py-3 gradient-bg text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 soft-shadow">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 bg-gradient-to-br from-blue-50 via-white to-blue-50">
          <div className="text-center max-w-4xl mx-auto fade-in-section">
            {/* Fun Background Elements */}
            <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 floating"></div>
            <div className="absolute bottom-20 right-10 w-16 h-16 bg-blue-300 rounded-full opacity-20 floating" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-blue-100 rounded-full opacity-30 floating" style={{ animationDelay: '4s' }}></div>

            {/* Mission Statement */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              Move <span className="gradient-text">Smarter</span>, Not Harder
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed font-medium">
              Our mission is to revolutionize transportation through intelligent, connected, and user-first technology.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/demo" className="px-8 py-4 gradient-bg text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 pulse-animation">
                Start Free Trial ✨
              </Link>
              <Link href="/demo" className="px-8 py-4 border-2 border-blue-200 text-blue-600 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all duration-300">
                Watch Demo 🎥
              </Link>
            </div>

            {/* Fun Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text mb-2">500+</div>
                <div className="text-gray-600 font-medium">Happy Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text mb-2">10M+</div>
                <div className="text-gray-600 font-medium">Rides Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text mb-2">99.9%</div>
                <div className="text-gray-600 font-medium">Uptime</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 fade-in-section bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                Why Choose <span className="gradient-text">WeShare</span>?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
                Powerful features designed to transform your transportation business
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🚀',
                  title: 'Instant Dispatch',
                  description: 'AI-powered vehicle assignment in milliseconds for optimal efficiency'
                },
                {
                  icon: '📊',
                  title: 'Real-Time Analytics',
                  description: 'Comprehensive dashboard with live metrics and performance insights'
                },
                {
                  icon: '🔒',
                  title: 'Enterprise Security',
                  description: 'Military-grade encryption and compliance for your peace of mind'
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl card-shadow hover:scale-105 transition-all duration-300 group border border-blue-100">
                  <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800 tracking-tight">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed font-medium">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-6 fade-in-section light-gradient-bg">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                Transform Your <span className="gradient-text">Business</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
                Join thousands of companies already using WeShare to optimize their operations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { number: '500+', label: 'Companies Trust Us', icon: '🏢' },
                { number: '10M+', label: 'Rides Completed', icon: '🚗' },
                { number: '99.9%', label: 'Uptime Guarantee', icon: '⚡' },
                { number: '24/7', label: 'Support Available', icon: '🛟' }
              ].map((stat, index) => (
                <div key={index} className="text-center bg-white p-6 rounded-2xl soft-shadow">
                  <div className="text-4xl mb-3">{stat.icon}</div>
                  <div className="text-3xl font-bold gradient-text mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-6 fade-in-section bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                What Our <span className="gradient-text">Clients</span> Say
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  quote: "WeShare transformed our fleet management completely. The efficiency gains are incredible.",
                  author: "Sarah Johnson",
                  role: "CEO, Metro Transit",
                  avatar: "👩‍💼"
                },
                {
                  quote: "The real-time analytics help us make data-driven decisions every day.",
                  author: "Michael Chen",
                  role: "Operations Director, City Cabs",
                  avatar: "👨‍💼"
                },
                {
                  quote: "Customer satisfaction increased by 40% since implementing WeShare.",
                  author: "Emily Rodriguez",
                  role: "Manager, Express Shuttle",
                  avatar: "👩‍💼"
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl card-shadow border border-blue-100">
                  <div className="text-2xl mb-4">"</div>
                  <p className="text-gray-600 mb-6 leading-relaxed font-medium">{testimonial.quote}</p>
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold text-gray-800 tracking-tight">{testimonial.author}</div>
                      <div className="text-gray-500 text-sm font-medium">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 fade-in-section light-gradient-bg">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Ready to <span className="gradient-text">Get Started</span>?
            </h2>
            <p className="text-xl text-gray-600 mb-8 font-medium">
              Join the future of transportation management today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="px-8 py-4 gradient-bg text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                Start Free Trial 🚀
              </Link>
              <Link href="/contact" className="px-8 py-4 border-2 border-blue-200 text-blue-600 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all duration-300">
                Contact Sales 💬
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-6 fade-in-section bg-gray-50 border-t border-blue-100">
          <div className="max-w-7xl mx-auto">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {/* Company Info */}
              <div className="lg:col-span-1">
                <Link href="/" className="inline-block mb-6">
                  <h1 className="text-2xl font-bold tracking-wide gradient-text" style={{ fontFamily: 'var(--font-syncopate)' }}>
                    WeShare
                  </h1>
                </Link>
                <p className="text-gray-600 mb-6 font-medium leading-relaxed">
                  Revolutionizing transportation through intelligent, connected, and user-first technology.
                </p>
                <div className="flex space-x-4">
                  <a href="https://twitter.com" className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors duration-300">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                  <a href="https://facebook.com" className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors duration-300">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a href="https://linkedin.com" className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors duration-300">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a href="https://instagram.com" className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors duration-300">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-6 tracking-tight">Quick Links</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/features" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/demo" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium">
                      Request Demo
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium">
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-6 tracking-tight">Support</h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/help" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/api" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium">
                      API Documentation
                    </Link>
                  </li>
                  <li>
                    <Link href="/status" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium">
                      System Status
                    </Link>
                  </li>
                  <li>
                    <Link href="/feedback" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 font-medium">
                      Send Feedback
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Newsletter */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-6 tracking-tight">Stay Updated</h3>
                <p className="text-gray-600 mb-4 font-medium">
                  Get the latest updates and insights delivered to your inbox.
                </p>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button className="px-6 py-3 gradient-bg text-white rounded-r-xl font-semibold hover:shadow-lg transition-all duration-300">
                    Subscribe
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="pt-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex flex-col md:flex-row items-center gap-6 text-sm mb-4 md:mb-0">
                  <Link href="/privacy" className="text-gray-500 hover:text-blue-600 transition-colors duration-300 font-medium">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-gray-500 hover:text-blue-600 transition-colors duration-300 font-medium">
                    Terms of Service
                  </Link>
                  <Link href="/cookies" className="text-gray-500 hover:text-blue-600 transition-colors duration-300 font-medium">
                    Cookie Policy
                  </Link>
                  <Link href="/security" className="text-gray-500 hover:text-blue-600 transition-colors duration-300 font-medium">
                    Security
                  </Link>
                </div>
                <div className="text-gray-400 font-medium">
                  © {new Date().getFullYear()} WeShare. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}