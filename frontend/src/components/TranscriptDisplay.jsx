import React, { useEffect, useRef } from 'react';
import './TranscriptDisplay.css';

function TranscriptDisplay({ transcript }) {
    const scrollRef = useRef(null);

    useEffect(() => {
        // Auto-scroll to bottom
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcript]);

    return (
        <div className="transcript-display" ref={scrollRef}>
            <h3 className="transcript-title">Live Transcript</h3>
            <div className="transcript-content">
                {transcript.map((item, index) => (
                    <p
                        key={index}
                        className={`transcript-line ${item.isFinal ? 'final' : 'interim'}`}
                    >
                        {item.text}
                    </p>
                ))}
                {transcript.length === 0 && (
                    <p className="transcript-placeholder">
                        Start speaking to see transcript...
                    </p>
                )}
            </div>
        </div>
    );
}

export default TranscriptDisplay;