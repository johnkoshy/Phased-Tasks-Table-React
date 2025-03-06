import React, { useState, useEffect } from "react";

const FooterClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format date as DD/MM/YYYY
  const formattedDate = currentTime
    .toLocaleDateString("en-GB") // 'en-GB' uses DD/MM/YYYY format
    .replace(/\//g, "/"); // Add spaces for better readability

  return (
    <div style={footerStyle}>
      🕒 <span style={timeStyle}>{formattedDate}</span> |  
      <span style={timeStyle}>{currentTime.toLocaleTimeString()}</span>
    </div>
  );
};

// Styles for better visibility
const footerStyle = {
  position: "fixed",
  bottom: "10px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(0, 0, 0, 0.85)", // Darker for contrast
  color: "white",
  padding: "12px 24px",
  borderRadius: "14px",
  fontSize: "16px",
  fontWeight: "bold",
  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.4)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
};

// Monospace font for better readability
const timeStyle = {
  fontFamily: "'Courier New', monospace",
  fontSize: "18px",
  fontWeight: "bold",
  marginLeft: "5px",
};

export default FooterClock;
