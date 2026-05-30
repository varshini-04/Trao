'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { useTravelStore } from '../../store/travelStore';
import { Trash2, Loader } from 'lucide-react';

const DEST_IMAGES = [
  '/images/mountain_view.png',
  '/images/lake_view.png',
  '/images/beach_sunset.png',
  '/images/cityscape.png',
  '/images/desert_dunes.png',
];

export default function Dashboard() {
  const { user, logout, updateProfile, isAuthenticated } = useAuthStore();
  const { trips, fetchTrips, deleteTrip, isLoading, error, clearError } = useTravelStore();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Settings PIN states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pinValidationError, setPinValidationError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else {
      fetchTrips();
    }
  }, [isAuthenticated, router, fetchTrips]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handlePinChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const val = e.target.value;
    if (/^[0-9]*$/.test(val)) {
      setter(val);
      setPinValidationError('');
    } else {
      setPinValidationError('Only numbers are allowed');
      setTimeout(() => setPinValidationError(''), 2000);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPassword.length !== 4 || newPassword.length !== 4) {
      setPinValidationError('Both fields must be exactly 4 digits');
      return;
    }

    setIsUpdating(true);
    setUpdateSuccess(false);
    setUpdateError('');
    try {
      await updateProfile(undefined, undefined, newPassword, currentPassword);
      setUpdateSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => {
        setShowSettingsModal(false);
        setUpdateSuccess(false);
      }, 1500);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update PIN');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTrip = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Are you sure you want to delete this travel itinerary from your catalogue?')) {
      try {
        await deleteTrip(id);
      } catch (err) {
        alert('Failed to delete trip');
      }
    }
  };

  const getCardImage = (idx: number) => DEST_IMAGES[idx % DEST_IMAGES.length];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto flex flex-col justify-between">
      {/* Header navbar */}
      <header className="bg-white/80 backdrop-blur-md border border-slate-200/50 p-6 flex items-center justify-between rounded-3xl mb-8 relative z-20 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display font-black text-2xl tracking-tighter bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
            Trao
          </span>
        </Link>
        
        {/* Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-sans text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition duration-150 cursor-pointer"
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 border border-slate-100 bg-white p-2 rounded-2xl z-50 shadow-xl">
              <div className="px-3.5 py-2 border-b border-zinc-200 mb-1">
                <p className="text-xs font-bold text-slate-800 tracking-wide truncate font-sans">{user?.name}</p>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-sans">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  setShowSettingsModal(true);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-[10px] font-sans font-bold tracking-wider uppercase text-zinc-700 hover:bg-slate-50 hover:text-black transition duration-150 rounded-xl text-left"
              >
                Settings
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-[10px] font-sans font-bold tracking-wider uppercase text-red-600 hover:bg-red-50 hover:text-red-700 transition duration-150 rounded-xl text-left"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Error display banner */}
      {error && (
        <div className="mb-6 z-20">
          <div className="p-4 border border-red-100 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl font-sans flex justify-between items-center shadow-sm">
            <span>{error}</span>
            <button 
              onClick={() => clearError()} 
              className="text-red-500 hover:text-red-700 font-bold px-2 py-1 uppercase text-[10px] tracking-wider cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col mb-8">
        {/* Header + CTA Panel */}
        <div className="bg-white border border-slate-100 p-8 rounded-3xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md relative">
          <div>
            <div className="w-8 h-1 bg-green-500 mb-4 rounded-full" />
            <span className="text-[9px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-1">
              COLLECTION DASHBOARD
            </span>
            <h1 className="text-3xl font-display font-black text-slate-800 tracking-tight">Your Dashboard</h1>
            <p className="text-xs text-slate-500 font-sans mt-1">Manage and access your saved travel itineraries.</p>
          </div>
          <Link
            href="/trip/new"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-sans font-bold tracking-wider uppercase rounded-full shadow-md shadow-blue-500/20 hover:scale-105 transition duration-200 inline-block text-center cursor-pointer"
          >
            Plan a New Trip
          </Link>
        </div>

        {/* Itinerary List */}
        {isLoading ? (
          <div className="bg-white border border-slate-100 p-16 rounded-3xl flex flex-col items-center justify-center text-slate-500 gap-4 flex-1 shadow-md">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-[10px] font-sans font-bold tracking-wider uppercase text-slate-400">Retrieving travel itineraries...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white border border-slate-100 text-center py-16 px-8 rounded-3xl flex flex-col items-center max-w-md mx-auto shadow-md w-full">
            <div className="w-40 h-40 mb-6">
              <img 
                src="/images/empty_state_travel.png" 
                alt="Travel planning essentials illustration" 
                className="w-full h-full object-contain" 
              />
            </div>
            <h2 className="text-2xl font-display font-black text-slate-800 mb-2">No itineraries found</h2>
            <p className="text-xs text-slate-500 font-sans mb-6 max-w-xs leading-relaxed">
              You haven&apos;t generated any travel itineraries yet. Start planning your dream getaway now!
            </p>
            <Link
              href="/trip/new"
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-sans font-bold tracking-wider uppercase rounded-full shadow-md shadow-blue-500/20 hover:scale-105 transition duration-200 cursor-pointer"
            >
              Create First Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map((trip, idx) => (
              <Link href={`/trip/${trip._id}`} key={trip._id}>
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:-translate-y-2 hover:shadow-xl transition-all duration-300 relative group h-full flex flex-col justify-between">
                  
                  {/* Card Destination Header Image */}
                  <div className="h-44 w-full relative overflow-hidden">
                    <img 
                      src={getCardImage(idx)} 
                      alt={trip.destination} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteTrip(e, trip._id)}
                      className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-full text-slate-400 hover:text-red-500 shadow-md hover:scale-110 transition z-20"
                      title="Delete trip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <h3 className="absolute bottom-4 left-6 text-xl font-serif font-black italic text-white tracking-tight truncate max-w-[85%]">
                      {trip.destination}
                    </h3>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-4 text-[10px] font-sans font-bold tracking-wider uppercase text-slate-500">
                        <span>{trip.numDays} Days</span>
                        <span>/</span>
                        <span>{trip.budgetType} Budget</span>
                      </div>

                      {trip.interests && trip.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-6">
                          {trip.interests.slice(0, 3).map((interest, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] uppercase font-sans font-bold tracking-wider text-blue-500 bg-blue-50 border border-blue-100/50 px-2.5 py-0.5 rounded-full"
                            >
                              {interest}
                            </span>
                          ))}
                          {trip.interests.length > 3 && (
                            <span className="text-[9px] text-slate-400 font-sans tracking-wider uppercase self-center ml-1">
                              +{trip.interests.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-[10px] font-sans tracking-wider uppercase font-bold text-slate-500 group-hover:text-blue-500 transition-colors">
                      <span>
                        Total Est: {trip.estimatedBudget?.currencySymbol || '$'}
                        {new Intl.NumberFormat('en-US').format(trip.estimatedBudget?.totalCost || 0)}
                        {trip.estimatedBudget?.currencyCode && ` [${trip.estimatedBudget.currencyCode}]`}
                      </span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Settings PIN Modal Overlay */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20 animate-fade-in-up relative">
            <div className="mb-6">
              <div className="w-8 h-1 bg-green-500 mb-4 rounded-full" />
              <span className="text-[9px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-1">
                SECURITY CONFIGURATION
              </span>
              <h3 className="text-2xl font-sans font-black text-slate-800">
                Update Password (PIN)
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-1">
                Enter your current PIN and choose a new 4-digit numeric PIN code.
              </p>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              {updateError && (
                <div className="p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded-xl font-sans">
                  <span>{updateError}</span>
                </div>
              )}
              {updateSuccess && (
                <div className="p-3 border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs rounded-xl font-sans">
                  <span>PIN updated successfully!</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 pl-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={currentPassword}
                  onChange={(e) => handlePinChange(e, setCurrentPassword)}
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-sm text-slate-800 bg-white placeholder-slate-400 tracking-widest"
                  placeholder="••••"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 pl-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={newPassword}
                  onChange={(e) => handlePinChange(e, setNewPassword)}
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-sm text-slate-800 bg-white placeholder-slate-400 tracking-widest"
                  placeholder="••••"
                />
              </div>

              {pinValidationError && (
                <div className="text-[10px] text-red-600 font-bold uppercase tracking-wider pl-2">
                  <span>{pinValidationError}</span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setPinValidationError('');
                    setUpdateSuccess(false);
                    setUpdateError('');
                    setShowSettingsModal(false);
                  }}
                  className="px-5 py-2.5 border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 text-[10px] font-sans tracking-wider uppercase font-bold rounded-full transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || currentPassword.length !== 4 || newPassword.length !== 4}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition text-[10px] font-sans tracking-wider uppercase font-bold rounded-full cursor-pointer shadow-md shadow-blue-500/25"
                >
                  {isUpdating ? 'Updating...' : 'Update PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
