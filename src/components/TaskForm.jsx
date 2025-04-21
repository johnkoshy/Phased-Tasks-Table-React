import React from 'react';

// TaskForm component for creating or editing tasks
const TaskForm = ({
  task, // Current task data
  tasks, // List of all tasks for parent task selection
  onSubmit, // Handler for form submission
  onChange, // Handler for input changes
  onClear, // Handler for clearing the form
  onDateTimeChange, // Handler for date/time input changes
  onFocusAssignedTo, // Handler for focusing the assignee input
  onSuggestionClick, // Handler for selecting assignee suggestions
  dueDateError, // Error message for due date validation
  showAssigneeSuggestions, // Flag to show assignee suggestions
  assigneeSuggestions, // List of assignee suggestions
  formRef, // Reference to the form element
  taskTitleRef, // Reference to the task title input
}) => (
  // Container for the task form
  <div className="task-form-container">
    <form onSubmit={onSubmit} className="task-form" ref={formRef}>
      {/* Task Title Input */}
      <div className="form-group">
        <label>Task Title *</label>
        <input
          type="text"
          name="title"
          placeholder="Task Title"
          value={task.title}
          onChange={onChange}
          ref={taskTitleRef}
          required // Mandatory field
        />
      </div>
      {/* Progress Slider */}
      <div className="form-group">
        <label>Progress:</label>
        <input
          type="range"
          min="0"
          max="100"
          name="progress"
          value={task.progress || 0} // Default to 0 if undefined
          onChange={onChange}
        />
        <span>{task.progress || 0}%</span> {/* Display progress percentage */}
      </div>
      {/* Task Description Textarea */}
      <div className="form-group">
        <label>Task Description:</label>
        <textarea
          name="description"
          placeholder="Task Description"
          value={task.description}
          onChange={onChange}
          required // Mandatory field
        />
      </div>
      {/* Assignee Input with Autocomplete Suggestions */}
      <div className="autocomplete">
        <label>Assigned To:</label>
        <input
          type="text"
          name="assignedTo"
          placeholder="Assigned To"
          value={task.assignedTo}
          onChange={onChange}
          onFocus={onFocusAssignedTo} // Trigger suggestions on focus
          autoComplete="off" // Disable browser autocomplete
        />
        {showAssigneeSuggestions && assigneeSuggestions.length > 0 && (
          <ul className="suggestions">
            {/* Render assignee suggestions */}
            {assigneeSuggestions.map((suggestion, index) => (
              <li key={index} onClick={() => onSuggestionClick(suggestion)}>
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Duration Input (Disabled) */}
      <div className="form-group">
        <label>Duration (Days):</label>
        <input
          type="number"
          name="duration"
          placeholder="Duration (days)"
          value={task.duration || ''} // Empty string if undefined
          disabled // Read-only field
          onChange={onChange}
        />
      </div>
      {/* Created Date Input */}
      <div className="form-group">
        <label>Created On:</label>
        <input
          type="datetime-local"
          id="createdDate"
          name="createdDate"
          value={task.createdDate}
          onChange={onDateTimeChange}
          min={new Date().toISOString().slice(0, 16)} // Restrict to current or future dates
          title="Date when the task was created."
        />
      </div>
      {/* Due Date Input with Error Display */}
      <div className="form-group">
        <label>Due By:</label>
        <input
          type="datetime-local"
          id="completionDate"
          name="completionDate"
          value={task.completionDate}
          onChange={onDateTimeChange}
          min={task.createdDate || new Date().toISOString().slice(0, 16)} // Ensure due date is after created date
          title="Estimated or actual completion date."
        />
        {dueDateError && (
          <p style={{ color: 'red', fontSize: '0.9em' }}>{dueDateError}</p> // Display due date validation error
        )}
      </div>
      {/* Parent Task Selector */}
      <div className="form-group">
        <label>Parent Task:</label>
        <select name="parentTaskId" value={task.parentTaskId} onChange={onChange}>
          <option value="">Main Task</option> {/* Option for no parent task */}
          {/* List all tasks except the current one as parent options */}
          {tasks
            .filter((t) => t.id !== task.id)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
        </select>
      </div>
      {/* Form Action Buttons */}
      <div className="form-buttons">
        <button type="submit" className="add-task-button">
          Add Task
        </button>
        <button type="button" className="clear-button" onClick={onClear}>
          Clear
        </button>
      </div>
    </form>
  </div>
);

export default TaskForm;