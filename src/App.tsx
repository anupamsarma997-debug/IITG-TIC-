import React, { useState, useEffect } from 'react';
import { UserRole, Property, RoomType } from './types';
import { store } from './services/store';

// Components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WhatsAppEnquiryModal } from './components/WhatsAppEnquiryModal';
import { PropertyGalleryModal } from './components/PropertyGalleryModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AuthModal } from './components/AuthModal';

// Views
import { CustomerHomeView } from './views/CustomerHomeView';
import { PropertyDetailView } from './views/PropertyDetailView';
import { OwnerDashboardView } from './views/OwnerDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';

export function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('customer');
  const [currentView, setCurrentView] = useState<'home' | 'property-detail'>('home');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('All Locations');

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState<boolean>(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [selectedRoomForWhatsApp, setSelectedRoomForWhatsApp] = useState<RoomType | undefined>(undefined);

  // App Frame Toggle
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(store.getMobileFrame());
  const [isDark, setIsDark] = useState<boolean>(store.getTheme());

  useEffect(() => {
    return store.subscribe(() => {
      setIsMobileFrame(store.getMobileFrame());
      setIsDark(store.getTheme());
    });
  }, []);

  // Update HTML class for dark theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleSelectProperty = (prop: Property) => {
    setSelectedProperty(prop);
    setCurrentView('property-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenWhatsApp = (prop: Property, room?: RoomType) => {
    setSelectedProperty(prop);
    setSelectedRoomForWhatsApp(room);
    setIsWhatsAppOpen(true);
  };

  const handleOpenGallery = (prop: Property) => {
    setSelectedProperty(prop);
    setIsGalleryOpen(true);
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors ${
      isMobileFrame ? 'p-0 sm:p-6 bg-slate-950' : ''
    }`}>
      
      {/* Mobile Frame Container Wrapper (if Mobile Frame toggled) */}
      <div className={isMobileFrame ? 'max-w-[430px] mx-auto min-h-[880px] bg-white dark:bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl border-[12px] border-slate-800 relative flex flex-col my-4' : 'flex flex-col min-h-screen'}>
        
        {/* Navigation Bar */}
        <Navbar
          currentRole={currentRole}
          onRoleChange={(role) => {
            setCurrentRole(role);
            setCurrentView('home');
          }}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenAI={() => setIsAIOpen(true)}
          onOpenAddProperty={() => {
            setCurrentRole('owner');
            setCurrentView('home');
          }}
          onSelectCity={setSelectedCity}
          selectedCity={selectedCity}
        />

        {/* Main Content Area */}
        <main className="flex-1">
          {currentRole === 'customer' && (
            currentView === 'home' || !selectedProperty ? (
              <CustomerHomeView
                onSelectProperty={handleSelectProperty}
                onOpenWhatsApp={handleOpenWhatsApp}
                onSelectCity={setSelectedCity}
                selectedCity={selectedCity}
              />
            ) : (
              <PropertyDetailView
                property={selectedProperty}
                onBack={() => setCurrentView('home')}
                onOpenWhatsApp={handleOpenWhatsApp}
                onOpenGallery={handleOpenGallery}
              />
            )
          )}

          {currentRole === 'owner' && (
            <OwnerDashboardView
              onSelectProperty={handleSelectProperty}
            />
          )}

          {currentRole === 'admin' && (
            <AdminDashboardView />
          )}
        </main>

        {/* Footer */}
        <Footer
          onRoleChange={(role) => {
            setCurrentRole(role);
            setCurrentView('home');
          }}
          onOpenAddProperty={() => {
            setCurrentRole('owner');
            setCurrentView('home');
          }}
        />

      </div>

      {/* WhatsApp Booking Enquiry Form Modal */}
      <WhatsAppEnquiryModal
        property={selectedProperty}
        initialRoom={selectedRoomForWhatsApp}
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
      />

      {/* Property Photo & Video Gallery Modal */}
      <PropertyGalleryModal
        property={selectedProperty}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />

      {/* Authentication & Registration Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccessRole={(role) => setCurrentRole(role)}
      />

    </div>
  );
}

export default App;
