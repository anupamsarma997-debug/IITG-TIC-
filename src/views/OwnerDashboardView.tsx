import React, { useState } from 'react';
import { Property, RoomType, User } from '../types';
import { store } from '../services/store';
import { AuthModal } from '../components/AuthModal';
import { 
  Building2, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  BadgeCheck, 
  Sparkles, 
  Clock, 
  MessageCircle, 
  Calendar, 
  DollarSign, 
  Image as ImageIcon, 
  Video, 
  MapPin, 
  BedDouble, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  Wand2, 
  ChevronRight,
  UserCheck,
  Zap,
  Loader2,
  X,
  Lock
} from 'lucide-react';

interface OwnerDashboardViewProps {
  onOpenAddPropertyModal?: () => void;
  onSelectProperty?: (property: Property) => void;
  autoOpenAddProperty?: boolean;
  onAddPropertyHandled?: () => void;
}

export const OwnerDashboardView: React.FC<OwnerDashboardViewProps> = ({
  onSelectProperty,
  autoOpenAddProperty,
  onAddPropertyHandled,
}) => {
  const currentUser = store.getCurrentUser();
  const [properties, setProperties] = useState<Property[]>(
    currentUser ? store.getPropertiesByOwner(currentUser.id) : store.getProperties()
  );
  const [enquiries, setEnquiries] = useState(store.getEnquiries());

  // Ownership Guard & Login Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRequiredOwnerId, setAuthRequiredOwnerId] = useState<string | undefined>();
  const [authTargetTitle, setAuthTargetTitle] = useState<string | undefined>();
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const verifyOwnerAndExecute = (prop: Property, action: () => void) => {
    const user = store.getCurrentUser();
    if (user && store.isOwnerOfProperty(user.id, prop.id)) {
      action();
    } else {
      setAuthRequiredOwnerId(prop.ownerId);
      setAuthTargetTitle(prop.title);
      setPendingAction(() => action);
      setAuthModalOpen(true);
    }
  };

  // Modal State for Add / Edit Property
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

  // Property Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<'Homestay' | 'Hotel' | 'Resort' | 'Villa' | 'Cottage'>('Homestay');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Manali');
  const [stateName, setStateName] = useState('Himachal Pradesh');
  const [googleMapUrl, setGoogleMapUrl] = useState('');
  const [latitude, setLatitude] = useState(32.2432);
  const [longitude, setLongitude] = useState(77.1892);
  const [nearbyAttractions, setNearbyAttractions] = useState<string>('Mall Road (1 km), Hadimba Temple (2.5 km)');
  const [checkInTime, setCheckInTime] = useState('12:00 PM');
  const [checkOutTime, setCheckOutTime] = useState('11:00 AM');
  const [photoUrlsInput, setPhotoUrlsInput] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [ownerWhatsAppInput, setOwnerWhatsAppInput] = useState<string>('919876543210');
  const [ownerPhoneInput, setOwnerPhoneInput] = useState<string>('+91 9876543210');
  const [formError, setFormError] = useState<string>('');

  // Handle local image file upload (converts images to Data URLs & appends to photoUrlsInput)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setFormError('');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedTypes.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
        setFormError(`⚠️ Security Alert: "${file.name}" is not a supported image file. Only JPG, PNG, and WebP images are permitted.`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setFormError(`⚠️ File Size Error: "${file.name}" exceeds the maximum limit of 5 MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setPhotoUrlsInput((prev) => (prev ? `${prev}\n${result}` : result));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Description Generator State
  const [generatingAI, setGeneratingAI] = useState(false);

  // Room Management State
  const [editingRoomsPropId, setEditingRoomsPropId] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('Deluxe Mountain View Room');
  const [pricePerNight, setPricePerNight] = useState(2000);
  const [discountPrice, setDiscountPrice] = useState(1700);
  const [maxGuests, setMaxGuests] = useState(3);
  const [roomDescription, setRoomDescription] = useState('Spacious pine wood room with private balcony.');
  const [roomSize, setRoomSize] = useState('280 sq.ft.');
  const [bedType, setBedType] = useState('King Size Bed');
  const [roomAmenities, setRoomAmenities] = useState('Balcony View, Free High-Speed WiFi, Hot Shower, Room Heater');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'properties' | 'subscriptions' | 'leads'>('properties');
  const [filterMode, setFilterMode] = useState<'all' | 'my'>('all');

  React.useEffect(() => {
    if (autoOpenAddProperty) {
      handleOpenAdd();
      if (onAddPropertyHandled) {
        onAddPropertyHandled();
      }
    }
  }, [autoOpenAddProperty]);

  React.useEffect(() => {
    const refreshData = () => {
      const u = store.getCurrentUser();
      const allProps = store.getProperties();
      if (filterMode === 'my' && u) {
        setProperties(store.getPropertiesByOwner(u.id));
      } else {
        setProperties(allProps);
      }
      setEnquiries(store.getEnquiries());
    };

    refreshData();
    return store.subscribe(refreshData);
  }, [filterMode]);

  // Open Form to Add New Property
  const handleOpenAdd = () => {
    setFormError('');
    setEditingPropertyId(null);
    setTitle('');
    setDescription('');
    setPropertyType('Homestay');
    setAddress('');
    setCity('Kaziranga');
    setStateName('Assam');
    setGoogleMapUrl('');
    setLatitude(26.5775);
    setLongitude(93.1711);
    setNearbyAttractions('Kohora Safari Gate (1.5 km), Orchid Park (2 km)');
    setCheckInTime('12:00 PM');
    setCheckOutTime('11:00 AM');
    setPhotoUrlsInput('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80\nhttps://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80');
    setVideoUrl('');
    setOwnerPhoneInput(currentUser?.phone || '+91 9876543210');
    setOwnerWhatsAppInput(currentUser?.whatsapp || '919876543210');

    // Pre-fill initial room setup
    setRoomName('Traditional Bamboo Stilt (Chang Ghar) Suite');
    setPricePerNight(2200);
    setDiscountPrice(1800);
    setMaxGuests(3);
    setRoomSize('300 sq.ft.');
    setBedType('King Bamboo Bed');
    setRoomDescription('Authentic bamboo homestay with tea garden views & hot shower.');
    setRoomAmenities('WiFi, Geyser, Electric Kettle, Balcony View, Breakfast Included');

    setIsFormOpen(true);
  };

  // Open Form to Edit Existing Property
  const handleOpenEdit = (prop: Property) => {
    setFormError('');
    setEditingPropertyId(prop.id);
    setTitle(prop.title);
    setDescription(prop.description);
    setPropertyType(prop.propertyType);
    setAddress(prop.address);
    setCity(prop.city);
    setStateName(prop.state);
    setGoogleMapUrl(prop.googleMapUrl || '');
    setLatitude(prop.latitude);
    setLongitude(prop.longitude);
    setNearbyAttractions((prop.nearbyAttractions || []).join(', '));
    setCheckInTime(prop.checkInTime);
    setCheckOutTime(prop.checkOutTime);
    setPhotoUrlsInput((prop.photos || []).join('\n'));
    setVideoUrl(prop.videoUrl || '');
    setOwnerPhoneInput(prop.ownerPhone || currentUser?.phone || '+91 9876543210');
    setOwnerWhatsAppInput(prop.ownerWhatsApp || currentUser?.whatsapp || '919876543210');
    setIsFormOpen(true);
  };

  // Generate AI Description
  const handleGenerateAIDescription = async () => {
    if (!title || !city) {
      alert('Please enter Property Title and City first.');
      return;
    }

    setGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyName: title,
          propertyType,
          city,
          keyFeatures: nearbyAttractions,
          amenities: ['Free WiFi', 'Home Cooked Food', 'Mountain View', 'Hot Water'],
        }),
      });

      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
      }
    } catch (err) {
      console.error('AI error:', err);
      setDescription(`${title} is a beautiful ${propertyType} situated in the heart of ${city}. Enjoy peaceful surroundings, scenic views, warm local hospitality, and direct WhatsApp booking with zero commission!`);
    } finally {
      setGeneratingAI(false);
    }
  };

  // Save Property Form Submit
  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Client-side validations
    if (!title.trim()) {
      setFormError('⚠️ Please enter a Property Title / Name.');
      return;
    }

    if (!description.trim()) {
      setFormError('⚠️ Please provide a Property Description.');
      return;
    }

    if (!city.trim()) {
      setFormError('⚠️ Please specify the City / Location.');
      return;
    }

    if (!editingPropertyId) {
      if (!roomName.trim()) {
        setFormError('⚠️ Please enter a Room Type Name for initial room setup.');
        return;
      }
      if (!pricePerNight || pricePerNight <= 0) {
        setFormError('⚠️ Please enter a valid Price Per Night greater than 0.');
        return;
      }
    }

    const photosList = photoUrlsInput
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 20); // Up to 20 photos

    const attractionsList = nearbyAttractions
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const ownerId = currentUser ? currentUser.id : 'owner-demo';
    const ownerName = currentUser ? currentUser.name : 'Homestay Host';
    const finalPhone = ownerPhoneInput.trim() || '+91 9876543210';
    const finalWhatsApp = ownerWhatsAppInput.trim() || '919876543210';

    if (editingPropertyId) {
      // Update
      store.updateProperty(editingPropertyId, {
        title,
        description,
        propertyType,
        address,
        city,
        state: stateName,
        latitude,
        longitude,
        googleMapUrl,
        photos: photosList,
        videoUrl,
        nearbyAttractions: attractionsList,
        checkInTime,
        checkOutTime,
        ownerPhone: finalPhone,
        ownerWhatsApp: finalWhatsApp,
      });
      alert('Property updated successfully with Firebase sync!');
    } else {
      // Create New
      const newProp = store.addProperty({
        title,
        description,
        propertyType,
        address,
        city,
        state: stateName,
        latitude,
        longitude,
        googleMapUrl,
        photos: photosList,
        videoUrl,
        nearbyAttractions: attractionsList,
        checkInTime,
        checkOutTime,
        ownerId,
        ownerName,
        ownerPhone: finalPhone,
        ownerWhatsApp: finalWhatsApp,
      });

      // Automatically add default room type with host's specified room name & pricing
      const amList = roomAmenities
        ? roomAmenities.split(',').map((s) => s.trim()).filter(Boolean)
        : ['Free WiFi', 'Hot Shower', 'Clean Linen'];

      store.addRoomType({
        propertyId: newProp.id,
        roomName: roomName || 'Standard Room',
        pricePerNight: pricePerNight || 2000,
        discountPrice: discountPrice || pricePerNight || 1800,
        maxGuests: maxGuests || 2,
        description: roomDescription || 'Clean room with hot shower and warm hospitality.',
        amenities: amList,
        roomSize: roomSize || '250 sq.ft.',
        bedType: bedType || 'Double Bed',
      });

      setFilterMode('all');
      alert(`🎉 Property "${newProp.title}" listed & published successfully!\n\nIt is now saved in Firebase and live on the Home Page and All Listings.`);
    }

    setIsFormOpen(false);
  };

  // Open Modal to Add Room Type
  const handleOpenAddRoom = (propertyId: string) => {
    setEditingRoomsPropId(propertyId);
    setEditingRoomId(null);
    setRoomName('Deluxe Balcony Room');
    setPricePerNight(2200);
    setDiscountPrice(1800);
    setMaxGuests(3);
    setRoomDescription('Comfortable room with mountain/garden view, attached bath and hot shower.');
    setRoomSize('280 sq ft');
    setBedType('King Size Bed');
    setRoomAmenities('Free WiFi, Geyser, Electric Kettle, Balcony View');
  };

  // Open Modal to Edit Existing Room Type & Price
  const handleOpenEditRoom = (propertyId: string, room: RoomType) => {
    setEditingRoomsPropId(propertyId);
    setEditingRoomId(room.id);
    setRoomName(room.roomName);
    setPricePerNight(room.pricePerNight);
    setDiscountPrice(room.discountPrice || room.pricePerNight);
    setMaxGuests(room.maxGuests);
    setRoomDescription(room.description || '');
    setRoomSize(room.roomSize || '250 sq ft');
    setBedType(room.bedType || 'Double Bed');
    setRoomAmenities((room.amenities || []).join(', '));
  };

  // Save or Update Room Type & Prices
  const handleSaveRoomType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomsPropId) return;

    const amList = roomAmenities.split(',').map((s) => s.trim()).filter(Boolean);

    if (editingRoomId) {
      // Update existing room
      store.updateRoom(editingRoomId, {
        roomName,
        pricePerNight,
        discountPrice,
        maxGuests,
        description: roomDescription,
        amenities: amList,
        roomSize,
        bedType,
      });
      alert('Room type and prices updated successfully!');
    } else {
      // Add new room
      store.addRoomType({
        propertyId: editingRoomsPropId,
        roomName,
        pricePerNight,
        discountPrice,
        maxGuests,
        description: roomDescription,
        amenities: amList,
        roomSize,
        bedType,
      });
      alert('New room type and pricing added successfully!');
    }

    setEditingRoomsPropId(null);
    setEditingRoomId(null);
  };

  // Upgrade Plan / Buy Badges
  const handleBuyAddon = (propId: string, addonType: 'verified' | 'featured' | 'renew') => {
    if (addonType === 'verified') {
      store.togglePropertyVerified(propId, true);
      alert('Blue Verified Badge activated for ₹500/month!');
    } else if (addonType === 'featured') {
      store.togglePropertyFeatured(propId, true);
      alert('⭐ Search Boost activated for ₹500/month! Your homestay will appear at the top of search results.');
    } else if (addonType === 'renew') {
      store.renewPropertySubscription(propId, 30, '₹1000 Standard Listing Plan');
      alert('Listing subscription renewed for 30 days (₹1000).');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Dashboard Top Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              Owner Control Portal
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Zero Platform Commission
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome, {currentUser?.name || 'Homestay Owner'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Manage your hotel or homestay listings, add unlimited room types, upload up to 20 photos & 10s video tours, and receive direct WhatsApp customer leads.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Property</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'properties' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>My Listings ({properties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'subscriptions' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Listing Subscriptions & Badges</span>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'leads' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp Enquiry Leads ({enquiries.length})</span>
        </button>
      </div>

      {/* Tab 1: Properties List */}
      {activeTab === 'properties' && (
        <div className="space-y-6">
          {/* Filter Sub-Tabs Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                🏢 All Platform Listings ({store.getProperties().length})
              </button>
              {currentUser && (
                <button
                  onClick={() => setFilterMode('my')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    filterMode === 'my'
                      ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  👤 My Listings ({store.getPropertiesByOwner(currentUser.id).length})
                </button>
              )}
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {properties.length} active property listings
            </span>
          </div>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map((property) => {
                const rooms = store.getRoomsByProperty(property.id);
                const expiry = new Date(property.subscriptionExpiryDate);
                const today = new Date();
                const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={property.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-md space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Property Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {property.propertyType}
                            </span>
                            {property.isVerified && (
                              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                <BadgeCheck className="w-3 h-3" /> Verified
                              </span>
                            )}
                            {property.isFeatured && (
                              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                                ⭐ Featured
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {property.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{property.city}, {property.state}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => verifyOwnerAndExecute(property, () => handleOpenEdit(property))}
                            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                            title="Edit Property (Requires Owner Login)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              verifyOwnerAndExecute(property, () => {
                                if (confirm('Delete this property listing?')) {
                                  store.deleteProperty(property.id);
                                }
                              });
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl"
                            title="Delete Property"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {property.description}
                      </p>

                      {/* Expiry Warning Callout */}
                      <div className={`mt-3 p-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                        daysLeft <= 3
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>Subscription: {daysLeft} days remaining</span>
                        </span>

                        <button
                          onClick={() => verifyOwnerAndExecute(property, () => handleBuyAddon(property.id, 'renew'))}
                          className="bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                        >
                          Renew ₹1000
                        </button>
                      </div>

                      {/* Room Types & Pricing Summary */}
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            Room Types & Pricing ({rooms.length})
                          </span>
                          <button
                            onClick={() => verifyOwnerAndExecute(property, () => handleOpenAddRoom(property.id))}
                            className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-extrabold px-2.5 py-1 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>+ Add Room & Price</span>
                          </button>
                        </div>

                        {rooms.map((r) => (
                          <div
                            key={r.id}
                            className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2"
                          >
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white text-xs">{r.roomName}</p>
                              <p className="text-[10px] text-slate-500">Max {r.maxGuests} Guests • {r.bedType} • {r.roomSize || '250 sq ft'}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="flex items-baseline gap-1 justify-end">
                                <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                                  ₹{r.discountPrice || r.pricePerNight}
                                </span>
                                {r.discountPrice && r.discountPrice < r.pricePerNight && (
                                  <span className="text-[10px] text-slate-400 line-through">
                                    ₹{r.pricePerNight}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500">/night</span>
                              </div>

                              <div className="flex items-center gap-2 justify-end mt-1">
                                <button
                                  onClick={() => verifyOwnerAndExecute(property, () => handleOpenEditRoom(property.id, r))}
                                  className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" /> Edit Price
                                </button>
                                <span className="text-slate-300">•</span>
                                <button
                                  onClick={() => {
                                    verifyOwnerAndExecute(property, () => {
                                      if (confirm(`Delete room "${r.roomName}"?`)) {
                                        store.deleteRoomType(r.id);
                                      }
                                    });
                                  }}
                                  className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Host Ownership Badge & Security Status */}
                      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-700/80 pt-2.5 mt-2">
                        <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                          <span>Host: {property.ownerName}</span>
                        </span>
                        {currentUser && store.isOwnerOfProperty(currentUser.id, property.id) ? (
                          <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg text-[10px] font-extrabold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Owner Logged In
                          </span>
                        ) : (
                          <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-lg text-[10px] font-extrabold border border-amber-200 dark:border-amber-800 flex items-center gap-1" title="Login as this property's owner to edit or delete">
                            <Lock className="w-3 h-3 text-amber-600" /> Login Required to Edit
                          </span>
                        )}
                      </div>

                    </div>

                    {/* Property Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                      <button
                        onClick={() => handleBuyAddon(property.id, 'verified')}
                        disabled={property.isVerified}
                        className="flex-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs py-2 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 disabled:opacity-50"
                      >
                        {property.isVerified ? '✓ Verified Active' : '+ Blue Tick (₹500)'}
                      </button>

                      <button
                        onClick={() => handleBuyAddon(property.id, 'featured')}
                        disabled={property.isFeatured}
                        className="flex-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold text-xs py-2 rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-100 disabled:opacity-50"
                      >
                        {property.isFeatured ? '⭐ Boost Active' : '+ Search Boost (₹500)'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700 space-y-3">
              <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                No Properties Listed Yet
              </h4>
              <p className="text-xs text-slate-500">
                Click "Add New Property" to list your homestay or hotel on THIKANA marketplace.
              </p>
              <button
                onClick={handleOpenAdd}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md"
              >
                Add Your First Property
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Subscription Plans & Badges */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Listing Subscriptions & Add-on Plans
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Zero Commission Model: Choose a monthly listing plan to showcase your property directly to travelers with 100% direct WhatsApp leads!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Plan 1 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg space-y-4 relative flex flex-col justify-between">
              <div>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                  Standard Listing
                </span>
                <h4 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                  ₹1,000 / month
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Ideal for standard homestays & local guest houses.
                </p>

                <ul className="mt-4 text-xs space-y-2 text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">✓ Unlimited room types</li>
                  <li className="flex items-center gap-2">✓ Up to 20 Photos & 10s Video</li>
                  <li className="flex items-center gap-2">✓ Direct WhatsApp Enquiries</li>
                  <li className="flex items-center gap-2">✓ AI Description Generator</li>
                  <li className="flex items-center gap-2">✓ 0% Platform Commission</li>
                </ul>
              </div>

              <button
                onClick={() => alert('Standard Listing Plan selected (₹1000/month). Please choose your property to activate.')}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs py-3 rounded-xl hover:opacity-90 transition-all cursor-pointer"
              >
                Subscribe ₹1000/mo
              </button>
            </div>

            {/* Plan 2 */}
            <div className="bg-gradient-to-b from-emerald-900 to-slate-900 text-white p-6 rounded-3xl border-2 border-emerald-500 shadow-2xl space-y-4 relative flex flex-col justify-between">
              <span className="absolute -top-3 right-6 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md">
                Prime Choice
              </span>
              <div>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                  Prime Location Listing
                </span>
                <h4 className="text-xl font-black text-white mt-2">
                  ₹1,500 / month
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  For prime tourist hubs (Manali Mall Road, Goa Beaches, Gangtok Town).
                </p>

                <ul className="mt-4 text-xs space-y-2 text-slate-200">
                  <li className="flex items-center gap-2">✓ Priority Placement in Search</li>
                  <li className="flex items-center gap-2">✓ Unlimited room types</li>
                  <li className="flex items-center gap-2">✓ Full 20 Photos + Video Tour</li>
                  <li className="flex items-center gap-2">✓ Direct WhatsApp Enquiries</li>
                  <li className="flex items-center gap-2">✓ Priority Customer Support</li>
                </ul>
              </div>

              <button
                onClick={() => alert('Prime Location Plan selected (₹1500/month).')}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                Subscribe ₹1500/mo
              </button>
            </div>

            {/* Addons */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg space-y-4 flex flex-col justify-between">
              <div>
                <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                  Badges & Search Boost
                </span>
                <h4 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                  ₹500 / month each
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Stand out from competitors and gain guest trust.
                </p>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
                    <p className="font-extrabold text-blue-900 dark:text-blue-300 flex items-center gap-1">
                      <BadgeCheck className="w-4 h-4 fill-blue-600 text-white" />
                      Blue Verified Badge (₹500)
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Displays trust badge on your listing card.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
                    <p className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      ⭐ Top Search Boost (₹500)
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Pins your property to top of customer searches.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('properties')}
                className="w-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs py-3 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Apply Badges to Properties
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Tab 3: Customer WhatsApp Enquiries Lead Tracker */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Incoming Customer WhatsApp Enquiries
              </h3>
              <p className="text-xs text-slate-500">
                Track booking form submissions filled by guests for your homestays.
              </p>
            </div>
          </div>

          {enquiries.length > 0 ? (
            <div className="space-y-3">
              {enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {enq.customerName}
                      </span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md">
                        {enq.propertyName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      🗓️ {enq.checkInDate} to {enq.checkOutDate} ({enq.numberOfDays} Days) • 👥 {enq.totalGuests} Guests • 🛏️ {enq.selectedRoomName}
                    </p>

                    <p className="text-xs text-slate-500">
                      📱 Contact: <strong className="text-slate-800 dark:text-slate-200">{enq.customerPhone}</strong> • Total Estimated: <strong className="text-emerald-600 dark:text-emerald-400">₹{enq.calculatedTotal}</strong>
                    </p>

                    {enq.specialRequests && (
                      <p className="text-[11px] text-slate-500 italic">
                        "{enq.specialRequests}"
                      </p>
                    )}
                  </div>

                  <a
                    href={`https://wa.me/${enq.customerWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${enq.customerName}, regarding your enquiry for ${enq.propertyName} on THIKANA:`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                    <span>Chat with Customer</span>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700 space-y-2">
              <MessageCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                No WhatsApp Enquiries Yet
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                When travelers fill out the booking enquiry form on your homestay page, leads will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add or Edit Property */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {editingPropertyId ? 'Edit Property Listing' : 'Add New Hotel or Homestay'}
                </h3>
                <p className="text-[11px] text-slate-500">Fill details & publish directly to THIKANA marketplace.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProperty} className="space-y-4 overflow-y-auto pr-1 flex-1">
              
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Property Name / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Himalayan Haven Homestay"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e: any) => setPropertyType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Homestay">Homestay</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Resort">Resort</option>
                    <option value="Villa">Villa</option>
                    <option value="Cottage">Cottage</option>
                  </select>
                </div>
              </div>

              {/* AI Generator Description Section */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Property Description (Unlimited text) <span className="text-rose-500">*</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={handleGenerateAIDescription}
                    disabled={generatingAI}
                    className="text-[11px] bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {generatingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    <span>Auto-Write with AI</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  required
                  placeholder="Describe your homestay, local organic food, mountain views, peaceful atmosphere..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Location & Map Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Manali"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Himachal Pradesh"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Old Manali Village"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Latitude & Longitude & Google Map Link */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value) || 32.24)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value) || 77.18)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Google Maps Link</label>
                  <input
                    type="url"
                    placeholder="https://maps.app.goo.gl/..."
                    value={googleMapUrl}
                    onChange={(e) => setGoogleMapUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Nearby Attractions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nearby Attractions (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Mall Road (1.2 km), Hadimba Temple (2.5 km), Solang Valley (12 km)"
                  value={nearbyAttractions}
                  onChange={(e) => setNearbyAttractions(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Custom Check-In & Out Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Custom Check-In Time</label>
                  <input
                    type="text"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Custom Check-Out Time</label>
                  <input
                    type="text"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Photo & Video Upload URLs with Real Image File Picker */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Hotel / Homestay Real Photos (Gallery)
                  </label>
                  <div className="flex items-center gap-2">
                    {photoUrlsInput && (
                      <button
                        type="button"
                        onClick={() => setPhotoUrlsInput('')}
                        className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                    <label className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl cursor-pointer shadow-md flex items-center gap-1.5 transition-transform active:scale-95">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>+ Upload Photos</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>

                {/* Quick Presets for Instant Demo Photos */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const presets = [
                        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
                      ];
                      setPhotoUrlsInput(presets.join('\n'));
                    }}
                    className="text-[10px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-lg font-semibold hover:border-emerald-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    🌿 Assam Stilt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const presets = [
                        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80'
                      ];
                      setPhotoUrlsInput(presets.join('\n'));
                    }}
                    className="text-[10px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-lg font-semibold hover:border-emerald-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    🏔️ Mountain View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const presets = [
                        'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80'
                      ];
                      setPhotoUrlsInput(presets.join('\n'));
                    }}
                    className="text-[10px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-lg font-semibold hover:border-emerald-500 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    🏡 Tea Cottage
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={photoUrlsInput}
                  onChange={(e) => setPhotoUrlsInput(e.target.value)}
                  placeholder="Paste photo URLs (one per line) or click '+ Upload Photos' or choose a Quick Preset above..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                />

                {/* Live Photo Preview Grid */}
                {photoUrlsInput.split('\n').filter((s) => s.trim().length > 0).length > 0 && (
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2">
                      Selected Real Property Photos ({photoUrlsInput.split('\n').filter((s) => s.trim().length > 0).length})
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {photoUrlsInput
                        .split('\n')
                        .map((s) => s.trim())
                        .filter((s) => s.length > 0)
                        .map((url, idx) => (
                          <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-300 dark:border-slate-700">
                            <img src={url} alt={`Property Photo ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                const lines = photoUrlsInput.split('\n').map((s) => s.trim()).filter(Boolean);
                                lines.splice(idx, 1);
                                setPhotoUrlsInput(lines.join('\n'));
                              }}
                              className="absolute top-1 right-1 bg-rose-600/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Direct WhatsApp Contact Setup Section */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-300 dark:border-emerald-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    WhatsApp Direct Booking Receiver Settings
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      WhatsApp Number (with country code e.g. 919876543210) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerWhatsAppInput}
                      onChange={(e) => setOwnerWhatsAppInput(e.target.value)}
                      placeholder="e.g. 919876543210"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Guest booking enquiries will be sent directly to this WhatsApp number.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Host Calling Mobile Phone
                    </label>
                    <input
                      type="tel"
                      value={ownerPhoneInput}
                      onChange={(e) => setOwnerPhoneInput(e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  10-Second Video Tour URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://assets.mixkit.co/videos/preview/mixkit-cozy-living-room-with-a-fireplace-42998-large.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Room Type & Pricing Setup Section (For new or existing listings) */}
              {!editingPropertyId && (
                <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-300 dark:border-emerald-700/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Initial Room Type & Nightly Price Setup
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Room Type Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Traditional Bamboo Stilt (Chang Ghar) Suite"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Price / Night (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={pricePerNight}
                        onChange={(e) => setPricePerNight(parseInt(e.target.value) || 1000)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Discount Price / Night (₹)
                      </label>
                      <input
                        type="number"
                        value={discountPrice}
                        onChange={(e) => setDiscountPrice(parseInt(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Guests</label>
                      <input
                        type="number"
                        value={maxGuests}
                        onChange={(e) => setMaxGuests(parseInt(e.target.value) || 2)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bed Type</label>
                      <input
                        type="text"
                        value={bedType}
                        onChange={(e) => setBedType(e.target.value)}
                        placeholder="e.g. King Bed"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md"
                >
                  Save Property Listing
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Room Types & Prices for Property */}
      {editingRoomsPropId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative my-8">
            <button
              onClick={() => {
                setEditingRoomsPropId(null);
                setEditingRoomId(null);
              }}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">
              {editingRoomId ? 'Edit Room Type & Pricing' : 'Add New Room Type & Pricing'}
            </h3>

            <form onSubmit={handleSaveRoomType} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Room Type Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Bamboo Stilt (Chang Ghar) Suite"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Original Price / Night (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(parseInt(e.target.value) || 1000)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Discount Price / Night (₹)</label>
                  <input
                    type="number"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Guests</label>
                  <input
                    type="number"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(parseInt(e.target.value) || 2)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Room Size</label>
                  <input
                    type="text"
                    value={roomSize}
                    onChange={(e) => setRoomSize(e.target.value)}
                    placeholder="e.g. 300 sq.ft."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bed Type</label>
                  <input
                    type="text"
                    value={bedType}
                    onChange={(e) => setBedType(e.target.value)}
                    placeholder="e.g. King Bed"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Room Description</label>
                <input
                  type="text"
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  placeholder="e.g. Authentic wooden stay with tea garden views & hot water..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Amenities (comma separated)</label>
                <input
                  type="text"
                  value={roomAmenities}
                  onChange={(e) => setRoomAmenities(e.target.value)}
                  placeholder="WiFi, Geyser, Balcony, Tea Kettle, Bukhari Heater"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRoomsPropId(null);
                    setEditingRoomId(null);
                  }}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  {editingRoomId ? 'Save Room & Price Updates' : 'Add Room & Set Price'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Property Owner Login & Verification Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingAction(null);
        }}
        initialMode="login"
        requiredOwnerId={authRequiredOwnerId}
        targetPropertyTitle={authTargetTitle}
        onSuccessRole={() => {
          setAuthModalOpen(false);
          if (pendingAction) {
            const act = pendingAction;
            setPendingAction(null);
            setTimeout(() => {
              act();
            }, 100);
          }
        }}
      />

    </div>
  );
};
