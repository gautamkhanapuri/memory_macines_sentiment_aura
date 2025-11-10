import React, { useEffect, useRef, useState } from 'react';
import './TranscriptDisplay.css';

function TranscriptDisplay({ transcript }) {
    const scrollRef = useRef(null);
    const [displayedText, setDisplayedText] = useState('');
    const [targetText, setTargetText] = useState('');

    // Capitalize first letter
    const capitalize = (text) => {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1);
    };

    // Build target text from transcript
    useEffect(() => {
        const finalTranscripts = transcript
            .filter(item => item.isFinal)
            .map(item => capitalize(item.text.trim()))
            .join('. ');

        setTargetText(finalTranscripts ? finalTranscripts + '.' : '');
    }, [transcript]);

    // Typewriter effect
    useEffect(() => {
        if (displayedText.length < targetText.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(targetText.slice(0, displayedText.length + 1));
            }, 30); // 30ms per character for visible typewriter effect

            return () => clearTimeout(timeout);
        }
    }, [displayedText, targetText]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [displayedText]);

    return (
        <div className="transcript-wrapper">
            <h3 className="transcript-title">LIVE TRANSCRIPT</h3>
            <div className="transcript-display" ref={scrollRef}>
                <div className="transcript-content">
                    {displayedText.length === 0 ? (
                        <p className="transcript-placeholder">
                            Start speaking to see transcript...
                        </p>
                    ) : (
                         <p className="transcript-text">{displayedText}</p>
                     )}
                </div>
            </div>
        </div>
    );
}

export default TranscriptDisplay;