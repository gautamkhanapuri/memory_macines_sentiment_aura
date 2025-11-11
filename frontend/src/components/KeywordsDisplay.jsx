import React, { useEffect, useState, useRef } from 'react';
import './KeywordsDisplay.css';

function KeywordsDisplay({ keywords }) {
    const [visibleKeywords, setVisibleKeywords] = useState([]);
    const scrollRef = useRef(null);

    useEffect(() => {
        // Animate keywords in one by one with stagger
        keywords.forEach((keyword, index) => {
            setTimeout(() => {
                setVisibleKeywords(prev => {
                    // Check if keyword already exists
                    if (!prev.find(k => k.id === keyword.id)) {
                        return [...prev, keyword];
                    }
                    return prev;
                });
            }, index * 100);
        });
    }, [keywords]);

    // Auto-scroll to bottom when keywords change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [visibleKeywords]);

    const getSentimentColor = (sentiment) => {
        if (sentiment < -0.3) {
            // Negative - cool blue/purple
            return 'rgba(150, 120, 255, 0.3)';
        } else if (sentiment > 0.3) {
            // Positive - warm orange/yellow
            return 'rgba(255, 180, 100, 0.3)';
        } else {
            // Neutral - teal/green
            return 'rgba(100, 200, 180, 0.3)';
        }
    };

    const getSentimentBorderColor = (sentiment) => {
        if (sentiment < -0.3) {
            return 'rgba(150, 120, 255, 0.6)';
        } else if (sentiment > 0.3) {
            return 'rgba(255, 180, 100, 0.6)';
        } else {
            return 'rgba(100, 200, 180, 0.6)';
        }
    };

    return (
        <div className="keywords-wrapper">
            <h3 className="keywords-title">KEY TOPICS</h3>
            <div className="keywords-display" ref={scrollRef}>
                <div className="keywords-container">
                    {visibleKeywords.map((keyword) => (
                        <span
                            key={keyword.id}
                            className="keyword-tag"
                            style={{
                                background: getSentimentColor(keyword.sentiment),
                                borderColor: getSentimentBorderColor(keyword.sentiment)
                            }}
                        >
                          {keyword.text}
                        </span>
                    ))}
                    {visibleKeywords.length === 0 && (
                        <p className="keywords-placeholder">
                            Keywords will appear here...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default KeywordsDisplay;