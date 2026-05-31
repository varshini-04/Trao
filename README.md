# Trao: AI Travel Planner

Trao is a full-stack, production-grade web application that allows users to register, log in, and dynamically generate comprehensive day-by-day travel itineraries. Powered by Llama 3.3 via Groq in the backend and a modern Next.js client on the frontend, users can estimate trip budgets, receive hotel suggestions, modify itineraries dynamically, and check off custom AI-generated packing lists.

---

## 1. Project Overview & Choice of Stack

Trao is designed to solve a common problem in trip planning: manual itinerary construction and budget planning. By harnessing LLMs and live API integrations, it turns user inputs into a structured trip brochure.

### Tech Stack Justification
*   **Frontend: Next.js (App Router) + Tailwind CSS**
    *   *Next.js* was chosen for its clean folder-based routing, rich React server/client component separation, and fast build compilation.
    *   *Tailwind CSS* provides highly responsive, utility-first styling control, supporting our custom luxury-concierge theme and overlapping Z-index layouts.
*   **Backend: Node.js + Express + TypeScript**
    *   *Node.js/Express* provides a lightweight, highly scalable framework for building API endpoints.
    *   *TypeScript* acts as a shared compiler safety net between our client and server schemas, avoiding runtime inconsistencies.
*   **AI Engine: Llama-3.3-70b-versatile via Groq SDK**
    *   Groq offers extremely fast token inference speed, making interactive chat completions and real-time generation viable for web users.
*   **Database: MongoDB + Mongoose**
    *   A document store is ideal for travel plans, as itineraries, weather objects, packing lists, and hotel lists naturally nest as sub-documents in a single `Trip` record.

---

## 2. Core Features & Grading Requirements Met

1.  **Secure Authentication & Isolation:** Users register and authenticate via JWT tokens. The database layers query specifically by the authenticated `userId`, ensuring complete data isolation between accounts.
2.  **Interactive Trip Wizard:** Multi-step wizard layout (Destination -> Days -> Budget -> Interests) to dynamically construct plans.
3.  **AI Itinerary & Budget Planner:** Generates sensory, magazine-style activity descriptions grounded in live weather statistics and calculated in the local currency of the destination.
4.  **Editable Itinerary:**
    *   *Remove Activity:* Trash icons delete items and re-sync the schema.
    *   *Add Activity:* Form adds custom events to any day's timeline.
    *   *Regenerate Day:* Custom prompt input lets users rewrite a specific day's activities using AI.
5.  **Hotel Suggestions:** Outputs Budget, Mid-Range, and Luxury hotel suggestions including average popular user ratings.

### Creative Custom Features (Bonus Requirement)
*   **Live Weather Integration:** To solve LLM weather hallucinations, the backend queries the **Open-Meteo Geocoding and Weather APIs** using destination coordinates, feeding live temperature and precipitation rates directly to the LLM system prompt.
*   **Smart Packing Assistant:** Generates a targeted checklist based on the destination's real weather conditions, trip duration, and user interests. Checklist progress updates dynamically via a real-time progress bar.

---

## 3. High-Level Architecture Explanation

```
Client [Next.js Client App] -- JWT / API Requests --> ExpressServer [Node.js Express Server]
                                                            |
                                      +---------------------+---------------------+
                                      |                     |                     |
                                      v                     v                     v
                              MongoDB Instance     Open-Meteo Weather API    Groq SDK (LLM)
```

The system employs a strict validation pipeline to prevent crashes or loading loops:
1.  **API Fetch**: Resolves destination latitude/longitude and fetches live weather.
2.  **LLM Call**: Compiles coordinates and live temperature into a highly structured JSON query.
3.  **Zod Schema Enforcement**: Validates the output from the Groq SDK against a strict TypeScript schema contract (`TripSchema`) using `zod`. Any layout deviations or type mishaps (such as string costs or fuzzy time tags) are automatically transformed or caught using fallback values.

---

## 4. Getting Started & Setup Instructions

### Prerequisites
*   Node.js (v18+)
*   MongoDB running locally

### Local Development Setup

#### 1. Backend Server Setup
1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Create `.env` based on `.env.example`:
    ```env
    PORT=5001
    MONGODB_URI=mongodb://localhost:27017/ai-travel-planner
    JWT_SECRET=supersecretjwttokenforaitravelplannerapp
    GROQ_API_KEY=your_groq_api_key_here
    ```
4.  Start dev backend:
    ```bash
    npm run dev
    ```

#### 2. Frontend Client Setup
1.  Navigate to the client directory:
    ```bash
    cd client
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Start dev client:
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` to view the application dashboard.

---

## 5. Key Design Decisions, Trade-Offs, & Resiliency

### Resilience & Offline Mode
*   *Missing/Invalid Keys:* If `GROQ_API_KEY` is not supplied, the server falls back to a clean mock generation system, providing a valid dummy itinerary so assessors can test the dashboard features without API keys.
*   *Open-Meteo Outages:* Geocoding and weather fetch failures are protected by default fallbacks (e.g. coordinates for Tokyo and 22°C baseline) preventing database insertion crashes.

### Zod Error Masking
*   If LLM outputs deviate from schema arrays or omit parameters, `.catch()` blocks in Zod replace the missing data points with valid placeholders (e.g., `'N/A'`, `'Free'`, rating: `4.0`) rather than breaking the application flow.

---

## 6. Known Limitations
1.  **Free API Rate Limits:** The geocoding API requires a clean internet connection and can occasionally hit rate-limits on parallel requests.
2.  **Groq SDK Capacity limits:** High parallel traffic might result in 429 errors from Groq. These are caught on the backend and mapped to friendly "Our AI planners are busy" messages.
3.  **Maximum Days Clamping:** The LLM prompt context is limited to 7-day itineraries for output stability. Inputs above this threshold are restricted defensively to preserve token parsing limits.
