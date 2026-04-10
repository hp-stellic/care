# Fathom Call Viewer (Next.js)

Simple Next.js app to verify Fathom API connectivity by:

- loading recent calls
- showing call title, date, and duration
- fetching and displaying a full transcript when a call is clicked

## Setup

1. Create a local env file:

```bash
cp .env.example .env.local
```

2. Add your Fathom API key to `.env.local`:

```env
FATHOM_API_KEY=your_real_key_here
```

3. Install dependencies and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API routes

- `GET /api/fathom/calls` -> fetches recent meetings from Fathom
- `GET /api/fathom/calls/:recordingId` -> fetches transcript for one recording

These server routes keep your API key on the server side and proxy data to the client UI.
