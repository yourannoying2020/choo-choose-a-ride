# Choo Chose A Ride v0.3

Adds the real application search architecture while using a safe mock provider until an authorised UK rail data provider is configured.

## Architecture
- `app/api/search/route.ts` — server-side search endpoint
- `lib/rail/types.ts` — provider-independent journey types
- `lib/rail/locations.ts` — location/station resolver
- `lib/rail/provider.ts` — provider switch
- `lib/rail/mock-provider.ts` — temporary provider

## Environment
Copy `.env.example` to local `.env.local` or configure variables in Vercel.

`RAIL_PROVIDER=mock` keeps the app functional without credentials.

When a real provider is selected, credentials belong in Vercel Environment Variables and are never exposed to the browser.
