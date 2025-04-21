import React, { useState, useRef, useEffect } from 'react';

// AssigneeInput component for autocomplete assignee selection
const AssigneeInput = ({ task, setTask, assignees }) => {
  // State for assignee suggestions
  const [assigneeSuggestions, setAssigneeSuggestions] = useState([]);
  // Refs for input and suggestion list to handle click outside
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Handle input change and filter suggestions
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Update task state with new input value
    setTask((prevTask) => ({ ...prevTask, [name]: value }));

    // Filter assignees based on input for suggestions
    if (name === 'assignedTo') {
      const filteredSuggestions = assignees.filter((assignee) =>
        assignee.toLowerCase().includes(value.toLowerCase())
      );
      setAssigneeSuggestions(filteredSuggestions);
    }
  };

  // Close suggestion list when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is outside both input and suggestion list
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target)
      ) {
        setAssigneeSuggestions([]); // Hide suggestions
      }
    };

    // Add event listener for mousedown
    document.addEventListener('mousedown', handleClickOutside);
    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // Empty dependency array for one-time setup

  // Handle clicking a suggestion
  const handleSuggestionClick = (suggestion) => {
    // Update task with selected assignee and clear suggestions
    setTask((prevTask) => ({ ...prevTask, assignedTo: suggestion }));
    setAssigneeSuggestions([]);
  };

  return (
    // Container for autocomplete input and suggestions
    <div className="autocomplete">
      <input
        ref={inputRef} // Reference for click outside detection
        type="text"
        name="assignedTo"
        placeholder="Assigned To"
        value={task.assignedTo}
        onChange={handleChange} // Handle input changes
        autoComplete="off" // Disable browser autocomplete
        onFocus={() => setAssigneeSuggestions(assignees)} // Show all assignees on focus
      />
      {assigneeSuggestions.length > 0 && (
        // Render suggestion list if there are suggestions
        <ul ref={suggestionsRef} className="suggestions">
          {assigneeSuggestions.map((suggestion, index) => (
            <li
              key={index} // Unique key for each suggestion
              onClick={() => handleSuggestionClick(suggestion)} // Select suggestion on click
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AssigneeInput;