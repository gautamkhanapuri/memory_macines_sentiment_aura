import React from 'react';
import './Controls.css';

function Controls({ isRecording, onStart, onStop }) {

    // Play click sound
    const playClickSound = (isStarting) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = isStarting ? 600 : 400; // Higher pitch for start, lower for stop
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    };

    const handleClick = () => {
        if (isRecording) {
            playClickSound(false);
            onStop();
        } else {
            playClickSound(true);
            onStart();
        }
    };

    return (
        <div className="controls">
            <button
                className={`control-button ${isRecording ? 'recording' : ''}`}
                onClick={handleClick}
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