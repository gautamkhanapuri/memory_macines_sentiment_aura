import React, { useEffect, useRef, useState } from 'react';
import './AudioWaveform.css';

function AudioWaveform({ isRecording, audioStream }) {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const rotationRef = useRef(0);
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        if (isRecording && audioStream) {
            // Fade in
            setOpacity(1);
        } else {
            // Fade out
            setOpacity(0);
        }
    }, [isRecording, audioStream]);

    useEffect(() => {
        if (!isRecording || !audioStream) {
            // Don't immediately stop - let fade out animation complete
            const timeout = setTimeout(() => {
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
                const canvas = canvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }, 800); // Match CSS transition duration

            return () => clearTimeout(timeout);
        }

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(audioStream);

        source.connect(analyser);
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.75;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const baseRadius = 220;
        const numLines = 128;

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(centerX, centerY);

            rotationRef.current += 0.003;
            ctx.rotate(rotationRef.current);

            const layers = [
                { radius: baseRadius * 0.7, color: 'rgba(100, 200, 255, 0.6)', thickness: 1.5 },
                { radius: baseRadius * 0.85, color: 'rgba(150, 100, 255, 0.5)', thickness: 1.3 },
                { radius: baseRadius * 1.0, color: 'rgba(200, 150, 255, 0.4)', thickness: 1.2 },
                { radius: baseRadius * 1.15, color: 'rgba(400, 50, 50, 0.3)', thickness: 1.0 }
            ];

            layers.forEach((layer, layerIndex) => {
                ctx.beginPath();
                ctx.strokeStyle = layer.color;
                ctx.lineWidth = layer.thickness;

                for (let i = 0; i < numLines; i++) {
                    const angle = (i / numLines) * Math.PI * 2;

                    const dataIndex = Math.floor((i / numLines) * bufferLength * 0.5);
                    const amplitude = dataArray[dataIndex] || 0;

                    const normalizedAmp = amplitude / 255;
                    const amplitudeScale = 30 + normalizedAmp * 60;

                    const radius = layer.radius + amplitudeScale + Math.sin(i * 0.5 + layerIndex) * 5;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }

                ctx.closePath();
                ctx.stroke();

                ctx.shadowBlur = 15;
                ctx.shadowColor = layer.color;
                ctx.stroke();
                ctx.shadowBlur = 0;
            });

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 0.5;

            for (let i = 0; i < numLines; i += 4) {
                const angle = (i / numLines) * Math.PI * 2;
                const dataIndex = Math.floor((i / numLines) * bufferLength * 0.5);
                const amplitude = dataArray[dataIndex] || 0;
                const normalizedAmp = amplitude / 255;
                const amplitudeScale = 30 + normalizedAmp * 60;

                const innerRadius = baseRadius * 0.7 + amplitudeScale;
                const innerX = Math.cos(angle) * innerRadius;
                const innerY = Math.sin(angle) * innerRadius;

                const outerRadius = baseRadius * 1.15 + amplitudeScale;
                const outerX = Math.cos(angle) * outerRadius;
                const outerY = Math.sin(angle) * outerRadius;

                ctx.beginPath();
                ctx.moveTo(innerX, innerY);
                ctx.lineTo(outerX, outerY);
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(0, 0, baseRadius * 0.5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();

            for (let i = 0; i < numLines; i += 8) {
                const angle = (i / numLines) * Math.PI * 2;
                const dataIndex = Math.floor((i / numLines) * bufferLength * 0.5);
                const amplitude = dataArray[dataIndex] || 0;

                if (amplitude > 180) {
                    const normalizedAmp = amplitude / 255;
                    const amplitudeScale = 30 + normalizedAmp * 60;
                    const radius = baseRadius + amplitudeScale;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.fill();
                }
            }

            ctx.restore();
        };

        draw();

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
            style={{ opacity: opacity }}
        />
    );
}

export default AudioWaveform;