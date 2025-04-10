import React from 'react';

const TaskForm = ({
  task,
  tasks, // For parent task options
  onSubmit,
  onChange,
  onClear,
  onDateTimeChange,
  onFocusAssignedTo,
  onSuggestionClick,
  dueDateError,
  showAssigneeSuggestions,
  assigneeSuggestions,
  formRef,
  taskTitleRef,
}) => (
  <div className="task-form-container">
    <form onSubmit={onSubmit} className="task-form" ref={formRef}>
      <div className="form-group">
        <label>Task Title:</label>
        <input
          type="text"
          name="title"
          placeholder="Task Title"
          value={task.title}
          onChange={onChange}
          required
          ref={taskTitleRef}
        />
      </div>
      <div className="form-group">
        <label>Task Description:</label>
        <textarea
          name="description"
          placeholder="Task Description"
          value={task.description}
          onChange={onChange}
          required
        />
      </div>
      <div className="autocomplete">
        <label>Assigned To:</label>
        <input
          type="text"
          name="assignedTo"
          placeholder="Assigned To"
          value={task.assignedTo}
          onChange={onChange}
          onFocus={onFocusAssignedTo}
          autoComplete="off"
        />
        {showAssigneeSuggestions && assigneeSuggestions.length > 0 && (
          <ul className="suggestions">
            {assigneeSuggestions.map((suggestion, index) => (
              <li key={index} onClick={() => onSuggestionClick(suggestion)}>
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="form-group">
        <label>Duration (Days):</label>
        <input
          type="number"
          name="duration"
          placeholder="Duration (days)"
          value={task.duration || ''}
          disabled
          onChange={onChange}
        />
      </div>
      <div className="form-group">
        <label>Created On:</label>
        <input
          type="datetime-local"
          id="createdDate"
          name="createdDate"
          value={task.createdDate}
          onChange={onDateTimeChange}
          min={new Date().toISOString().slice(0, 16)}
          title="Date when the task was created."
        />
      </div>
      <div className="form-group">
        <label>Due By:</label>
        <input
          type="datetime-local"
          id="completionDate"
          name="completionDate"
          value={task.completionDate}
          onChange={onDateTimeChange}
          min={task.createdDate || new Date().toISOString().slice(0, 16)}
          title="Estimated or actual completion date."
        />
        {dueDateError && <p style={{ color: 'red', fontSize: '0.9em' }}>{dueDateError}</p>}
      </div>
      <div className="form-group">
        <label>Parent Task:</label>
        <select name="parentTaskId" value={task.parentTaskId} onChange={onChange}>
          <option value="">Main Task</option>
          {tasks.filter((t) => t.id !== task.id).map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>
      <div className="form-buttons">
        <button type="submit" className="add-task-button">Add Task</button>
        <button type="button" className="clear-button" onClick={onClear}>Clear</button>
      </div>
    </form>
  </div>
);

export default TaskForm;