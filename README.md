Vendor Ledger Journal

A conversational bookkeeping and compliance companion for the world's informal economy, built for the Personal Gemini Journal Ideathon.

Why this exists

Across the world, hundreds of millions of street vendors, market traders, and small informal businesses run real businesses without any formal bookkeeping. They're not lazy or careless about it, the tools were just never built for them. Spreadsheets and accounting software assume a level of literacy, structure, and comfort with forms that most vendors don't have or don't have time for while running a cart or a stall all day.

This creates a real, compounding problem. Without records, a vendor can't prove their income to a bank for a loan. They can't show a landlord they're stable. Often they don't even know whether they fall under any tax obligation in their own country, and that uncertainty makes many of them avoid engaging with any formal system at all, even when doing so could genuinely help and protect them.

The core idea behind this app is simple: if someone can already talk about their day, they can log their day. Bookkeeping doesn't need a form or a spreadsheet, it just needs a conversation.

What it does

Vendor Ledger Journal is an authenticated web app where a vendor talks to Gemini about their day, either by typing or by speaking through voice input, whichever feels more natural to them. What did you sell, how much did you make, what did you spend. Gemini asks one plain question at a time, pulls out the numbers, and saves a clean structured entry to the vendor's own private ledger in Firestore. No spreadsheets, no manual entry, no financial jargon.

Over time this builds into a real financial history. The app can then show the vendor a summary of their earnings and expenses over any period, along with a plain-language explanation of where they likely stand on tax and compliance, generated specifically for whatever country and region the vendor has told it they operate in. It isn't built around one fixed country's rules. A vendor in Kerala gets an analysis grounded in Indian and Kerala-specific thresholds like GST registration limits and Section 44AD presumptive taxation, while a vendor in a different country would get an analysis grounded in that country's own rules instead. This isn't legal advice, it always points the vendor toward a real accountant or local authority for anything specific, but it gives them a starting point they've never had before, in language they can actually understand.

Multi-language by design

Because the people this app is built for speak every language in the world, not just English, the entire experience adapts to whatever language the vendor selects at the very start. The sign-in screen, the navigation, the conversation with Gemini, the ledger summary, and the compliance analysis are all generated in the vendor's own language rather than being a fixed English app with a translated label pasted on top. Whether the vendor types or speaks, both work in their selected language. Today the app has full support for English, Malayalam, Hindi, Spanish, Tamil, Swahili, and French, and the underlying translation architecture is built to extend to any language Gemini can generate in.

Built to keep working

Since this app depends on a live AI model for its core conversation, it's built with a resilient fallback chain so a temporary outage or rate limit doesn't leave the vendor stuck mid-conversation. If the primary model is unavailable, the app automatically continues the conversation through a backup path so the vendor's day still gets logged without interruption.

Core requirements implemented

User authentication through Firebase, using Google sign-in. No passwords for the vendor to remember or manage.

Real multi-turn conversation with the Gemini API to log each day's ledger entry, supporting both typed and spoken input.

Isolated, per-user data storage in Cloud Firestore. Every vendor's entries live under their own user ID, and Firestore security rules enforce that no user can ever read or write another user's data. This is verified, not assumed, see the security section below.

Secure key management, with API keys stored in Google Cloud Secret Manager and never exposed to the browser or client-side code.

Original feature: Ledger Summary and Compliance Orientation

On request, the app aggregates a vendor's own Firestore entries into a clean financial summary: total sales, total expenses, net profit, operating margin, daily averages, and a trend chart over any period they choose, thirty days, ninety days, a full year, or all time.

Alongside that summary, Gemini generates a plain-language compliance orientation specific to the vendor's own country and region, covering things like local tax registration thresholds, presumptive taxation eligibility for small traders, and basic record-keeping standards a vendor should maintain. The analysis is grounded in the vendor's actual logged numbers, not generic advice, and always closes with a clear, specific reminder of exactly what to confirm with a real accountant or local authority. This summary view is designed so a vendor could genuinely show it to a bank, a landlord, or an official as informal proof of their earnings history, something they've likely never had a way to produce before.

Tech stack

Frontend built with React and TypeScript, styled with Tailwind CSS.

Backend built with Node.js and Express, deployed on Cloud Run.

Authentication through Firebase Auth.

Database through Cloud Firestore.

AI conversation and analysis powered by the Gemini API, with support for both text and voice input through the Web Speech API.

Secrets managed through Google Cloud Secret Manager.

Firestore data model

Each ledger entry is stored under ledgerEntries/{entryId} with the vendor's user ID, the date, total sales, total expenses, net amount, notes captured from the conversation, and a timestamp of when it was created.

json
{
  "userId": "firebase_auth_uid",
  "date": "2026-08-15",
  "totalSales": 1200,
  "totalExpenses": 450,
  "netAmount": 750,
  "notes": "Sold vegetables, extra rain reduced footfall",
  "createdAt": "2026-08-15T18:30:00Z"
}

Security

See firestore.rules in this repository for the exact rules enforcing per-user data isolation. Every read and write is scoped strictly to the authenticated user's own ID, verified against request.auth.uid, and every other document path is denied by default. No vendor's data is ever readable by another vendor, and this is enforced at the database level, not just in the application code.

Deployment

Deployed on Google Cloud Run at:
https://vendor-ledger-journal-1095762456787.us-west1.run.app

Cloud Run service label: dev-tutorial=cloud-run-ai-challenge
