import React, { useEffect, useState } from 'react';
import './KeywordsDisplay.css';

function KeywordsDisplay({ keywords }) {
    const [visibleKeywords, setVisibleKeywords] = useState([]);

    useEffect(() => {
        // Animate keywords in one by one
        keywords.forEach((keyword, index) => {
            setTimeout(() => {
                setVisibleKeywords(prev => {
                    if (!prev.find(k => k.id === keyword.id)) {
                        return [...prev, keyword];
                    }
                    return prev;
                });
            }, index * 150); // Stagger by 150ms
        });
    }, [keywords]);

    return (
        <div className="keywords-display">
            <h3 className="keywords-title">Key Topics</h3>
            <div className="keywords-container">
                {visibleKeywords.map((keyword) => (
                    <span
                        key={keyword.id}
                        className="keyword-tag"
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
    );
}

export default KeywordsDisplay;