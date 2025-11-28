# Dynamic Facilities Update

## Summary
Removed hardcoded major hospitals and updated the system to use dynamically registered facilities from the database.

## Changes Made

### 1. CreateReferral.tsx
- **Removed**: Hardcoded `KENYAN_FACILITIES` array with 25 major hospitals
- **Added**: Dynamic facility fetching from database using `facilitiesAPI.getAll()`
- **Updated**: Facility dropdown now shows registered facilities with format: `{name} - {city}`
- **Added**: Loading state indicator when facilities are being fetched

### 2. Register.tsx
- **Removed**: Import of hardcoded `KENYAN_FACILITIES` from CreateReferral
- **Added**: Dynamic facility fetching from database
- **Updated**: Two dropdowns now use dynamic facilities:
  - Patient preferred facility selection
  - Healthcare provider facility selection
- **Added**: Loading indicators for both dropdowns

### 3. Dashboard.tsx
- **No changes needed**: Already uses dynamic `preferredFacility` from user object

## Benefits

1. **Scalability**: New facilities can be added through registration without code changes
2. **Accuracy**: Facility list always reflects current database state
3. **Flexibility**: Supports facilities in any location, not just major cities
4. **Maintainability**: No need to update hardcoded lists when facilities change

## How It Works

1. **On Mount**: Components fetch all registered facilities from `/api/facilities`
2. **Display**: Facilities shown in dropdowns with format `{Facility Name} - {City}`
3. **Selection**: User selects from currently registered facilities only
4. **Storage**: Selected facility name stored in user profile or referral record

## API Endpoint Used

```typescript
facilitiesAPI.getAll(): Promise<Facility[]>
```

Returns all registered facilities with fields:
- `id`: Unique identifier
- `name`: Facility name
- `city`: Location city
- `type`: Facility type (hospital, clinic, etc.)
- `isVerified`: Verification status

## User Experience

- **Patients**: Can select their preferred/trusted facility from registered options
- **Providers**: Can work with any registered facility in the system
- **Referrals**: Can be sent to any registered facility dynamically

## Next Steps (Optional)

Consider adding:
- Facility search/filter in dropdowns for large lists
- Facility verification status indicator
- Nearest facilities based on patient location
- Facility specialization filtering
