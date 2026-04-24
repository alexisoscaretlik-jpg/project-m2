// DEV-ONLY auth bypass for /tax.
//
// When NODE_ENV === 'development' and no real authenticated user is
// present, /tax pages and actions fall back to this hardcoded user.
// Lets us test the full flow without fighting magic-link rate limits,
// Resend sandbox restrictions, or Supabase Auth bugs.
//
// Critically: NEXT_PUBLIC vars are NOT set here — this module is
// server-only. Turbopack/Vercel always build with NODE_ENV=production
// for deployed code, so this bypass literally cannot trigger in prod.

// parisbrugemons@gmail.com — already has profiles.tier='plus'
export const DEV_USER_ID = "148e7474-8e13-4a62-8f0d-f06cc1b3697a";
export const DEV_USER_EMAIL = "parisbrugemons@gmail.com";

export const IS_DEV = process.env.NODE_ENV === "development";
