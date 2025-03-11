import React, { useState, useRef, useEffect } from 'react';

const AssigneeInput = ({ task, setTask, assignees }) => {
  const [assigneeSuggestions, setAssigneeSuggestions] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask((prevTask) => ({ ...prevTask, [name]: value }));

    if (name === 'assignedTo') {
      const filteredSuggestions = assignees.filter((assignee) =>
        assignee.toLowerCase().includes(value.toLowerCase())
      );
      setAssigneeSuggestions(filteredSuggestions);
    }
  };

  // Handle click outside to close the suggestion list
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target) && 
        suggestionsRef.current && !suggestionsRef.current.contains(e.target)
      ) {
        setAssigneeSuggestions([]); // Close the suggestion list
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle when a suggestion is clicked
  const handleSuggestionClick = (suggestion) => {
    setTask((prevTask) => ({ ...prevTask, assignedTo: suggestion }));
    setAssigneeSuggestions([]);
  };

  return (
    <div className="autocomplete">
      <input
        ref={inputRef}
        type="text"
        name="assignedTo"
        placeholder="Assigned To"
        value={task.assignedTo}
        onChange={handleChange}
        autoComplete="off"
        onFocus={() => setAssigneeSuggestions(assignees)}
      />
      {assigneeSuggestions.length > 0 && (
        <ul ref={suggestionsRef} className="suggestions">
          {assigneeSuggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
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
