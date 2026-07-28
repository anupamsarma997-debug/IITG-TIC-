import { Property, RoomType, BannerAd, User, BookingEnquiry, SubscriptionTransaction, PropertyType } from '../types';
import { INITIAL_USERS, INITIAL_PROPERTIES, INITIAL_ROOMS, INITIAL_BANNERS, INITIAL_TRANSACTIONS } from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'thikana_users_v1',
  PROPERTIES: 'thikana_properties_v1',
  ROOMS: 'thikana_rooms_v1',
  BANNERS: 'thikana_banners_v1',
  ENQUIRIES: 'thikana_enquiries_v1',
  TRANSACTIONS: 'thikana_transactions_v1',
  CURRENT_USER_ID: 'thikana_current_user_id_v1',
  THEME: 'thikana_theme_v1',
  MOBILE_FRAME: 'thikana_mobile_frame_v1',
};

class DataStore {
  private users: User[] = [];
  private properties: Property[] = [];
  private rooms: RoomType[] = [];
  private banners: BannerAd[] = [];
  private enquiries: BookingEnquiry[] = [];
  private transactions: SubscriptionTransaction[] = [];
  private currentUserId: string = 'customer_1';
  private listeners: Set<() => void> = new Set();
  private isDarkMode: boolean = false;
  private isMobileFrame: boolean = false;

  constructor() {
    this.initData();
  }

  private initData() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;

      const storedProps = localStorage.getItem(STORAGE_KEYS.PROPERTIES);
      this.properties = storedProps ? JSON.parse(storedProps) : INITIAL_PROPERTIES;

      const storedRooms = localStorage.getItem(STORAGE_KEYS.ROOMS);
      this.rooms = storedRooms ? JSON.parse(storedRooms) : INITIAL_ROOMS;

      const storedBanners = localStorage.getItem(STORAGE_KEYS.BANNERS);
      this.banners = storedBanners ? JSON.parse(storedBanners) : INITIAL_BANNERS;

      const storedEnquiries = localStorage.getItem(STORAGE_KEYS.ENQUIRIES);
      this.enquiries = storedEnquiries ? JSON.parse(storedEnquiries) : [];

      const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      this.transactions = storedTx ? JSON.parse(storedTx) : INITIAL_TRANSACTIONS;

      const storedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      this.currentUserId = storedUserId || 'customer_1';

      const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      this.isDarkMode = storedTheme === 'dark';

      const storedFrame = localStorage.getItem(STORAGE_KEYS.MOBILE_FRAME);
      this.isMobileFrame = storedFrame === 'true';

      this.persist();
    } catch (e) {
      console.error('Error loading store data:', e);
      this.users = INITIAL_USERS;
      this.properties = INITIAL_PROPERTIES;
      this.rooms = INITIAL_ROOMS;
      this.banners = INITIAL_BANNERS;
      this.transactions = INITIAL_TRANSACTIONS;
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(this.properties));
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(this.rooms));
      localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(this.banners));
      localStorage.setItem(STORAGE_KEYS.ENQUIRIES, JSON.stringify(this.enquiries));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId);
      localStorage.setItem(STORAGE_KEYS.THEME, this.isDarkMode ? 'dark' : 'light');
      localStorage.setItem(STORAGE_KEYS.MOBILE_FRAME, String(this.isMobileFrame));
    } catch (e) {
      console.error('Error persisting store:', e);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.persist();
    this.listeners.forEach((fn) => fn());
  }

  // Auth & User Management
  public getCurrentUser(): User | undefined {
    return this.users.find((u) => u.id === this.currentUserId);
  }

  public getUsers(): User[] {
    return this.users;
  }

  public setCurrentUserId(id: string) {
    this.currentUserId = id;
    this.notify();
  }

  public registerUser(user: Omit<User, 'id' | 'createdAt' | 'status'>): User {
    const newUser: User = {
      ...user,
      id: 'user_' + Date.now(),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.currentUserId = newUser.id;
    this.notify();
    return newUser;
  }

  public updateUserStatus(userId: string, status: User['status']) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.status = status;
      this.notify();
    }
  }

  public toggleUserStatus(userId: string) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.status = user.status === 'active' ? 'blocked' : 'active';
      this.notify();
    }
  }

  // Theme & Frame Mode
  public getTheme() {
    return this.isDarkMode;
  }

  public toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.notify();
  }

  public getMobileFrame() {
    return this.isMobileFrame;
  }

  public toggleMobileFrame() {
    this.isMobileFrame = !this.isMobileFrame;
    this.notify();
  }

  // Properties
  public getProperties(): Property[] {
    return this.properties;
  }

  public getPropertyById(id: string): Property | undefined {
    return this.properties.find((p) => p.id === id);
  }

  public getPropertiesByOwner(ownerId: string): Property[] {
    return this.properties.filter((p) => p.ownerId === ownerId);
  }

  public addProperty(
    prop: Omit<Property, 'id' | 'createdAt' | 'rating' | 'reviewsCount' | 'isVerified' | 'isFeatured' | 'status' | 'subscriptionPlan' | 'subscriptionPrice' | 'subscriptionExpiresAt' | 'subscriptionExpiryDate'>,
    planType: 'standard_1000' | 'standard_1500' = 'standard_1000'
  ): Property {
    const now = new Date();
    const expires = new Date();
    expires.setDate(now.getDate() + 30);

    const price = planType === 'standard_1500' ? 1500 : 1000;

    const newProp: Property = {
      ...prop,
      id: 'prop_' + Date.now(),
      rating: 5.0,
      reviewsCount: 1,
      isVerified: false,
      isFeatured: false,
      status: 'active',
      subscriptionPlan: planType,
      subscriptionPrice: price,
      subscriptionExpiresAt: expires.toISOString(),
      subscriptionExpiryDate: expires.toISOString(),
      createdAt: now.toISOString(),
    };

    this.properties.push(newProp);

    this.addTransaction({
      ownerId: prop.ownerId,
      ownerName: prop.ownerName,
      propertyId: newProp.id,
      propertyName: newProp.title,
      type: planType,
      planName: `${planType === 'standard_1500' ? 'Prime Location' : 'Standard'} Listing Subscription (1 Month)`,
      amount: price,
      date: now.toISOString().split('T')[0],
    });

    this.notify();
    return newProp;
  }

  public updateProperty(id: string, updates: Partial<Property>) {
    const idx = this.properties.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.properties[idx] = { ...this.properties[idx], ...updates };
      this.notify();
    }
  }

  public togglePropertyStatus(id: string) {
    const prop = this.getPropertyById(id);
    if (prop) {
      prop.status = prop.status === 'active' ? 'blocked' : 'active';
      this.notify();
    }
  }

  public togglePropertyVerified(id: string, verified?: boolean) {
    const prop = this.getPropertyById(id);
    if (prop) {
      prop.isVerified = verified !== undefined ? verified : !prop.isVerified;
      if (prop.isVerified) {
        this.addTransaction({
          ownerId: prop.ownerId,
          ownerName: prop.ownerName,
          propertyId: prop.id,
          propertyName: prop.title,
          type: 'verified_badge',
          planName: 'Blue Verified Badge (₹500/month)',
          amount: 500,
          date: new Date().toISOString().split('T')[0],
        });
      }
      this.notify();
    }
  }

  public togglePropertyFeatured(id: string, featured?: boolean) {
    const prop = this.getPropertyById(id);
    if (prop) {
      prop.isFeatured = featured !== undefined ? featured : !prop.isFeatured;
      if (prop.isFeatured) {
        this.addTransaction({
          ownerId: prop.ownerId,
          ownerName: prop.ownerName,
          propertyId: prop.id,
          propertyName: prop.title,
          type: 'search_boost',
          planName: 'Top Search Placement ⭐ Featured (₹500/month)',
          amount: 500,
          date: new Date().toISOString().split('T')[0],
        });
      }
      this.notify();
    }
  }

  public deleteProperty(id: string) {
    this.properties = this.properties.filter((p) => p.id !== id);
    this.rooms = this.rooms.filter((r) => r.propertyId !== id);
    this.notify();
  }

  public renewPropertySubscription(propertyId: string, daysToAdd = 30, planName = 'Standard Listing Plan') {
    const prop = this.getPropertyById(propertyId);
    if (!prop) return;

    const price = 1000;
    const now = new Date();
    const currentExpiry = new Date(prop.subscriptionExpiresAt || prop.subscriptionExpiryDate || now.toISOString());
    const startDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(startDate);
    newExpiry.setDate(newExpiry.getDate() + daysToAdd);

    prop.subscriptionExpiresAt = newExpiry.toISOString();
    prop.subscriptionExpiryDate = newExpiry.toISOString();
    prop.status = 'active';

    this.addTransaction({
      ownerId: prop.ownerId,
      ownerName: prop.ownerName,
      propertyId: prop.id,
      propertyName: prop.title,
      type: 'standard_1000',
      planName: planName || 'Standard Listing Renewal',
      amount: price,
      date: now.toISOString().split('T')[0],
    });

    this.notify();
  }

  // Room Types
  public getRoomsByProperty(propertyId: string): RoomType[] {
    return this.rooms.filter((r) => r.propertyId === propertyId);
  }

  public addRoom(room: Omit<RoomType, 'id'>): RoomType {
    const newRoom: RoomType = {
      ...room,
      id: 'room_' + Date.now(),
    };
    this.rooms.push(newRoom);
    this.notify();
    return newRoom;
  }

  public addRoomType(room: Omit<RoomType, 'id'>): RoomType {
    return this.addRoom(room);
  }

  public updateRoom(id: string, updates: Partial<RoomType>) {
    const idx = this.rooms.findIndex((r) => r.id === id);
    if (idx !== -1) {
      this.rooms[idx] = { ...this.rooms[idx], ...updates };
      this.notify();
    }
  }

  public deleteRoom(id: string) {
    this.rooms = this.rooms.filter((r) => r.id !== id);
    this.notify();
  }

  public deleteRoomType(id: string) {
    this.deleteRoom(id);
  }

  // Booking Enquiries
  public addEnquiry(enquiry: Omit<BookingEnquiry, 'id' | 'createdAt'>): BookingEnquiry {
    const nowIso = new Date().toISOString();
    const newEnquiry: BookingEnquiry = {
      ...enquiry,
      id: 'enq_' + Date.now(),
      sentAt: nowIso,
      createdAt: nowIso,
    };
    this.enquiries.unshift(newEnquiry);
    this.notify();
    return newEnquiry;
  }

  public getEnquiriesByOwner(ownerId: string): BookingEnquiry[] {
    return this.enquiries.filter((e) => e.ownerId === ownerId);
  }

  public getAllEnquiries(): BookingEnquiry[] {
    return this.enquiries;
  }

  public getEnquiries(): BookingEnquiry[] {
    return this.getAllEnquiries();
  }

  // Banner Ads
  public getBanners(position?: BannerAd['position']): BannerAd[] {
    if (!position) return this.banners.filter((b) => b.isActive);
    return this.banners.filter((b) => b.position === position && b.isActive);
  }

  public getAllBanners(): BannerAd[] {
    return this.banners;
  }

  public addBanner(banner: Omit<BannerAd, 'id'>): BannerAd {
    const newBanner: BannerAd = {
      ...banner,
      id: 'banner_' + Date.now(),
    };
    this.banners.push(newBanner);
    this.notify();
    return newBanner;
  }

  public toggleBannerStatus(id: string) {
    const idx = this.banners.findIndex((b) => b.id === id);
    if (idx !== -1) {
      this.banners[idx].isActive = !this.banners[idx].isActive;
      this.notify();
    }
  }

  public updateBanner(id: string, updates: Partial<BannerAd>) {
    const idx = this.banners.findIndex((b) => b.id === id);
    if (idx !== -1) {
      this.banners[idx] = { ...this.banners[idx], ...updates };
      this.notify();
    }
  }

  public deleteBanner(id: string) {
    this.banners = this.banners.filter((b) => b.id !== id);
    this.notify();
  }

  // Transactions & Revenue
  public getTransactions(): SubscriptionTransaction[] {
    return this.transactions;
  }

  public addTransaction(tx: Omit<SubscriptionTransaction, 'id'>) {
    const newTx: SubscriptionTransaction = {
      ...tx,
      id: 'tx_' + Date.now(),
    };
    this.transactions.unshift(newTx);
  }

  public getTotalRevenue(): number {
    return this.transactions.reduce((sum, t) => sum + t.amount, 0);
  }
}

export const store = new DataStore();
