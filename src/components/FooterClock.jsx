import React, { useState, useEffect } from "react";

// FooterClock component to display a live clock with date and time
const FooterClock = () => {
  // State to store the current date and time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update currentTime every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date()); // Refresh time
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []); // Empty dependency array for one-time setup

  // Format date as DD/MM/YYYY
  const formattedDate = currentTime
    .toLocaleDateString("en-GB") // Use 'en-GB' for DD/MM/YYYY format
    .replace(/\//g, "/"); // Ensure consistent slash separator

  return (
    // Render clock in a styled footer container
    <div style={footerStyle}>
      🕒 <span style={timeStyle}>{formattedDate}</span> |{" "}
      <span style={timeStyle}>{currentTime.toLocaleTimeString()}</span>
    </div>
  );
};

// Styles for the footer container
const footerStyle = {
  position: "fixed",
  bottom: "10px",
  left: "50%",
  transform: "translateX(-50%)", // Center horizontally
  background: "rgba(0, 0, 0, 0.85)", // Semi-transparent dark background
  color: "white",
  padding: "12px 24px",
  borderRadius: "14px",
  fontSize: "16px",
  fontWeight: "bold",
  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.4)", // Subtle shadow for depth
  backdropFilter: "blur(12px)", // Blur effect for modern look
  border: "1px solid rgba(255, 255, 255, 0.3)", // Light border for contrast
};

// Styles for the date and time text
const timeStyle = {
  fontFamily: "'Courier New', monospace", // Monospace font for readability
  fontSize: "18px",
  fontWeight: "bold",
  marginLeft: "5px", // Spacing between elements
};

export default FooterClock;