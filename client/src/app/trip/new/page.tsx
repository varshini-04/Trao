'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { useTravelStore } from '../../../store/travelStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, AlertCircle, X } from 'lucide-react';

const INTERESTS_OPTIONS = [
  'Food', 'Culture', 'Adventure', 'Shopping', 'Nightlife', 
  'History', 'Nature', 'Relaxation', 'Art & Museums'
];

const POPULAR_DESTINATIONS = [
  'Tokyo, Japan', 'Paris, France', 'New York, USA',
  'Bali, Indonesia', 'London, UK', 'Rome, Italy'
];

// Contextual illustrations for each wizard step
const WIZARD_STEP_IMAGES = [
  '/images/wizard_destination.png',   // Step 1: Destination search
  '/images/wizard_duration.png',      // Step 2: Duration / journey planning
  '/images/wizard_budget.png',        // Step 3: Budget tier selection
  '/images/wizard_interests.png',     // Step 4: Interests & activities
  '/images/desert_dunes.png',         // Fallback
];

export default function NewTripWizard() {
  const { isAuthenticated } = useAuthStore();
  const { generateTrip, validateDestination, isActionLoading, error, clearError } = useTravelStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
    clearError();
  }, [isAuthenticated, router, clearError]);

  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [numDays, setNumDays] = useState(3);
  const [budgetType, setBudgetType] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('Invalid Destination');
  const [errorSubtitle, setErrorSubtitle] = useState('LOCATION VALIDATION ERROR');

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  const handleNext = async () => {
    if (step === 1) {
      if (!destination.trim()) return;
      try {
        await validateDestination(destination);
        setStep((prev) => prev + 1);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : '';
        if (errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('capacity') || errMsg.toLowerCase().includes('quota')) {
          setErrorTitle("Rate Limit Reached");
          setErrorSubtitle("API CAPACITY LIMIT");
          setToastMessage(errMsg);
        } else if (errMsg.toLowerCase().includes('invalid destination')) {
          setErrorTitle("Invalid Destination");
          setErrorSubtitle("LOCATION VALIDATION ERROR");
          setToastMessage("Oops! We couldn't find that location. Please enter a valid city or country.");
          clearError(); // Clear store error to hide the redundant inline error card
        } else {
          setErrorTitle("System Error");
          setErrorSubtitle("VALIDATION FAILURE");
          setToastMessage(errMsg || "Oops! Something went wrong. Please try again.");
        }
        setShowErrorToast(true);
      }
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    try {
      const trip = await generateTrip({
        destination,
        numDays,
        budgetType,
        interests: selectedInterests,
      });
      router.push(`/trip/${trip._id}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '';
      if (errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('capacity') || errMsg.toLowerCase().includes('quota')) {
        setErrorTitle("Rate Limit Reached");
        setErrorSubtitle("API CAPACITY LIMIT");
        setToastMessage(errMsg);
      } else if (errMsg.toLowerCase().includes('invalid destination')) {
        setErrorTitle("Invalid Destination");
        setErrorSubtitle("LOCATION VALIDATION ERROR");
        setToastMessage("Oops! We couldn't find that location. Please enter a valid city or country.");
        clearError(); // Clear store error to hide the redundant inline error card
        setStep(1); // Send user back to the start of the form
      } else {
        setErrorTitle("System Error");
        setErrorSubtitle("GENERATION FAILURE");
        setToastMessage(errMsg || "Oops! Something went wrong. Please try again.");
      }
      setShowErrorToast(true);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 30 : -30,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto flex flex-col justify-between relative overflow-hidden animate-in fade-in duration-300">
      {/* Premium Error Dialogue Modal */}
      {showErrorToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-8 border border-white/20 animate-fade-in-up relative flex flex-col items-center text-center">
            
            {/* Warning Circle Icon Ring */}
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-6 shadow-inner ring-8 ring-rose-50/50">
              <AlertCircle className="w-8 h-8" />
            </div>

            {/* Error Message Details */}
             <span className="text-[9px] font-sans font-black tracking-widest text-rose-500 uppercase block mb-1">
              {errorSubtitle}
            </span>
            <h3 className="text-xl font-display font-black text-slate-800 tracking-tight mb-2">
              {errorTitle}
            </h3>
            <p className="text-xs text-slate-500 font-sans leading-relaxed mb-6">
              {toastMessage}
            </p>

            {/* Action Button to Close */}
            <button
              onClick={() => setShowErrorToast(false)}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-sans font-bold tracking-wider uppercase rounded-full shadow-lg shadow-slate-800/20 transition-all duration-300 cursor-pointer"
            >
              Go Back & Fix
            </button>
            
            {/* Close Button X */}
            <button
              onClick={() => setShowErrorToast(false)}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition p-1.5 rounded-lg absolute top-4 right-4 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      {/* Background colorful gradient banner */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-r from-purple-800 via-fuchsia-600 to-amber-300 z-0 opacity-90 rounded-b-[3rem] shadow-lg" />
      
      {/* Header Panel */}
      <header className="bg-white/80 backdrop-blur-md border border-slate-200/50 p-6 flex items-center justify-between rounded-3xl mb-8 relative z-10 shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-display font-black text-2xl tracking-tighter bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
            Trao
          </span>
        </Link>
        <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-slate-500">
          Page {step} of 4
        </span>
      </header>

      {/* Main Form container */}
      <main className="flex-1 flex items-center justify-center p-4 max-w-4xl w-full mx-auto relative z-10">
        <div className="w-full bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-slate-100 shadow-2xl relative grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Form on left: md:col-span-7 */}
          <div className="p-8 md:p-10 md:col-span-7 relative flex flex-col justify-between min-h-[450px]">
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-slate-100">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>

            {error && (
              <div className="mb-8 p-4 border border-red-100 bg-red-50 text-red-700 text-xs font-sans rounded-2xl font-semibold">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait" custom={step}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.15 }}
                  className="space-y-8"
                >
                  <div>
                    {/* Green Accent Line */}
                    <div className="w-8 h-1 bg-green-500 mb-4 rounded-full" />
                    
                    <span className="text-[9px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-1">
                      DESTINATION SEARCH
                    </span>
                    <h2 className="text-3xl font-display font-black text-slate-800 tracking-tight mb-1">
                      Where are we going?
                    </h2>
                    <p className="text-xs text-slate-500 font-sans">Enter a city, region, or country you wish to explore.</p>
                  </div>

                  <div className="space-y-6">
                    <input
                      type="text"
                      required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-sm text-slate-800 bg-white placeholder-slate-400"
                      placeholder="e.g. Kyoto, Japan"
                      autoFocus
                    />

                    {/* Suggestion tags */}
                    <div>
                      <span className="text-[10px] font-sans font-bold tracking-wider text-slate-500 uppercase block mb-3 pl-1">
                        Popular Collections
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {POPULAR_DESTINATIONS.map((dest) => (
                          <button
                            key={dest}
                            type="button"
                            onClick={() => setDestination(dest)}
                            className="px-4 py-2 border border-slate-200 text-xs font-sans tracking-wide uppercase text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300 transition rounded-full font-bold shadow-sm cursor-pointer"
                          >
                            {dest}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleNext}
                      disabled={!destination.trim() || isActionLoading}
                      className="px-8 py-3.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white text-[10px] font-sans tracking-wider uppercase font-bold transition rounded-full shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer min-w-[140px] justify-center"
                    >
                      {isActionLoading ? (
                        <>
                          <Loader className="w-3.5 h-3.5 animate-spin" /> Validating...
                        </>
                      ) : (
                        <>
                          Next Step <span>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.15 }}
                  className="space-y-8"
                >
                  <div>
                    {/* Green Accent Line */}
                    <div className="w-8 h-1 bg-green-500 mb-4 rounded-full" />
                    
                    <span className="text-[9px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-1">
                      JOURNEY INTERVAL
                    </span>
                    <h2 className="text-3xl font-display font-black text-slate-800 tracking-tight mb-1">
                      How long is the stay?
                    </h2>
                    <p className="text-xs text-slate-500 font-sans">Select the total number of days for the trip itinerary.</p>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                      <span className="text-xs text-slate-500 font-sans font-bold tracking-wider uppercase">Duration</span>
                      <span className="text-3xl font-sans font-black text-blue-600">{numDays} Days</span>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="range"
                        min="1"
                        max="15"
                        value={numDays}
                        onChange={(e) => setNumDays(parseInt(e.target.value, 10))}
                        className="w-full accent-blue-500 h-1.5 bg-slate-200 rounded-full cursor-pointer appearance-none"
                      />
                      <div className="flex justify-between text-[10px] font-sans tracking-wider uppercase text-slate-400 px-1 font-bold">
                        <span>1 Day</span>
                        <span>7 Days</span>
                        <span>15 Days Max</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={handleBack}
                      className="px-8 py-3.5 border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-[10px] font-sans tracking-wider uppercase font-bold transition rounded-full"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-8 py-3.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-sans tracking-wider uppercase font-bold transition rounded-full shadow-lg shadow-blue-500/25 cursor-pointer"
                    >
                      Next Step →
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.15 }}
                  className="space-y-8"
                >
                  <div>
                    {/* Green Accent Line */}
                    <div className="w-8 h-1 bg-green-500 mb-4 rounded-full" />
                    
                    <span className="text-[9px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-1">
                      BUDGET TIERS
                    </span>
                    <h2 className="text-3xl font-display font-black text-slate-800 tracking-tight mb-1">
                      What is the budget preference?
                    </h2>
                    <p className="text-xs text-slate-500 font-sans">Select how you want the AI to scale spending recommendations.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { type: 'Low', label: 'Low Budget', desc: 'Backpacker, hostels, public transit, cheap eats' },
                      { type: 'Medium', label: 'Medium Budget', desc: 'Comfortable hotel stay, mid-tier restaurants, standard sightseeing' },
                      { type: 'High', label: 'High Budget', desc: 'Luxury stays, premium dining, private drivers, guided VIP tours' }
                    ].map((item) => (
                      <button
                        key={item.type}
                        onClick={() => setBudgetType(item.type as 'Low' | 'Medium' | 'High')}
                        className={`p-5 border rounded-2xl text-left flex justify-between items-start transition-all duration-200 cursor-pointer shadow-sm ${
                          budgetType === item.type
                            ? 'bg-blue-50/50 border-blue-500 text-slate-800 ring-2 ring-blue-500/10'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <h4 className="font-display font-bold text-lg text-slate-800">{item.label}</h4>
                          <p className="text-xs mt-1.5 leading-normal text-slate-500 font-sans">{item.desc}</p>
                        </div>
                        <div className={`w-4 h-4 border-2 flex items-center justify-center mt-1 rounded-full flex-shrink-0 ${
                          budgetType === item.type ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                        }`}>
                          {budgetType === item.type && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={handleBack}
                      className="px-8 py-3.5 border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-[10px] font-sans tracking-wider uppercase font-bold transition rounded-full"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-8 py-3.5 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-sans tracking-wider uppercase font-bold transition rounded-full shadow-lg shadow-blue-500/25 cursor-pointer"
                    >
                      Next Step →
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.15 }}
                  className="space-y-8"
                >
                  <div>
                    {/* Green Accent Line */}
                    <div className="w-8 h-1 bg-green-500 mb-4 rounded-full" />
                    
                    <span className="text-[9px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-1">
                      INTEREST OPTIONS
                    </span>
                    <h2 className="text-3xl font-display font-black text-slate-800 tracking-tight mb-1">
                      What are the trip interests?
                    </h2>
                    <p className="text-xs text-slate-500 font-sans">Select any fields that interest you to guide our AI planner.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-h-[220px] overflow-y-auto pr-1">
                    {INTERESTS_OPTIONS.map((interest) => {
                      const isSelected = selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          onClick={() => handleInterestToggle(interest)}
                          className={`p-3 border-2 text-center transition-all text-xs font-sans font-bold tracking-wider uppercase rounded-full cursor-pointer shadow-sm ${
                            isSelected
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-500'
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between pt-6 border-t border-zinc-200">
                    <button
                      onClick={handleBack}
                      disabled={isActionLoading}
                      className="px-8 py-3.5 border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-[10px] font-sans tracking-wider uppercase font-bold transition rounded-full disabled:opacity-50"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isActionLoading}
                      className="px-8 py-3.5 bg-blue-500 hover:bg-blue-600 text-white disabled:bg-slate-100 disabled:text-slate-400 text-[10px] font-sans tracking-wider uppercase font-bold transition rounded-full shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
                    >
                      {isActionLoading ? (
                        <>
                          <Loader className="w-3.5 h-3.5 animate-spin" /> Tailoring Catalogue...
                        </>
                      ) : (
                        <>
                          Generate Catalogue
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Illustration on right: md:col-span-5 */}
          <div className="md:col-span-5 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-100 p-8 md:p-10 flex flex-col justify-center items-center relative">
            <div className="border border-slate-100 p-2 bg-white rounded-3xl shadow-lg max-w-xs w-full">
              <img 
                src={WIZARD_STEP_IMAGES[step - 1] || WIZARD_STEP_IMAGES[0]} 
                alt={[
                  'World map with landmarks and magnifying glass',
                  'Serene alpine lake reflecting mountains',
                  'Vibrant city skyline at twilight',
                  'Tropical beach sunset with palm trees'
                ][step - 1] || 'Travel destination'} 
                className="w-full h-auto object-cover rounded-2xl" 
              />
            </div>
            <p className="text-[9px] font-sans font-bold tracking-widest uppercase text-slate-400 mt-4 text-center">
              {['DISCOVER DESTINATIONS', 'PLAN YOUR JOURNEY', 'SET YOUR BUDGET', 'CHOOSE YOUR STYLE'][step - 1]}
            </p>
          </div>
        </div>
      </main>

      {/* Footer Panel */}
      <footer className="bg-white/80 backdrop-blur-md border border-slate-200/50 p-8 text-center text-[10px] text-slate-400 font-sans tracking-wider uppercase rounded-3xl relative z-10 shadow-sm mt-8">
        AI will formulate activities, packing lists, weather insights and hotel ideas.
      </footer>
    </div>
  );
}
