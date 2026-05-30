# Trao: AI Travel Planner

Trao is a full-stack, production-grade web application that allows users to register, log in, and dynamically generate comprehensive day-by-day travel itineraries. Powered by Llama 3.3 via Groq in the backend and a modern Next.js client on the frontend, users can estimate trip budgets, receive hotel suggestions, modify itineraries dynamically, and check off custom AI-generated packing lists.

## Features

1.  **Secure Authentication & Isolation:** Dedicated JWT auth verification. User travel data is fully isolated in MongoDB, preventing access by other users.
2.  **Interactive Trip wizard:** A sleek, multi-step stepper wizard (Destination -> Days -> Budget -> Interests) to configure your getaway.
3.  **AI Itinerary & Hotel Planner:** Generates day-by-day sightseeing activities, cost estimates, and three curated hotel options (Budget, Mid-Range, Luxury).
4.  **Flexible Modification:** Users can manually delete activities, add custom events, or use AI prompts to rewrite individual days (e.g. *"make it more food-focused"*).
5.  **Smart Packing Assistant (Creative Feature):** Generates a custom checklist based on the destination's climate, trip duration, and selected interests. Progress is tracked via a dynamic progress bar and saved in real-time.
6.  **Weather Guide:** Displays localized weather summaries, average temperatures, and precipitation probabilities.

---

## Technical Stack

*   **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Zustand, TanStack Query, Framer Motion, Lucide icons.
*   **Backend:** Node.js, Express, TypeScript, Mongoose.
*   **AI Engine:** Llama-3.3-70b-versatile via Groq SDK (supporting structured JSON mode).
*   **Database:** MongoDB.

---

## Getting Started

### Prerequisites

Ensure you have **Node.js (v18+ recommended)** and **MongoDB** installed and running on your system.

### 1. Backend Setup

1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables. Copy `.env.example` to `.env` and fill in your keys:
    ```bash
    cp .env.example .env
    ```
    *Make sure to paste your `GROQ_API_KEY` in `.env`:*
    ```env
    PORT=5001
    MONGODB_URI=mongodb://localhost:27017/ai-travel-planner
    JWT_SECRET=supersecretjwttokenforaitravelplannerapp
    GROQ_API_KEY=your_groq_api_key_here
    ```
4.  Start the development backend:
    ```bash
    npm run dev
    ```
    The server will run on `http://localhost:5001`.

### 2. Frontend Setup

1.  Navigate to the `client` directory:
    ```bash
    cd ../client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
    The frontend will run on `http://localhost:3000`. Open your browser and navigate to it.

---

## Architectural Highlights

### 1. Strict Data Isolation
The `Trip` model enforces the inclusion of `userId`. All operations (getting trips, retrieving specific itinerary, editing items) verify resource ownership at the service layer:
```typescript
if (trip.userId.toString() !== req.user.id) {
  return res.status(403).json({ message: "Access denied." });
}
```

### 2. AI Structured Output & Fallbacks
Groq SDK's JSON mode is utilized to guarantee the response matches the application's Mongoose/TypeScript schema exactly:
```typescript
const chatCompletion = await groq.chat.completions.create({
  messages: [...],
  model: 'llama-3.3-70b-versatile',
  response_format: { type: 'json_object' }
});
```
*Resilience Fallback:* If no `GROQ_API_KEY` is configured in the environment, the backend runs in a local offline demo mode and returns a dynamically generated mock travel plan. If the key is present but a rate limit or service error occurs, the actual API limit error is securely propagated to the client to let the user know they need to wait or check credentials.
