# Gaffer Desk

> The ultimate AI-powered companion app for FIFA & EA FC Career Mode.

Gaffer Desk is a full-stack football operations workstation designed to enhance your Career Mode saves. Track player growth, manage your squad depth, and get AI-driven tactical insights without manual data entry—just upload screenshots of your game and let the AI do the heavy lifting.

## Core Features

* **AI Vision Squad Importer:** Drop a screenshot of your FIFA Squad Hub or Team Management screen. The backend uses the Gemini Vision API to extract player names, Overall Ratings (OVR), and positions, staging them for quick database insertion.
* **Tactical Pitch Visualizer:** A dynamic CSS-grid-based pitch that maps your True Starting XI based on your chosen in-game formation, automatically handling positional overlaps.
* **Deep Scouting Dossiers:** Dedicated player profiles to track dynamic potential, historical OVR growth over multiple seasons, and contract/market value changes.
* **Automated AI Intelligence:** Context-aware tactical alerts generated dynamically for your squad (e.g., positional fatigue warnings, squad rotation suggestions, and depth chart vulnerabilities).

## Tech Stack

**Frontend:**
* React (Vite)
* Tailwind CSS
* Recharts (For attribute radars and OVR growth tracking)
* Lucide Icons

**Backend:**
* Node.js / Express
* MongoDB (Mongoose)
* Google Gemini API (Vision & Text)

## Local Development Setup

### Prerequisites
* Node.js (v18+)
* MongoDB instance (Local or Atlas)
* Gemini API Key

### 1. Clone & Install
```bash
git clone [https://github.com/yourusername/gaffer-desk.git](https://github.com/yourusername/gaffer-desk.git)
cd gaffer-desk

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
