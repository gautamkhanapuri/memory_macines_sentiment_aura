import React, { useEffect, useRef } from 'react';
import './AudioWaveform.css';

function AudioWaveform({ isRecording, audioStream }) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);

    useEffect(() => {
        if (!isRecording || !audioStream) {
            // Stop animation when not recording
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            // Clear canvas
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }

        // Set up audio analysis
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(audioStream);

        source.connect(analyser);
        analyser.fftSize = 2048;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            // Clear canvas with transparency
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw waveform
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // Semi-transparent white
            ctx.beginPath();

            const sliceWidth = canvas.width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0; // Normalize to 0-2
                const y = (v * canvas.height) / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            ctx.stroke();
        };

        draw();

        // Handle window resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (audioContext.state !== 'closed') {
                audioContext.close();
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [isRecording, audioStream]);

    return (
        <canvas
            ref={canvasRef}
            className="audio-waveform"
        />
    );
}

export default AudioWaveform;