# Architecture & Coding Guidelines — Team Padua Portal

## Architectural Rules
1. **Server vs. Client Components:**
   - Keep page wrappers and layout components as React Server Components (RSC) where possible to leverage fast SSR and reduce client bundle size.
   - Mark interactive UI components (form fields, interactive tables, canvas signatures, modal dialogues) with `'use client'`.

2. **Supabase Client Usage:**
   - Never import `@src/lib/supabase/server` in client components (`'use client'`).
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code.
   - When creating new tables, ensure `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;` is executed and policies are defined for `authenticated` and `service_role`.

3. **Client Servicing Permissions & Route Guards:**
   - All client servicing routes must respect `isClientServicingRoute` and `routeToModuleKey` definitions in `@src/lib/permissions.ts`.
   - Remember that `Advisor` and `Admin` roles have automatic view/access rights.

4. **Document & PDF Processing:**
   - Use `pdf-lib` for AcroForm template background embedding and overlay.
   - Always sanitize string inputs with `.toUpperCase()`.
   - Implement date character centering inside segmented boxes (2 Day, 3 Month, 4 Year) using `drawDateInBoxes`.
   - Embed base64 signatures (`react-signature-canvas` & uploaded images) using `scaleToFit` centered inside the bounding box.
   - Form controls must provide full coverage for all fields on the PDF template and prioritize user-edited inputs over database values.

