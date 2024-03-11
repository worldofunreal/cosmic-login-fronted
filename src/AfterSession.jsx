// src/pages/AfterSession.js
import React, { useState, useEffect } from 'react';
import './AfterSession.css';
function AfterSession({ onCountdownComplete }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      onCountdownComplete();
    }
  }, [countdown, onCountdownComplete]);

  return (
    <div className="after-session-container">
    <div>
      {countdown > 0 ? (
        <h1>This page will self-destruct in {countdown}...</h1>
      ) : (
        <div>
          <h1>Successfully logged in!</h1>
          <p>Go wreck some spaceships, commander!</p>
        </div>
      )}
      </div>
      </div>
  );
}

export default AfterSession;