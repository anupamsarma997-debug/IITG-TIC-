import React, { useState, useMemo } from 'react';
import { Property, RoomType, PropertyType } from '../types';
import { store } from '../services/store';
import { PropertyCard } from '../components/PropertyCard';
import { BannerSlider } from '../components/BannerSlider';
import { 
  Search, 
  MapPin, 
  Filter, 
  Sparkles, 
  BadgeCheck, 
  SlidersHorizontal, 
  Building2, 
  Star, 
  X,
  Compass,
  Zap
} from 'lucide-react';

interface CustomerHomeViewProps {
  onSelectProperty: (property: Property) => void;
  onOpenWhatsApp: (property: Property, room?: RoomType) => void;
  onSelectCity: (city: string) => void;
  selectedCity: string;
}

export const CustomerHomeView: React.FC<CustomerHomeViewProps> = ({
  onSelectProperty,
  onOpenWhatsApp,
  onSelectCity,
  selectedCity,
}) => {
  const [properties, setProperties] = useState<Property[]>(store.getProperties());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [onlyFeatured, setOnlyFeatured] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  React.useEffect(() => {
    return store.subscribe(() => {
      setProperties(store.getProperties());
    });
  }, []);

  const CITIES = [
    'All Locations', 
    'Guwahati', 
    'Kaziranga', 
    'Shillong', 
    'Cherrapunji', 
    'Gangtok', 
    'Tawang', 
    'Kohima', 
    'Majuli Island', 
    'Dawki', 
    'Ziro Valley', 
    'Aizawl', 
    'Imphal', 
    'Agartala'
  ];

  const NORTHEAST_STATES = [
    'All States',
    'Assam',
    'Meghalaya',
    'Sikkim',
    'Arunachal Pradesh',
    'Nagaland',
    'Mizoram',
    'Manipur',
    'Tripura'
  ];

  const [selectedState, setSelectedState] = useState<string>('All States');
  const PROPERTY_TYPES: string[] = ['All', 'Homestay', 'Hotel', 'Resort', 'Villa', 'Cottage'];

  // Filter properties logic
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // Must be active
      if (p.status !== 'active') return false;

      // State filter
      if (selectedState && selectedState !== 'All States' && p.state.toLowerCase() !== selectedState.toLowerCase()) {
        return false;
      }

      // City filter
      if (selectedCity && selectedCity !== 'All Locations' && p.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // Search Query (Location, Title, Description, Address)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchCity = p.city.toLowerCase().includes(q);
        const matchAddress = p.address.toLowerCase().includes(q);
        const matchType = p.propertyType.toLowerCase().includes(q);
        if (!matchTitle && !matchCity && !matchAddress && !matchType) return false;
      }

      // Property Type Filter
      if (selectedType !== 'All' && p.propertyType !== selectedType) {
        return false;
      }

      // Rating Filter
      if (p.rating < minRating) return false;

      // Verified Filter
      if (onlyVerified && !p.isVerified) return false;

      // Featured Filter
      if (onlyFeatured && !p.isFeatured) return false;

      return true;
    }).sort((a, b) => {
      // Featured ⭐ properties appear first as requested
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.rating - a.rating;
    });
  }, [properties, selectedState, selectedCity, searchQuery, selectedType, minRating, onlyVerified, onlyFeatured]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Hero Search Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-700/60">
        
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
            <Zap className="w-3.5 h-3.5 fill-emerald-400" />
            Northeast India's Direct Homestay & Eco Stay Portal
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">Northeast THIKANA</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Book directly on WhatsApp with local hosts across Assam, Meghalaya, Sikkim, Nagaland, Arunachal, Mizoram, Manipur & Tripura. Zero middleman fees!
          </p>

          {/* State Filter Pills Bar */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2">
            {NORTHEAST_STATES.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedState(st)}
                className={`text-[11px] px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  selectedState === st
                    ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md scale-105'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 border border-slate-700/80'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box Input Bar */}
          <div className="pt-2">
            <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 w-full">
                <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search Kaziranga, Shillong, Tawang, Cherrapunji, Gangtok, Kohima..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm font-medium bg-transparent outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Button Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all w-full sm:w-auto justify-center cursor-pointer ${
                  showFilters
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Quick Location Chips */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Popular:</span>
            {CITIES.slice(1, 8).map((city) => (
              <button
                key={city}
                onClick={() => onSelectCity(city === selectedCity ? 'All Locations' : city)}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  selectedCity === city
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Expanded Filter Bar */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Search Filters</span>
            </h4>

            <button
              onClick={() => {
                setSelectedType('All');
                setMinRating(0);
                setOnlyVerified(false);
                setOnlyFeatured(false);
                onSelectCity('All Locations');
              }}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            
            {/* Property Type Filter */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Property Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Rating */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Minimum Rating
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={0}>Any Rating</option>
                <option value={4.0}>4.0+ ⭐</option>
                <option value={4.5}>4.5+ ⭐ (Highly Rated)</option>
                <option value={4.8}>4.8+ ⭐ (Top Rated)</option>
              </select>
            </div>

            {/* Verified Badge Only */}
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1">
                  <BadgeCheck className="w-4 h-4 text-blue-600 fill-white" />
                  Blue Verified Only
                </span>
              </label>
            </div>

            {/* Featured Only */}
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyFeatured}
                  onChange={(e) => setOnlyFeatured(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  ⭐ Featured Boost Only
                </span>
              </label>
            </div>

          </div>
        </div>
      )}

      {/* Property Type Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {PROPERTY_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              selectedType === type
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {type === 'All' ? '🏡 All Stays' : type}
          </button>
        ))}
      </div>

      {/* Top Banner Advertisement */}
      <BannerSlider position="home" />

      {/* Results Count & Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Available Homestays & Hotels
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {filteredProperties.length} properties {selectedCity !== 'All Locations' ? `in ${selectedCity}` : 'across India'}
          </p>
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onSelect={onSelectProperty}
              onOpenWhatsApp={onOpenWhatsApp}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto font-black text-2xl">
            THIKANA
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            No Properties Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try adjusting your search criteria or reset city filters to see properties across all tourist locations.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('All');
              onSelectCity('All Locations');
              setOnlyVerified(false);
              setOnlyFeatured(false);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Search Page Bottom Banner */}
      <BannerSlider position="search" />

    </div>
  );
};
