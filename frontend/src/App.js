import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import AuraVisualization from './components/AuraVisualization';
import TranscriptDisplay from './components/TranscriptDisplay';
import KeywordsDisplay from './components/KeywordsDisplay';
import Controls from './components/Controls';
import axios from 'axios';

const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY; // Add this
const BACKEND_URL = 'http://localhost:8000';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [sentiment, setSentiment] = useState(0); // -1 to 1
  const [keywords, setKeywords] = useState([]);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);

  // Start recording and transcription
  const startRecording = async () => {
    try {
      setError(null);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Connect to Deepgram WebSocket
      const socket = new WebSocket('wss://api.deepgram.com/v1/listen', [
        'token',
        DEEPGRAM_API_KEY
      ]);

      socket.onopen = () => {
        console.log('Deepgram WebSocket connected');
        setIsRecording(true);

        // Set up MediaRecorder to send audio to Deepgram
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm'
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };

        mediaRecorder.start(250); // Send data every 250ms
        mediaRecorderRef.current = mediaRecorder;
      };

      socket.onmessage = async (message) => {
        const received = JSON.parse(message.data);
        const transcriptText = received.channel?.alternatives[0]?.transcript;

        if (transcriptText && transcriptText.trim().length > 0) {
          const isFinal = received.is_final;

          // Add to transcript display
          setTranscript(prev => [
            ...prev,
            { text: transcriptText, isFinal, timestamp: Date.now() }
          ]);

          // If final, send to backend for sentiment analysis
          if (isFinal && transcriptText.trim().length > 5) {
            try {
              const response = await axios.post(`${BACKEND_URL}/process_text`, {
                text: transcriptText
              });

              setSentiment(response.data.sentiment);
              setKeywords(prevKeywords => {
                // Add new keywords, keep last 10
                const newKeywords = response.data.keywords.map(kw => ({
                  text: kw,
                  id: Date.now() + Math.random()
                }));
                return [...prevKeywords, ...newKeywords].slice(-10);
              });
            } catch (err) {
              console.error('Backend error:', err);
              setError('Failed to analyze sentiment');
            }
          }
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Transcription connection error');
      };

      socket.onclose = () => {
        console.log('Deepgram WebSocket closed');
      };

      socketRef.current = socket;

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  return (
      <div className="App">
        {/* Background visualization */}
        <AuraVisualization sentiment={sentiment} keywords={keywords} />

        {/* Overlay UI */}
        <div className="overlay">
          <Controls
              isRecording={isRecording}
              onStart={startRecording}
              onStop={stopRecording}
          />

          {error && (
              <div className="error-message">
                {error}
              </div>
          )}

          <TranscriptDisplay transcript={transcript} />
          <KeywordsDisplay keywords={keywords} />
        </div>
      </div>
  );
}

export default App;