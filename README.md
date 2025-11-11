# Sentiment Aura - Live AI-Powered Visualization

A full-stack web application that performs real-time audio transcription and visualizes 
emotional sentiment through generative art. Built for interview with Memory Machines AI.

Author: Gautam Ajey Khanapuri

Email: khanapuri.g@northeastern.edu

## Overview

This application captures audio input, transcribes it in real-time, analyzes sentiment using AI, 
and displays the results through a dynamic Perlin noise visualization that responds to the 
emotional tone of speech. Use the version present in `blob` branch (best version version with UI 
polish). 
```bash
git switch blob
```

## Tech Stack

### Frontend
- React
- p5.js for Perlin noise visualization
- Web Audio API for microphone access
- WebSocket for real-time transcription
- Axios for HTTP requests

### Backend
- FastAPI (Python)
- HTTPX for async API calls
- CORS middleware for cross-origin requests

### External APIs
- Deepgram - Real-time speech-to-text transcription
- Groq (Llama 3.3 70B) - Sentiment analysis and keyword extraction

### Version Control
- Git, GitHub
- Branching
- Tagging

## How to run:

### Prerequisites
- Python 3.8 or higher
- Node.js 14 or higher
- Deepgram API key
- Groq API key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv auravenv
source auravenv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory:
```
GROQ_API_KEY=copy_paste_your_groq_api_key_here
```

5. Run the backend server:
```bash
python main.py
```

The backend will run on http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```
REACT_APP_DEEPGRAM_API_KEY=copy_paste_your_deepgram_api_key_here
```

4. Start the development server:
```bash
npm start
```

The application will open at http://localhost:3000

## Usage

1. Ensure both backend and frontend servers are running
2. Open http://localhost:3000 in your browser but it opens on its own when you start the 
   frontend server.
3. Click "Start Recording" and allow microphone access
4. Speak normally - the application will:
    - Transcribe your speech in real-time
    - Analyze sentiment and extract keywords
    - Update the background visualization based on emotional tone

## Key Features

### Real-Time Transcription
Live speech-to-text using Deepgram's WebSocket API with automatic scrolling and sentence capitalization.

### Sentiment Analysis
Backend processes transcribed text through Groq's LLM to extract:
- Sentiment score ranging from -1 (negative) to 1 (positive)
- Key topics and emotional keywords

### Dynamic Visualization
Perlin noise field with 500 particles that respond to sentiment:
- Color: Blue/purple for negative, green/teal for neutral, orange/yellow for positive
- Motion: Intensity and speed increase with stronger emotional content. Particle count, hue and 
  speed adjusted for visual serenity.
- Smooth transitions between emotional states
- Smooth fade in and fade out of audio waveform.

### UI Polish
- Semi-transparent panels with glassmorphism effect
- Typewriter effect for transcript display
- Staggered fade-in animation for keywords
- Keywords highlighted with sentiment appropriate hues and border colors.
- Audio feedback on button clicks
- Automatic scrolling for long transcripts and keyword lists
- Radial audio visualizer added for UI polish and better user experience and engagement

## Architecture

The application follows a three-tier architecture:

1. Frontend captures audio and manages the UI
2. Backend acts as a secure proxy for LLM API calls
3. External APIs handle transcription and sentiment analysis

Data flows from microphone through Deepgram WebSocket, displays as transcript, sends to backend for analysis, receives sentiment data, and updates visualization in real-time.

## Error Handling

- Microphone permission errors with user-friendly messages
- WebSocket reconnection logic for transcription failures
- Graceful handling of Backend failures such as not reachable, timeout or error response.
- Backend timeout handling for slow API responses
- Graceful degradation if sentiment analysis fails
- Health check of all APIs at the time of recording with appropriate notification to the user.

## Observations

- Backend responds within 1-2 seconds for sentiment analysis
- Real-time transcription with minimal latency

## Future Enhancements

Potential improvements I can think of include:
- Export transcript functionality