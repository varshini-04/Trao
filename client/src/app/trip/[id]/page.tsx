'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { useTravelStore, IActivity } from '../../../store/travelStore';
import { Trash2, Loader, CheckSquare, Square } from 'lucide-react';

const DEST_IMAGES = [
  '/images/mountain_view.png',
  '/images/lake_view.png',
  '/images/beach_sunset.png',
  '/images/cityscape.png',
  '/images/desert_dunes.png',
];

const formatCost = (cost: number, symbol?: string) => {
  const formatted = new Intl.NumberFormat('en-US').format(cost || 0);
  return `${symbol || '$'}${formatted}`;
};

export default function TripDetails() {
  const { isAuthenticated, user, logout, updateProfile } = useAuthStore();
  const { 
    activeTrip, fetchTripById, updateItinerary, togglePackingItem, 
    regenerateDay, isActionLoading, isLoading, error, clearError 
  } = useTravelStore();

  const router = useRouter();
  const params = useParams();
  const tripId = params?.id as string;

  const [selectedDayTab, setSelectedDayTab] = useState<number>(1);
  const [regenPrompt, setRegenPrompt] = useState<string>('');
  const [showRegenModal, setShowRegenModal] = useState<boolean>(false);

  // Avatar and Settings Modal states
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pinValidationError, setPinValidationError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Custom Activity Inputs
  const [showAddActivityForm, setShowAddActivityForm] = useState<boolean>(false);
  const [newActTitle, setNewActTitle] = useState('');
  const [newActDesc, setNewActDesc] = useState('');
  const [newActTime, setNewActTime] = useState<'Morning' | 'Afternoon' | 'Evening'>('Morning');
  const [newActLocation, setNewActLocation] = useState('');
  const [newActCost, setNewActCost] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else if (tripId) {
      fetchTripById(tripId).catch(() => {
        router.push('/dashboard');
      });
    }
    clearError();
  }, [isAuthenticated, router, tripId, fetchTripById, clearError]);

  if (isLoading || !activeTrip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 gap-4 bg-slate-50">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs font-sans font-bold tracking-wider uppercase">Tailoring your travel catalogue...</p>
      </div>
    );
  }

  // Calculate packing completion
  const packingTotal = activeTrip.packingList?.length || 0;
  const packingChecked = activeTrip.packingList?.filter(i => i.checked).length || 0;
  const packingPercent = packingTotal > 0 ? Math.round((packingChecked / packingTotal) * 100) : 0;

  // Add custom activity to selected day
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActTitle.trim()) return;

    const newActivity: IActivity = {
      activityId: `custom-${Date.now()}`,
      time: newActTime,
      title: newActTitle,
      description: newActDesc,
      location: newActLocation || undefined,
      costEstimate: newActCost || undefined
    };

    const updatedItinerary = activeTrip.itinerary.map(day => {
      if (day.dayNumber === selectedDayTab) {
        return {
          ...day,
          activities: [...day.activities, newActivity]
        };
      }
      return day;
    });

    try {
      await updateItinerary(activeTrip._id, updatedItinerary);
      // Reset form
      setNewActTitle('');
      setNewActDesc('');
      setNewActTime('Morning');
      setNewActLocation('');
      setNewActCost('');
      setShowAddActivityForm(false);
    } catch (err) {
      alert('Failed to add activity');
    }
  };

  // Remove activity from selected day
  const handleRemoveActivity = async (activityId: string) => {
    const updatedItinerary = activeTrip.itinerary.map(day => {
      if (day.dayNumber === selectedDayTab) {
        return {
          ...day,
          activities: day.activities.filter(act => act.activityId !== activityId)
        };
      }
      return day;
    });

    try {
      await updateItinerary(activeTrip._id, updatedItinerary);
    } catch (err) {
      alert('Failed to remove activity');
    }
  };

  // Regenerate Day AI Handler
  const handleRegenerateDay = async () => {
    if (!regenPrompt.trim()) return;
    try {
      await regenerateDay(activeTrip._id, selectedDayTab, regenPrompt);
      setRegenPrompt('');
      setShowRegenModal(false);
    } catch (err) {
      // Handled in store
    }
  };

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

  const selectedDayData = activeTrip.itinerary.find(d => d.dayNumber === selectedDayTab);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between animate-in fade-in duration-300 pb-8 relative">
      
      {/* Background colorful gradient banner (acts only as background decoration) */}
      <div className="absolute top-0 left-0 right-0 h-[320px] bg-gradient-to-r from-purple-800 via-fuchsia-600 to-amber-300 z-0 rounded-b-[2.5rem] shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
      </div>

      {/* Header Panel - z-20 so it sits above the main content cards */}
      <header className="w-full pt-10 pb-16 px-4 md:px-8 relative z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 text-white">
          <div className="flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className="px-5 py-2 border border-white/20 bg-white/10 text-white hover:bg-white/20 text-[10px] font-sans font-bold tracking-wider uppercase rounded-full transition backdrop-blur-md"
            >
              ← Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-serif font-black italic tracking-tight">{activeTrip.destination}</h1>
              <p className="text-[10px] font-sans font-bold tracking-wider uppercase text-white/80 mt-1">
                {activeTrip.numDays} Days / {activeTrip.budgetType} Budget
              </p>
            </div>
          </div>

          {/* Profile Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-10 h-10 rounded-full border-2 border-white/40 bg-white/10 text-white flex items-center justify-center font-sans text-xs font-bold shadow-md hover:bg-white/25 transition duration-150 cursor-pointer"
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 border border-slate-100 bg-white p-2 rounded-2xl z-50 shadow-xl text-slate-800">
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
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-[10px] font-sans font-bold tracking-wider uppercase text-red-600 hover:bg-red-50 hover:text-red-950 transition duration-150 rounded-xl text-left"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Error display banner */}
      {error && (
        <div className="max-w-6xl w-full mx-auto px-4 md:px-8 mb-6 relative z-30">
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

      {/* Main Grid Layout - Overlapping the Header Background, z-10 */}
      <main className="max-w-6xl w-full mx-auto px-4 md:px-8 -mt-6 relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Side: Summary, Weather, Budget, Hotels (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Cover Illustration Card */}
          <div className="border border-slate-100 p-3 bg-white rounded-3xl shadow-md mb-8 overflow-hidden hover:scale-[1.02] transition-transform duration-300">
            <img 
              src={DEST_IMAGES[activeTrip._id.charCodeAt(0) % DEST_IMAGES.length] || DEST_IMAGES[0]} 
              alt="Beautiful Vacation Destination Header" 
              className="w-full h-48 object-cover rounded-2xl" 
            />
          </div>

          {/* Weather Assistant */}
          {activeTrip.weatherGuide && (
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-md">
              <span className="text-[9px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-3">
                WEATHER CONDITIONS
              </span>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-display font-black text-slate-800">{activeTrip.weatherGuide.averageTempCelsius}°C</span>
                <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-slate-400">Mean Temp</span>
              </div>
              <p className="text-xs text-slate-500 font-sans tracking-wide leading-relaxed mb-3">
                {activeTrip.weatherGuide.summary}
              </p>
              <div className="text-[9px] font-sans font-bold tracking-wider uppercase text-slate-600">
                Rain Probability: {activeTrip.weatherGuide.precipitationChance}%
              </div>
            </div>
          )}

          {/* Budget Breakdown */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-md">
            <span className="text-[9px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-5">
              ESTIMATED PORTFOLIO BUDGET
            </span>
            <div className="space-y-3 font-sans text-xs tracking-wide">
              {[
                { label: 'Transport / Flights', cost: activeTrip.estimatedBudget?.flights },
                { label: 'Lodging / Accommodation', cost: activeTrip.estimatedBudget?.accommodation },
                { label: 'Dining / Food', cost: activeTrip.estimatedBudget?.food },
                { label: 'Ventures / Activities', cost: activeTrip.estimatedBudget?.activities }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-2 text-slate-500">
                  <span>{item.label}</span>
                  <span className="font-bold text-slate-800">
                    {formatCost(item.cost || 0, activeTrip.estimatedBudget?.currencySymbol)}
                  </span>
                </div>
              ))}
              <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                  <span>Sum Total Est.</span>
                  <span className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-1.5 shadow-lg shadow-blue-500/25 transition text-xs font-bold uppercase tracking-wider">
                    {formatCost(activeTrip.estimatedBudget?.totalCost || 0, activeTrip.estimatedBudget?.currencySymbol)}
                  </span>
                </div>
                {activeTrip.estimatedBudget?.currencyCode && (
                  <div className="text-[9px] text-right font-sans font-semibold tracking-wider text-slate-400 uppercase">
                    All prices shown in Local Currency [{activeTrip.estimatedBudget.currencyCode}]
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommended Hotels */}
          {activeTrip.hotels && activeTrip.hotels.length > 0 && (
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-md">
              <span className="text-[9px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-5">
                LODGING SUGGESTIONS
              </span>
              <div className="space-y-5">
                {activeTrip.hotels.map((hotel, idx) => (
                  <div key={idx} className="pb-3.5 border-b border-slate-100 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-sans font-bold text-sm text-slate-800">{hotel.name}</span>
                      <span className="text-[9px] uppercase font-sans font-bold tracking-wider text-blue-500 bg-blue-50 border border-blue-100/50 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        {hotel.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-sans tracking-wide mt-2 leading-relaxed">{hotel.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Middle/Main Side: Day-by-Day schedule (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-md">
            
            {/* Days Navbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
              <div>
                {/* Green Accent Line */}
                <div className="w-8 h-1 bg-green-500 mb-3 rounded-full" />
                <span className="text-[9px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-1">
                  DAILY CATALOGUE
                </span>
                <h2 className="text-xl font-display font-black text-slate-800">
                  Itinerary Schedule
                </h2>
              </div>
              {/* Refine Day Button */}
              <button
                onClick={() => setShowRegenModal(true)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 text-[9px] font-sans font-bold tracking-wider uppercase rounded-full cursor-pointer shadow-sm transition"
              >
                Refine Day {selectedDayTab}
              </button>
            </div>

            {/* Day selector tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-100">
              {activeTrip.itinerary.map(day => (
                <button
                  key={day.dayNumber}
                  onClick={() => {
                    setSelectedDayTab(day.dayNumber);
                    setShowAddActivityForm(false);
                  }}
                  className={`px-4 py-2 border text-[9px] font-sans font-bold tracking-wider uppercase transition whitespace-nowrap flex-shrink-0 rounded-full cursor-pointer ${
                    selectedDayTab === day.dayNumber
                      ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/25'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-500'
                  }`}
                >
                  Day {day.dayNumber}
                </button>
              ))}
            </div>

            {/* Selected Day Activities */}
            <div className="relative pl-6 border-l-2 border-blue-100 space-y-8 py-2 ml-3">
              {selectedDayData && selectedDayData.activities.length === 0 ? (
                <div className="text-left text-slate-400 font-sans text-xs py-4">
                  No activities listed for this day. Click &quot;Add Custom Activity&quot; to populate.
                </div>
              ) : (
                selectedDayData?.activities.map((act) => (
                  <div key={act.activityId} className="relative bg-white border border-slate-100 p-6 rounded-2xl shadow-md hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
                    {/* Timeline bullet dot */}
                    <div className="absolute -left-[31px] top-7 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center shadow-md">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[9px] font-sans font-bold tracking-wider uppercase text-blue-500 block mb-1">
                          {act.time}
                        </span>
                        <h4 className="font-display font-black text-base text-slate-800 leading-snug">{act.title}</h4>
                      </div>
                      <button
                        onClick={() => handleRemoveActivity(act.activityId)}
                        className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-100 rounded-full transition opacity-0 group-hover:opacity-100 z-20"
                        title="Remove activity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <p className="text-xs text-slate-500 font-sans mt-2 leading-relaxed">
                      {act.description}
                    </p>
                    
                    {(act.location || act.costEstimate) && (
                      <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 text-[9px] font-sans font-bold tracking-wider uppercase text-slate-400">
                        {act.location && <span>Loc: {act.location}</span>}
                        {act.costEstimate && <span>Est: {act.costEstimate}</span>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Custom Activity Form */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              {!showAddActivityForm ? (
                <button
                  onClick={() => setShowAddActivityForm(true)}
                  className="w-full py-3.5 border border-dashed border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-500 text-xs font-sans font-bold tracking-wider uppercase transition rounded-full text-center bg-white cursor-pointer hover:bg-slate-50"
                >
                  + Add Custom Activity
                </button>
              ) : (
                <form onSubmit={handleAddActivity} className="space-y-5 p-6 border border-slate-100 bg-slate-50 rounded-[2rem]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1 pl-1">
                        Time of Day
                      </label>
                      <select
                        value={newActTime}
                        onChange={(e) => setNewActTime(e.target.value as any)}
                        className="w-full border border-slate-200 px-4 py-2 bg-white text-xs text-slate-700 focus:outline-none rounded-xl font-bold uppercase tracking-wider"
                      >
                        <option value="Morning">Morning</option>
                        <option value="Afternoon">Afternoon</option>
                        <option value="Evening">Evening</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1 pl-1">
                        Title
                      </label>
                      <input
                        type="text"
                        required
                        value={newActTitle}
                        onChange={(e) => setNewActTitle(e.target.value)}
                        className="w-full border border-slate-200 px-4 py-2 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none rounded-xl shadow-sm focus:border-blue-500"
                        placeholder="Visit Exhibition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1 pl-1">
                      Description
                    </label>
                    <textarea
                      value={newActDesc}
                      onChange={(e) => setNewActDesc(e.target.value)}
                      rows={2}
                      className="w-full border border-slate-200 p-3 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none rounded-xl shadow-sm focus:border-blue-500"
                      placeholder="Walk through local sights..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1 pl-1">
                        Location (Optional)
                      </label>
                      <input
                        type="text"
                        value={newActLocation}
                        onChange={(e) => setNewActLocation(e.target.value)}
                        className="w-full border border-slate-200 px-4 py-2 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none rounded-xl shadow-sm focus:border-blue-500"
                        placeholder="Downtown Sight"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1 pl-1">
                        Cost (Optional)
                      </label>
                      <input
                        type="text"
                        value={newActCost}
                        onChange={(e) => setNewActCost(e.target.value)}
                        className="w-full border border-slate-200 px-4 py-2 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none rounded-xl shadow-sm focus:border-blue-500"
                        placeholder="$15 / Free"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddActivityForm(false)}
                      className="px-5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-[10px] font-sans tracking-wider uppercase font-bold transition rounded-full bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-sans tracking-wider uppercase font-bold transition rounded-full shadow-md shadow-blue-500/25"
                    >
                      Add Activity
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Smart Packing checklist (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-md">
            <span className="text-[9px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-4">
              PACKING CHECKLIST
            </span>

            {/* Progress bar */}
            <div className="mb-6 border border-slate-100 p-4 bg-slate-50 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center text-[10px] font-sans font-bold tracking-wider uppercase mb-2">
                <span>Readiness</span>
                <span className="text-blue-500 font-extrabold">{packingPercent}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300" 
                  style={{ width: `${packingPercent}%` }}
                />
              </div>
            </div>

            {/* Checklist items categorized */}
            <div className="space-y-5 max-h-[450px] overflow-y-auto pr-1">
              {['Documents', 'Clothing', 'Toiletries', 'Electronics', 'Miscellaneous'].map((category) => {
                const itemsInCategory = activeTrip.packingList?.filter(i => i.category === category) || [];
                if (itemsInCategory.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <span className="text-[9px] font-sans font-bold tracking-wider text-slate-400 uppercase block mb-1">
                      {category}
                    </span>
                    <div className="space-y-1">
                      {itemsInCategory.map((item) => (
                        <button
                          key={item.itemId}
                          onClick={() => togglePackingItem(activeTrip._id, item.itemId)}
                          className="w-full flex items-start gap-3 text-left py-1 hover:bg-slate-50 transition rounded-xl text-xs text-slate-600 font-sans group cursor-pointer"
                        >
                          <span className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5">
                            {item.checked ? (
                              <CheckSquare className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </span>
                          <span className={`leading-normal ${item.checked ? 'line-through text-slate-400' : ''}`}>
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </main>

      {/* Footer Panel */}
      <footer className="w-full max-w-6xl mx-auto px-4 md:px-8 mt-10">
        <div className="bg-white border border-slate-200/50 p-8 text-center text-[10px] font-sans font-bold tracking-widest uppercase text-slate-400 rounded-3xl shadow-sm">
          <div className="flex justify-center gap-6 mb-3">
            <span>Data Isolation</span>
            <span>•</span>
            <span>JWT Security</span>
          </div>
          <div>
            © {new Date().getFullYear()} Trao Travel Catalogue. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Day AI Regeneration Modal */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20 animate-fade-in-up relative text-slate-800">
            <div className="mb-6">
              <div className="w-8 h-1 bg-green-500 mb-4 rounded-full" />
              <span className="text-[9px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-1">
                AI COGNITION ASSIST
              </span>
              <h3 className="text-2xl font-display font-black text-slate-800">
                Refine Day {selectedDayTab}
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-1">
                Tell the AI agent how to change Day {selectedDayTab}&apos;s schedule (e.g. &quot;make it more relaxing and focused on food&quot;).
              </p>
            </div>

            <textarea
              required
              rows={3}
              value={regenPrompt}
              onChange={(e) => setRegenPrompt(e.target.value)}
              className="w-full border border-slate-200 p-4 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="e.g. Include a visit to a park in the afternoon and outdoor cafes"
            />

            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => {
                  setRegenPrompt('');
                  setShowRegenModal(false);
                }}
                disabled={isActionLoading}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-100 text-[10px] font-sans tracking-wider uppercase font-bold transition rounded-full disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerateDay}
                disabled={isActionLoading || !regenPrompt.trim()}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-sans tracking-wider uppercase font-bold transition rounded-full disabled:opacity-50 flex items-center gap-1 cursor-pointer shadow-lg shadow-blue-500/40"
              >
                {isActionLoading ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" /> Regenerating...
                  </>
                ) : (
                  <>
                    Apply Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings PIN Modal Overlay */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20 animate-fade-in-up relative text-slate-800">
            <div className="mb-8">
              <div className="w-8 h-1 bg-green-500 mb-4 rounded-full" />
              <span className="text-[9px] font-sans font-bold tracking-wider text-blue-500 uppercase block mb-1">
                SECURITY SETTINGS
              </span>
              <h3 className="text-2xl font-display font-black text-slate-800">
                Update Password (PIN)
              </h3>
              <p className="text-xs text-slate-500 font-sans tracking-wide mt-1">
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
                <label className="block text-[10px] font-bold text-black uppercase tracking-wider mb-2 pl-2">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={currentPassword}
                  onChange={(e) => handlePinChange(e, setCurrentPassword)}
                  className="w-full border border-slate-200 px-5 py-3 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-sm font-sans tracking-widest bg-white"
                  placeholder="••••"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-black uppercase tracking-wider mb-2 pl-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={newPassword}
                  onChange={(e) => handlePinChange(e, setNewPassword)}
                  className="w-full border border-slate-200 px-5 py-3 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-sm font-sans tracking-widest bg-white"
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
                  className="px-5 py-2.5 border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-[10px] font-sans tracking-wider uppercase font-bold rounded-full transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || currentPassword.length !== 4 || newPassword.length !== 4}
                  className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white disabled:bg-slate-200 disabled:text-slate-400 transition text-[10px] font-sans tracking-wider uppercase font-bold rounded-full cursor-pointer shadow-lg shadow-blue-500/40"
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
