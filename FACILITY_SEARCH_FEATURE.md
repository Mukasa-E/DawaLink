# Facility Search Feature

## Overview
Added a comprehensive facility search feature that allows patients and all authenticated users to search for nearby clinics, pharmacies, hospitals, and health centers.

## Features Implemented

### 1. Backend API (Already Exists)
- **Endpoint**: `GET /api/facilities`
- **Query Parameters**:
  - `type`: Filter by facility type (hospital, clinic, pharmacy, health_center)
  - `city`: Filter by city
  - `verified`: Filter verified facilities only (true/false)
  - `search`: Search by name, address, or city
- **Authentication**: Public endpoint (no authentication required for basic search)

### 2. Frontend Components

#### New Files Created:
1. **`frontend/src/pages/SearchFacilities.tsx`**
   - Full-featured search page with filters
   - Real-time search by name, address, city
   - Filter by facility type (hospital, clinic, pharmacy, health center)
   - Filter by city (dynamically populated from results)
   - Verified-only filter checkbox
   - Beautiful card-based layout showing:
     - Facility name and type
     - Verification badge
     - Address and contact info (phone, email)
     - Operating hours
     - Services offered
     - Statistics (referrals, records)
   - Responsive design with grid layout
   - Loading states and empty states
   - Bilingual support (English/Swahili)

#### Updated Files:

2. **`frontend/src/types/index.ts`**
   - Added `FacilityType` type definition
   - Added `Facility` interface with all fields from backend schema

3. **`frontend/src/services/api.ts`**
   - Added `facilitiesAPI` object with methods:
     - `getAll(params)`: Search/filter facilities
     - `getById(id)`: Get specific facility details
     - `register(data)`: Register new facility
     - `update(id, data)`: Update facility
     - `getStats(id)`: Get facility statistics

4. **`frontend/src/App.tsx`**
   - Added route: `/facilities` → `<SearchFacilities />`
   - Available to all authenticated users

5. **`frontend/src/components/Layout.tsx`**
   - Added "Find Facilities" navigation link
   - Positioned prominently for all users (especially patients)
   - Uses `Building2` icon from Lucide React

6. **`frontend/src/i18n/locales/en.json`**
   - Added complete English translations for facility search feature
   - Includes all UI text, labels, placeholders, and messages

7. **`frontend/src/i18n/locales/sw.json`**
   - Added complete Swahili translations for facility search feature

## User Flow

### For Patients:
1. **Register/Login** → Patient creates account or logs in
2. **Dashboard** → Sees "Find Facilities" in navigation
3. **Search Facilities** → Can search/filter nearby clinics, pharmacies, hospitals
4. **View Details** → See facility information, contact details, services
5. **Contact Facility** → Click phone/email to reach facility directly

### Search Capabilities:
- **Text Search**: Search by facility name, address, or city
- **Type Filter**: Filter by Hospital, Clinic, Pharmacy, or Health Center
- **City Filter**: Select from available cities
- **Verification Filter**: Show only verified facilities
- **Combined Filters**: All filters work together

## UI Features

### Search Form:
- Search input with icon
- Facility type dropdown
- City dropdown (populated dynamically)
- Verified-only checkbox
- Search button

### Results Display:
- Grid layout (responsive: 1 column mobile, 2 tablet, 3 desktop)
- Each card shows:
  - Facility icon (color-coded by type)
  - Facility name
  - Verification badge (if verified)
  - Full address
  - Phone number (clickable to call)
  - Email (clickable to send email)
  - Operating hours
  - Services (first 3 with "more" indicator)
  - Statistics (referrals, records)
- Hover effects for better UX
- Dark mode support

### Empty States:
- No facilities found message
- Helpful suggestion to adjust filters

### Loading States:
- Spinner animation while loading
- Loading message

## Icons Used (Lucide React):
- `Search`: Search input
- `MapPin`: Address
- `Phone`: Phone number
- `Mail`: Email
- `Clock`: Operating hours
- `CheckCircle`: Verification badge
- `Building2`: Hospital/general facility
- `Heart`: Clinic/health center
- `Beaker`: Pharmacy

## Technical Details

### API Integration:
```typescript
// Get all facilities
const facilities = await facilitiesAPI.getAll();

// Search with filters
const results = await facilitiesAPI.getAll({
  search: 'Nairobi',
  type: 'clinic',
  verified: true
});
```

### Routing:
- **Path**: `/facilities`
- **Protection**: Requires authentication (any role)
- **Layout**: Uses main Layout component with navigation

### Translations:
All text is internationalized with fallbacks:
```typescript
t('facilities.search.title', 'Find Healthcare Facilities')
```

## Testing Checklist

- [x] TypeScript compilation (no errors)
- [ ] Frontend loads without errors
- [ ] Search by text works
- [ ] Filter by type works
- [ ] Filter by city works
- [ ] Verified filter works
- [ ] Combined filters work
- [ ] Navigation link appears
- [ ] Route is accessible
- [ ] Responsive on mobile
- [ ] Dark mode displays correctly
- [ ] Translations work (EN/SW)
- [ ] Click-to-call phone works
- [ ] Click-to-email works

## Next Steps (Optional Enhancements)

1. **Map View**: Add Google Maps/Leaflet integration to show facilities on a map
2. **Distance Calculation**: Show distance from user's location
3. **Geolocation**: Auto-detect user location and show nearest facilities
4. **Favorites**: Allow users to save favorite facilities
5. **Reviews/Ratings**: Add patient reviews and ratings
6. **Availability**: Show real-time availability/wait times
7. **Appointments**: Book appointments directly from search
8. **Photos**: Add facility photos/gallery
9. **Detailed Pages**: Create individual facility detail pages
10. **Compare**: Allow comparison of multiple facilities side-by-side

## Files Modified Summary

### Created (1):
- `frontend/src/pages/SearchFacilities.tsx` (364 lines)

### Updated (6):
- `frontend/src/types/index.ts` - Added Facility types
- `frontend/src/services/api.ts` - Added facilitiesAPI
- `frontend/src/App.tsx` - Added /facilities route
- `frontend/src/components/Layout.tsx` - Added navigation link
- `frontend/src/i18n/locales/en.json` - Added translations
- `frontend/src/i18n/locales/sw.json` - Added translations

## Dependencies
All dependencies already installed:
- `react-router-dom` - Routing
- `react-i18next` - Internationalization
- `lucide-react` - Icons
- `axios` - HTTP client
- `tailwindcss` - Styling

No new packages required! ✅
