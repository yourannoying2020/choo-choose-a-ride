# V0.7 — Free/Open Rail Data

Replace `app/api/search/route.ts` and add `lib/rail/darwin.ts`.

Add to Vercel:

`DARWIN_API_TOKEN` = your free National Rail Darwin token.

Optional:
`DARWIN_LDB_URL=https://lite.realtime.nationalrail.co.uk/OpenLDBWS/ldb12.asmx`

Register through the National Rail Data Portal/Rail Data Marketplace and subscribe to Darwin. National Rail currently describes Darwin feeds as openly available under its NRE OGL. The public LDB feed provides live departures/arrivals, predictions, delays, cancellations and platforms.

This version deliberately returns **no invented prices**: Darwin's free LDB feed does not provide ticket fares. It currently searches live/current direct services only. Future-date timetable search requires the separately registered timetable feed, which is the next step.

Remove the old OJP variables from Vercel:
`NATIONAL_RAIL_OJP_URL`
`NATIONAL_RAIL_USERNAME`
`NATIONAL_RAIL_PASSWORD`
