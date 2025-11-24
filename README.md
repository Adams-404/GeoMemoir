# GeoMemoir 🌍📍

**GeoMemoir** is a real-time location tracking application that allows users to drop persistent, AI-enhanced notes at their current coordinates. Designed for travelers and explorers, it serves as a digital diary that maps your memories to the physical world.

## ✨ Features

*   **Real-Time Tracking**: High-accuracy GPS tracking with a "Follow Me" driving mode that updates your heading and speed in real-time.
*   **Interactive Maps**: Switch seamlessly between **Street View** (CartoDB) and **Satellite Hybrid View** (Esri + OpenStreetMap Labels).
*   **Digital Pinning**: Drop pins at your current location or any specific point on the map to leave a note.
*   **AI Inspiration**: Powered by **Google Gemini**, the app can generate poetic, cryptic, or interesting 15-word notes based on your exact coordinates if you're stuck for words.
*   **Global Search**: Integrated with OpenStreetMap (Nominatim) to search for cities, shops, and landmarks worldwide.
*   **Memory Search**: Instantly filter your dropped pins by message content.
*   **Offline First**: Pins are persisted locally using `localStorage`, keeping your memories safe on your device.

## 🛠️ Tech Stack

*   **Frontend Framework**: React 19 (TypeScript)
*   **Styling**: Tailwind CSS
*   **Maps**: Leaflet & React-Leaflet
*   **AI**: Google Gemini API (`@google/genai`)
*   **Geocoding**: OpenStreetMap Nominatim API
*   **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

*   Node.js and npm installed.
*   A valid Google Gemini API Key.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/geomemoir.git
    cd geomemoir
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Ensure your environment has the `API_KEY` variable set for the Google Gemini API.
    *(Note: In the current build, this is expected via `process.env.API_KEY`)*.

4.  **Run the App**
    ```bash
    npm start
    ```

## 📱 Usage Guide

1.  **Grant Permissions**: On first load, allow the browser to access your location for the tracking features to work.
2.  **Drop a Pin**: Click the **+** button to pin your current location, or tap anywhere on the map.
3.  **Use AI**: Inside the pin modal, click "AI Inspiration" to let Gemini write a note for you.
4.  **Drive Mode**: Click the navigation arrow icon to toggle "Follow Me" mode. The map will automatically center and rotate based on your movement.
5.  **Search**: Use the top bar to find existing memories or search for new places to visit.

## 📄 License

This project is open-source and available for personal use.

---
*Built with ❤️ using React and Gemini*
