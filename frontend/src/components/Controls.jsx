import React from 'react';
import './Controls.css';

function Controls({ isRecording, onStart, onStop }) {
    return (
        <div className="controls">
            <button
                className={`control-button ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? onStop : onStart}
            >
                {isRecording ? (
                    <>
                        <span className="recording-indicator"></span>
                        Stop Recording
                    </>
                ) : (
                     'Start Recording'
                 )}
            </button>
        </div>
    );
}

export default Controls;