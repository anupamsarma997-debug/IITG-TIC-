import { Property, RoomType, BannerAd, User, UserRole, BookingEnquiry, SubscriptionTransaction, PropertyType } from '../types';
import { INITIAL_USERS, INITIAL_PROPERTIES, INITIAL_ROOMS, INITIAL_BANNERS, INITIAL_TRANSACTIONS } from '../data/initialData';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

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
  private isFirebaseSynced: boolean = false;

  constructor() {
    this.initData();
    this.initFirebaseListeners();
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

  private initFirebaseListeners() {
    try {
      // Sync properties collection from Firestore
      onSnapshot(collection(db, 'properties'), (snapshot) => {
        if (!snapshot.empty) {
          const remoteProps: Property[] = [];
          snapshot.forEach((docSnap) => {
            remoteProps.push({ id: docSnap.id, ...docSnap.data() } as Property);
          });
          if (remoteProps.length > 0) {
            const propMap = new Map<string, Property>();
            this.properties.forEach((p) => propMap.set(p.id, p));
            remoteProps.forEach((rp) => propMap.set(rp.id, rp));
            this.properties = Array.from(propMap.values());
            this.persist();
            this.notify(false);
          }
        } else if (!this.isFirebaseSynced) {
          // Seed Firestore with initial properties if empty
          INITIAL_PROPERTIES.forEach((p) => {
            setDoc(doc(db, 'properties', p.id), p).catch((err) => console.warn('Firestore seed prop error:', err));
          });
        }
        this.isFirebaseSynced = true;
      }, (err) => {
        console.warn('Firestore properties sync warning:', err);
      });

      // Sync rooms collection from Firestore
      onSnapshot(collection(db, 'rooms'), (snapshot) => {
        if (!snapshot.empty) {
          const remoteRooms: RoomType[] = [];
          snapshot.forEach((docSnap) => {
            remoteRooms.push({ id: docSnap.id, ...docSnap.data() } as RoomType);
          });
          if (remoteRooms.length > 0) {
            const roomMap = new Map<string, RoomType>();
            this.rooms.forEach((r) => roomMap.set(r.id, r));
            remoteRooms.forEach((rr) => roomMap.set(rr.id, rr));
            this.rooms = Array.from(roomMap.values());
            this.persist();
            this.notify(false);
          }
        } else if (!this.isFirebaseSynced) {
          INITIAL_ROOMS.forEach((r) => {
            setDoc(doc(db, 'rooms', r.id), r).catch((err) => console.warn('Firestore seed room error:', err));
          });
        }
      }, (err) => {
        console.warn('Firestore rooms sync warning:', err);
      });

      // Sync users collection from Firestore
      onSnapshot(collection(db, 'users'), (snapshot) => {
        if (!snapshot.empty) {
          const remoteUsers: User[] = [];
          snapshot.forEach((docSnap) => {
            remoteUsers.push({ id: docSnap.id, ...docSnap.data() } as User);
          });
          if (remoteUsers.length > 0) {
            const userMap = new Map<string, User>();
            this.users.forEach((u) => userMap.set(u.id, u));
            remoteUsers.forEach((ru) => userMap.set(ru.id, ru));
            this.users = Array.from(userMap.values());
            this.persist();
            this.notify(false);
          }
        }
      }, (err) => {
        console.warn('Firestore users sync warning:', err);
      });

      // Sync enquiries collection from Firestore
      onSnapshot(collection(db, 'enquiries'), (snapshot) => {
        if (!snapshot.empty) {
          const remoteEnquiries: BookingEnquiry[] = [];
          snapshot.forEach((docSnap) => {
            remoteEnquiries.push({ id: docSnap.id, ...docSnap.data() } as BookingEnquiry);
          });
          if (remoteEnquiries.length > 0) {
            const enqMap = new Map<string, BookingEnquiry>();
            this.enquiries.forEach((e) => enqMap.set(e.id, e));
            remoteEnquiries.forEach((re) => enqMap.set(re.id, re));
            this.enquiries = Array.from(enqMap.values());
            this.persist();
            this.notify(false);
          }
        }
      }, (err) => {
        console.warn('Firestore enquiries sync warning:', err);
      });

    } catch (err) {
      console.error('Firebase initialization warning:', err);
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

  private notify(syncLocal = true) {
    if (syncLocal) {
      this.persist();
    }
    this.listeners.forEach((fn) => fn());
  }

  // Auth & User Management
  public loginOrRegisterWithGoogle(googleData: {
    email: string;
    displayName?: string | null;
    photoURL?: string | null;
    uid?: string;
    desiredRole?: UserRole;
  }): User {
    const q = googleData.email.trim().toLowerCase();
    let found = this.users.find(
      (u) =>
        (u.googleEmail && u.googleEmail.toLowerCase() === q) ||
        (u.email && u.email.toLowerCase() === q)
    );

    if (found) {
      if (!found.googleEmail) found.googleEmail = googleData.email;
      this.currentUserId = found.id;
      setDoc(doc(db, 'users', found.id), found, { merge: true }).catch((err) =>
        console.warn('Firestore sync user error:', err)
      );
      this.notify();
      return found;
    }

    // Create new user from Google Login
    const baseName = googleData.displayName || googleData.email.split('@')[0];
    const baseUsername = googleData.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');

    const newUser: User = {
      id: googleData.uid ? `google_${googleData.uid}` : 'user_' + Date.now(),
      name: baseName,
      username: baseUsername || 'user_' + Math.floor(1000 + Math.random() * 9000),
      email: googleData.email,
      googleEmail: googleData.email,
      password: 'pass_' + Math.floor(100000 + Math.random() * 900000),
      phone: '',
      whatsapp: '',
      role: googleData.desiredRole || 'owner',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.currentUserId = newUser.id;
    setDoc(doc(db, 'users', newUser.id), newUser).catch((err) =>
      console.warn('Firestore register Google User error:', err)
    );
    this.notify();
    return newUser;
  }

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

  public registerUser(user: Omit<User, 'id' | 'createdAt' | 'status'> & { username?: string; password?: string; googleEmail?: string }): User {
    const newUser: User = {
      ...user,
      username: user.username || user.email.split('@')[0],
      password: user.password || 'pass123',
      googleEmail: user.googleEmail || user.email,
      id: 'user_' + Date.now(),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.currentUserId = newUser.id;
    setDoc(doc(db, 'users', newUser.id), newUser).catch((err) => console.warn('Firestore registerUser error:', err));
    this.notify();
    return newUser;
  }

  public loginWithUsernamePassword(identifier: string, passwordInput: string): { success: boolean; user?: User; message?: string } {
    const q = identifier.trim().toLowerCase();
    const found = this.users.find((u) => 
      (u.username && u.username.toLowerCase() === q) ||
      (u.email && u.email.toLowerCase() === q) ||
      (u.googleEmail && u.googleEmail.toLowerCase() === q) ||
      u.phone === identifier.trim()
    );

    if (!found) {
      return { success: false, message: 'No account found with this username, email, or mobile number.' };
    }

    if (found.password && found.password !== passwordInput) {
      return { success: false, message: 'Incorrect password! Please check your credentials or use Google Email password reset.' };
    }

    this.currentUserId = found.id;
    this.notify();
    return { success: true, user: found };
  }

  public resetPasswordWithGoogleEmail(googleEmailInput: string, newPassword: string, newUsername?: string): { success: boolean; user?: User; message?: string } {
    const q = googleEmailInput.trim().toLowerCase();
    const found = this.users.find((u) => 
      (u.googleEmail && u.googleEmail.toLowerCase() === q) ||
      (u.email && u.email.toLowerCase() === q)
    );

    if (!found) {
      return { 
        success: false, 
        message: 'No account found matching this Google Email address. Please make sure you enter the email address used during registration.' 
      };
    }

    found.password = newPassword;
    if (newUsername && newUsername.trim().length > 0) {
      found.username = newUsername.trim();
    }
    if (!found.googleEmail) {
      found.googleEmail = googleEmailInput.trim();
    }

    this.currentUserId = found.id;
    setDoc(doc(db, 'users', found.id), found, { merge: true }).catch((err) => console.warn('Firestore resetPassword error:', err));
    this.notify();
    return { success: true, user: found, message: `Password reset successfully for @${found.username || found.name}! You are now logged in.` };
  }

  public isOwnerOfProperty(userId: string | undefined, propertyId: string): boolean {
    if (!userId) return false;
    const user = this.users.find((u) => u.id === userId);
    if (user && user.role === 'admin') return true;
    const prop = this.properties.find((p) => p.id === propertyId);
    if (!prop) return false;
    const firebaseUid = auth.currentUser?.uid;
    return (
      prop.ownerId === userId ||
      prop.ownerUid === userId ||
      (!!firebaseUid && (prop.ownerUid === firebaseUid || prop.ownerId === firebaseUid || prop.ownerId === `google_${firebaseUid}`))
    );
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

    const firebaseUid = auth.currentUser?.uid;
    const ownerUid = prop.ownerUid || firebaseUid || (prop.ownerId.startsWith('google_') ? prop.ownerId.replace('google_', '') : prop.ownerId);
    const ownerId = prop.ownerId || (firebaseUid ? `google_${firebaseUid}` : 'owner-demo');

    const newProp: Property = {
      ...prop,
      ownerId,
      ownerUid,
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

    // Write to Firestore
    setDoc(doc(db, 'properties', newProp.id), newProp).catch((err) => console.warn('Firestore addProperty error:', err));

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
      const currentUser = this.getCurrentUser();
      if (currentUser && !this.isOwnerOfProperty(currentUser.id, id)) {
        console.warn('Unauthorized property update blocked:', id);
        return;
      }
      this.properties[idx] = { ...this.properties[idx], ...updates };
      setDoc(doc(db, 'properties', id), this.properties[idx], { merge: true }).catch((err) => console.warn('Firestore updateProperty error:', err));
      this.notify();
    }
  }

  public togglePropertyStatus(id: string) {
    const prop = this.getPropertyById(id);
    if (prop) {
      prop.status = prop.status === 'active' ? 'blocked' : 'active';
      setDoc(doc(db, 'properties', id), { status: prop.status }, { merge: true }).catch((err) => console.warn('Firestore togglePropertyStatus error:', err));
      this.notify();
    }
  }

  public togglePropertyVerified(id: string, verified?: boolean) {
    const prop = this.getPropertyById(id);
    if (prop) {
      prop.isVerified = verified !== undefined ? verified : !prop.isVerified;
      setDoc(doc(db, 'properties', id), { isVerified: prop.isVerified }, { merge: true }).catch((err) => console.warn('Firestore togglePropertyVerified error:', err));
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
      setDoc(doc(db, 'properties', id), { isFeatured: prop.isFeatured }, { merge: true }).catch((err) => console.warn('Firestore togglePropertyFeatured error:', err));
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
    const currentUser = this.getCurrentUser();
    if (currentUser && !this.isOwnerOfProperty(currentUser.id, id)) {
      console.warn('Unauthorized property deletion blocked:', id);
      return;
    }
    this.properties = this.properties.filter((p) => p.id !== id);
    const deletedRooms = this.rooms.filter((r) => r.propertyId === id);
    this.rooms = this.rooms.filter((r) => r.propertyId !== id);
    
    deleteDoc(doc(db, 'properties', id)).catch((err) => console.warn('Firestore deleteProperty error:', err));
    deletedRooms.forEach((r) => deleteDoc(doc(db, 'rooms', r.id)).catch(() => {}));
    
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

    setDoc(doc(db, 'properties', propertyId), {
      subscriptionExpiresAt: prop.subscriptionExpiresAt,
      subscriptionExpiryDate: prop.subscriptionExpiryDate,
      status: prop.status
    }, { merge: true }).catch((err) => console.warn('Firestore renew error:', err));

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
    const prop = this.getPropertyById(room.propertyId);
    const firebaseUid = auth.currentUser?.uid;
    const ownerId = room.ownerId || prop?.ownerId || (firebaseUid ? `google_${firebaseUid}` : 'owner-demo');
    const ownerUid = room.ownerUid || prop?.ownerUid || firebaseUid || undefined;

    const newRoom: RoomType = {
      ...room,
      ownerId,
      ownerUid,
      id: 'room_' + Date.now(),
    };
    this.rooms.push(newRoom);
    setDoc(doc(db, 'rooms', newRoom.id), newRoom).catch((err) => console.warn('Firestore addRoom error:', err));
    this.notify();
    return newRoom;
  }

  public addRoomType(room: Omit<RoomType, 'id'>): RoomType {
    return this.addRoom(room);
  }

  public updateRoom(id: string, updates: Partial<RoomType>) {
    const idx = this.rooms.findIndex((r) => r.id === id);
    if (idx !== -1) {
      const room = this.rooms[idx];
      const currentUser = this.getCurrentUser();
      if (currentUser && !this.isOwnerOfProperty(currentUser.id, room.propertyId)) {
        console.warn('Unauthorized room update blocked:', id);
        return;
      }
      this.rooms[idx] = { ...this.rooms[idx], ...updates };
      setDoc(doc(db, 'rooms', id), this.rooms[idx], { merge: true }).catch((err) => console.warn('Firestore updateRoom error:', err));
      this.notify();
    }
  }

  public deleteRoom(id: string) {
    const room = this.rooms.find((r) => r.id === id);
    if (room) {
      const currentUser = this.getCurrentUser();
      if (currentUser && !this.isOwnerOfProperty(currentUser.id, room.propertyId)) {
        console.warn('Unauthorized room deletion blocked:', id);
        return;
      }
      this.rooms = this.rooms.filter((r) => r.id !== id);
      deleteDoc(doc(db, 'rooms', id)).catch((err) => console.warn('Firestore deleteRoom error:', err));
      this.notify();
    }
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
    setDoc(doc(db, 'enquiries', newEnquiry.id), newEnquiry).catch((err) => console.warn('Firestore addEnquiry error:', err));
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
