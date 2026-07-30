# 🏡 THIKANA ( ठिकाना ) — Zero-Commission WhatsApp-First Homestay & Hotel Marketplace

> **Empowering Regional Hosts & Travelers across Northeast India with Direct Bookings, Zero Middleman Fees, and AI-Powered Local Intelligence.**

---

## 🔗 Live Links & Demo

* 🌐 **Live Website:** [https://mythikana.vercel.app/](https://mythikana.vercel.app/)
* 💻 **GitHub Repository:** [https://github.com/anupamsarma/thikana-marketplace](https://github.com/anupamsarma/thikana-marketplace)

---

## 🌟 Executive Overview & Pitch

Traditional hotel aggregation platforms charge independent homestays and boutique hotel owners high commission fees (ranging from **18% to 30%**), while restricting direct guest-host communication and forcing complex payment gateway settlements. 

**THIKANA** disrupts this model by providing a **0% Commission, WhatsApp-First Marketplace** tailored for Northeast India (Assam, Meghalaya, Arunachal Pradesh, Nagaland, and beyond). Guests connect directly with verified property hosts via pre-filled, instant WhatsApp booking enquiries, while property owners retain 100% of their revenue and manage listings effortlessly.

---

## 🏗️ Technical Architecture & Stack

THIKANA is engineered as a modern, high-performance full-stack web application built on Node.js, Express, React 19, and Google Cloud Infrastructure.

### 🔄 End-to-End Booking Flow Diagram

```
┌───────────┐        ┌──────────────────┐        ┌───────────────────┐        ┌────────────────────┐        ┌──────────┐
│  Customer │ ───►   │ THIKANA Platform │ ───►   │ Firebase Backend  │ ───►   │ WhatsApp Gateway   │ ───►   │   Host   │
│ (Guest)   │        │ (React 19 + AI)  │        │ (Auth & Database) │        │ (Direct API Link)  │        │ (Owner)  │
└───────────┘        └──────────────────┘        └───────────────────┘        └────────────────────┘        └──────────┘
```

### ⚡ Technical Components

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 THIKANA Web Application                 │
                  │             (React 19 + Vite + Tailwind v4)             │
                  └───────────┬───────────────────────────────┬─────────────┘
                              │                               │
                              ▼                               ▼
               ┌─────────────────────────────┐  ┌─────────────────────────────┐
               │    Firebase Infrastructure  │  ┌  Express Node Backend       │
               ├─────────────────────────────┤  │  (server.ts)                │
               │ • Firestore Realtime Sync   │  ├─────────────────────────────┤
               │ • Firebase Auth             │  │ • Google GenAI (Gemini 2.5) │
               │ • Google OAuth Popup        │  │ • Server-Side API Proxies   │
               └─────────────────────────────┘  └─────────────────────────────┘
```

### ⚡ Core Tech Stack
* **Frontend Runtime:** React 19, Vite 6, TypeScript 5.8
* **Styling & UI:** Tailwind CSS v4, Lucide React Icons, Motion (Framer Motion API)
* **Backend Framework:** Express.js (Node.js CJS/ESM runtime bundled via `esbuild`)
* **Database & Realtime Persistence:** Google Cloud Firestore (Firebase Web SDK v12) with offline fallback & live subscription hooks
* **Authentication:** Firebase Auth (Google OAuth 2.0 Popup & Mobile OTP / Password Login)
* **AI Capabilities:** `@google/genai` (Google Gemini 2.5 Flash API for regional travel itinerary planning)

---

## 🚀 Key Functional Features & Modules

### 1. 📲 WhatsApp Direct Booking Engine (`WhatsAppEnquiryModal.tsx`)
* Generates structured, pre-formatted WhatsApp messages containing guest details, check-in/out dates, guest counts, room selections, and estimated totals directly to the host's WhatsApp number.
* Eliminates middleman commission fees while maintaining instant, personal guest-host communication.

### 2. 🏨 Multi-Role Owner & Admin Portal (`OwnerDashboardView.tsx`)
* **Property Upload & Management:** Instant property listing with client-side validation, multi-photo file upload, custom presets (e.g. *Assam Stilt*, *Mountain View*, *Tea Cottage*), GPS location coordinates, and room inventory manager.
* **Direct Revenue Tracking:** Live booking enquiry logs, subscription status management, and performance metrics.
* **Role-Based Access Control (RBAC):** Strict isolation between Guests (`guest`), Property Owners (`owner`), Banner Advertisers (`advertiser`), and Platform Admins (`admin`).

### 3. 🤖 AI Regional Travel Concierge (`AIAssistantModal.tsx`)
* Powered by server-side **Google Gemini 2.5 Flash**.
* Generates personalized itineraries, cultural etiquette tips, hidden local spots, and culinary suggestions across Assam and Northeast tourist hubs (Guwahati, Kaziranga, Shillong, Tawang, Majuli, Tezpur, etc.).

### 4. 📢 Hyper-Local Banner Advertising Network (`BannerSlider.tsx`)
* Allows regional tour operators, car rentals, and handicraft brands to promote their services alongside property listings with tracked click-through rates and impression analytics.

### 5. 🗺️ Interactive Google Maps Location Finder (`MapLocationView.tsx`)
* Live embedded view with custom pin markers, direct directions link, and distance indicators.

---

## 🗺️ Product Roadmap

- [x] **MVP Release** — Zero-commission listing, WhatsApp booking engine, and multi-role dashboard
- [ ] **Real Host Onboarding** — Target 100+ verified homestays across Assam, Meghalaya & Northeast
- [ ] **Online Payments Integration** — Direct UPI & QR instant deposit settlement options
- [ ] **Advanced AI Trip Planner** — Multi-day route mapping with Gemini 2.5 Flash integration
- [ ] **Native Mobile Application** — iOS & Android companion app for property owners

---

## 📁 Repository Directory Structure

```
thikana-marketplace/
├── assets/                    # Static branding & graphics
├── public/                    # Production static assets
│   ├── robots.txt             # SEO crawler directives
│   └── sitemap.xml            # Search index XML schema
├── src/
│   ├── components/            # Reusable UI Components
│   │   ├── AIAssistantModal.tsx       # Gemini AI Itinerary Assistant
│   │   ├── AuthModal.tsx              # Google OAuth & Mobile Auth Dialog
│   │   ├── BannerSlider.tsx           # Promotional Banner Carousel
│   │   ├── Footer.tsx                 # Site Footer with City Directory
│   │   ├── MapLocationView.tsx        # Interactive Map & GPS Embed
│   │   ├── Navbar.tsx                 # Navigation Bar & Role Switcher
│   │   ├── PropertyCard.tsx           # Listing Cards with Pricing Badge
│   │   ├── PropertyGalleryModal.tsx   # Full-screen Photo Lightbox
│   │   └── WhatsAppEnquiryModal.tsx   # WhatsApp Booking Flow
│   ├── data/
│   │   └── initialData.ts     # Seed Data for regional stays & banners
│   ├── lib/
│   │   └── firebase.ts        # Firebase Auth & Firestore Client Setup
│   ├── services/
│   │   └── store.ts           # Unified State Manager with Firestore Sync
│   ├── views/
│   │   ├── PropertyDetailsView.tsx    # Property Page & Room Selection
│   │   ├── OwnerDashboardView.tsx     # Host Dashboard & Property Uploader
│   │   ├── AdminDashboardView.tsx     # Admin Control & Property Approvals
│   │   └── AdvertiserDashboardView.tsx# Banner Campaign Manager
│   ├── App.tsx                # Main App Shell & Navigation Dispatcher
│   ├── main.tsx               # Client Hydration Entry Point
│   ├── index.css              # Global Tailwind CSS Imports
│   └── types.ts               # Global TypeScript Interfaces
├── firebase-blueprint.json    # Firestore Schema Definition Blueprint
├── firestore.rules            # Production Firestore Security Rules
├── metadata.json              # Platform Metadata & Major Capabilities
├── package.json               # NPM Dependencies & Build Scripts
├── server.ts                  # Express Production Server & Gemini Proxies
├── tsconfig.json              # TypeScript Strict Compiler Settings
└── vite.config.ts             # Vite Bundler & Tailwind v4 Config
```

---

## 🔐 Security & Data Integrity

* **Firestore Security Rules (`firestore.rules`):** All user document writes are constrained to authenticated users matching their respective `UID`. Property creation & modification require authenticated host role, preventing administrative privilege escalation.
* **Server-Side API Key Concealment:** Gemini API keys (`GEMINI_API_KEY`) are kept exclusively inside server environment variables (`process.env.GEMINI_API_KEY`) and proxied through `/api/*` endpoints to prevent client-side credential exposure.

---

## 🛠️ Local Development & Setup

### Prerequisites
* Node.js v18.0 or higher
* npm or bun package manager

### Installation Steps

1. **Clone Repository & Install Dependencies:**
   ```bash
   git clone https://github.com/anupamsarma/thikana-marketplace.git
   cd thikana-marketplace
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file based on `.env.example`:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

4. **Production Build & Execution:**
   ```bash
   npm run build
   npm start
   ```

---

## 📊 Startup Validation & Growth Metrics

| Metric | Target / Benchmark |
| :--- | :--- |
| **Commission Rate** | **0%** (SaaS subscription model for featured host listings) |
| **Booking Friction** | < 15 seconds to send structured WhatsApp booking enquiry |
| **Primary Markets** | Guwahati, Shillong, Kaziranga, Tawang, Jorhat, Majuli, Tezpur |
| **Target Host Onboarding** | 100+ verified regional homestays & tea resorts |

---

## 🔒 Copyright & Rights

© 2026 Anupam Sarma. All Rights Reserved.

This repository is shared only for demonstration and evaluation purposes. No part of this source code may be copied, redistributed, modified, or used commercially without written permission from the author.

