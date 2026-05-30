'use client';

import Link from 'next/link';
import { useAuthStore } from '../store/authStore';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto flex flex-col justify-between">
      
      {/* Header Panel */}
      <header className="bg-white/80 backdrop-blur-md border border-slate-200/50 p-6 flex items-center justify-between rounded-3xl mb-8 relative shadow-sm">
        <div>
          <span className="font-display font-black text-2xl tracking-tighter bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
            Trao
          </span>
        </div>
        <nav className="flex items-center gap-6">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                Welcome, {user?.name}
              </span>
              <Link
                href="/dashboard"
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-sans font-bold tracking-wider uppercase rounded-full shadow-md shadow-blue-500/25 transition cursor-pointer"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <>
              <Link 
                href="/auth/login" 
                className="text-xs font-bold tracking-wider uppercase text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-sans font-bold tracking-wider uppercase rounded-full shadow-md shadow-blue-500/25 transition cursor-pointer"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section Split Layout */}
      <main className="flex-1 flex flex-col">
        <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl mb-10 flex flex-col md:flex-row items-center gap-0 min-h-[500px] relative animate-fade-in-up">
          
          <div className="flex-1 p-8 md:p-16 text-left">
            {/* Green Accent Line */}
            <div className="w-8 h-1 bg-green-500 mb-6 rounded-full" />
            
            <span className="text-[10px] font-sans font-extrabold tracking-widest text-blue-500 uppercase block mb-3">
              YOUR PERSONAL AI TRAVEL AGENT
            </span>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tight leading-none text-slate-800 mb-6">
              Plan Your Next <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent font-serif italic pr-2">Adventure</span> Perfected.
            </h1>

            <p className="text-slate-500 font-sans text-sm tracking-wide mb-10 leading-relaxed max-w-lg">
              Generate a detailed day-by-day travel itinerary, cost breakdown, and hotel suggestions tailored to your budget and interests in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-start gap-4">
              {isAuthenticated ? (
                <Link
                  href="/trip/new"
                  className="px-8 py-3.5 bg-blue-500 hover:bg-blue-600 text-white transition font-sans text-xs font-bold tracking-wider uppercase rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Start Planning Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/register"
                    className="px-8 py-3.5 bg-blue-500 hover:bg-blue-600 text-white transition font-sans text-xs font-bold tracking-wider uppercase rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="px-8 py-3.5 border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition font-sans text-xs font-bold tracking-wider uppercase rounded-full flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="w-full md:w-1/2 self-stretch relative min-h-[300px] md:min-h-0">
            <img 
              src="/images/hero_adventure.png" 
              alt="Traveler overlooking tropical islands from a mountain cliff at golden hour" 
              className="absolute inset-0 w-full h-full object-cover" 
            />
          </div>
        </div>

        {/* Vibrant Gradient App / Mid Section */}
        <div className="bg-gradient-to-r from-purple-800 via-fuchsia-600 to-amber-300 py-16 px-10 text-white rounded-[2.5rem] mb-10 text-center relative overflow-hidden shadow-2xl animate-fade-in-up">
          <div className="absolute top-0 left-0 w-full h-full bg-black/10 mix-blend-overlay" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="w-10 h-1 bg-white/40 mb-4 mx-auto rounded-full" />
            <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight mb-4">
              Explore the World, Simplified.
            </h2>
            <p className="text-sm text-white/80 leading-relaxed">
              Our AI travel assistant builds customized catalog itineraries covering local dining, transport logistics, packing checks, and weather alerts so you can focus on the experience.
            </p>
          </div>
        </div>

        {/* Feature Grid Panel - SaaS Card Hover Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-md hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px]">
            <div>
              <span className="text-[10px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-3">
                01 / SCHEDULING
              </span>
              <h3 className="text-lg font-display font-extrabold text-slate-800 mb-2">Tailored Itineraries</h3>
              
              {/* Accent Line */}
              <div className="w-6 h-1 bg-green-500 mb-4 rounded-full" />

              <p className="text-xs text-slate-500 font-sans tracking-wide leading-relaxed">
                Get personalized, day-by-day itineraries based on your unique interests, whether you're a foodie, adventurer, or art enthusiast.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-md hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px]">
            <div>
              <span className="text-[10px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-3">
                02 / ESTIMATIONS
              </span>
              <h3 className="text-lg font-display font-extrabold text-slate-800 mb-2">Budget Allocation</h3>

              {/* Accent Line */}
              <div className="w-6 h-1 bg-green-500 mb-4 rounded-full" />

              <p className="text-xs text-slate-500 font-sans tracking-wide leading-relaxed">
                Estimate flights, accommodation, food, and activities based on your selected budget style (Low, Medium, High).
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-md hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px]">
            <div>
              <span className="text-[10px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-3">
                03 / ADJUSTMENTS
              </span>
              <h3 className="text-lg font-display font-extrabold text-slate-800 mb-2">Interactive Adjustments</h3>

              {/* Accent Line */}
              <div className="w-6 h-1 bg-green-500 mb-4 rounded-full" />

              <p className="text-xs text-slate-500 font-sans tracking-wide leading-relaxed">
                Remove activities, add custom events, or use our AI agent to regenerate specific days instantly with simple text commands.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Panel */}
      <footer className="bg-white border border-slate-200/50 p-8 text-center text-[10px] font-sans font-bold tracking-widest uppercase text-slate-400 rounded-3xl mt-10 shadow-sm">
        <div className="flex justify-center gap-6 mb-3">
          <span>Data Isolation</span>
          <span>•</span>
          <span>JWT Security</span>
        </div>
        <div>
          © {new Date().getFullYear()} Trao Travel Catalogue. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
