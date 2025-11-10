import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import AuraVisualization from './components/AuraVisualization';
import AudioWaveform from './components/AudioWaveform';
import TranscriptDisplay from './components/TranscriptDisplay';
import KeywordsDisplay from './components/KeywordsDisplay';
import Controls from './components/Controls';
import axios from 'axios';

const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY || 'TEMP_KEY';
const BACKEND_URL = 'http://localhost:8000';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [sentiment, setSentiment] = useState(0);
  const [keywords, setKeywords] = useState([]);
  const [error, setError] = useState(null);
  const [audioStream, setAudioStream] = useState(null); // NEW: for waveform

  const mediaRecorderRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setAudioStream(stream); // NEW: pass to waveform

      const socket = new WebSocket('wss://api.deepgram.com/v1/listen', [
        'token',
        DEEPGRAM_API_KEY
      ]);

      socket.onopen = () => {
        console.log('Deepgram connected');
        setIsRecording(true);

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm'
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };

        mediaRecorder.start(250);
        mediaRecorderRef.current = mediaRecorder;
      };

      socket.onmessage = async (message) => {
        const received = JSON.parse(message.data);
        const transcriptText = received.channel?.alternatives[0]?.transcript;

        if (transcriptText && transcriptText.trim().length > 0) {
          const isFinal = received.is_final;

          setTranscript(prev => [
            ...prev,
            { text: transcriptText, isFinal, timestamp: Date.now() }
          ]);

          if (isFinal && transcriptText.trim().length > 5) {
            try {
              const response = await axios.post(`${BACKEND_URL}/process_text`, {
                text: transcriptText
              });

              setSentiment(response.data.sentiment);
              setKeywords(prevKeywords => {
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

      socketRef.current = socket;

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone');
    }
  };

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
    setAudioStream(null); // NEW: clear audio stream
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  return (
      <div className="App">
        <AuraVisualization sentiment={sentiment} keywords={keywords} />
        <AudioWaveform isRecording={isRecording} audioStream={audioStream} />

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