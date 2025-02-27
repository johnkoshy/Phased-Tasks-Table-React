import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    duration: '',
    completionDate: '',
    createdDate: '',
    parentTaskId: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [assigneeSuggestions, setAssigneeSuggestions] = useState([]);
  const [expandedTasks, setExpandedTasks] = useState({}); // Track expanded/collapsed tasks
  const formRef = useRef(null);

  const [editingTaskId, setEditingTaskId] = useState(null); // Track the task being edited
  const [editingTaskData, setEditingTaskData] = useState({}); // Temporary data for the task being edited

  const isoDate = "2025-02-26T03:59";
  const formattedDate = isoDate.replace("T", " "); // Replace "T" with a space

  const [editError, setEditError] = useState('');

  const formatDateTime = (isoDate) => {
    if (!isoDate) return "N/A"; // Handle empty or invalid dates

    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12 || 12;

    return `${year}-${month}-${day}, ${hours}:${minutes} ${ampm}`;
  };

  console.log(formattedDate); // Output: "2025-02-26 03:59"

  const handleEditTask = (taskId) => {
    const taskToEdit = tasks.find((task) => task.id === taskId);
    setEditingTaskId(taskId);
    setEditingTaskData({ ...taskToEdit }); // Copy the task data for editing
  };

  const [contextMenu, setContextMenu] = useState({
    visible: false, // Whether the context menu is visible
    taskId: null, // The task ID of the right-clicked row
    x: 0, // X position of the context menu
    y: 0, // Y position of the context menu
  });

  const ContextMenu = ({ visible, x, y, onAddSubtask, onClose }) => {
    if (!visible) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: y,
          left: x,
          backgroundColor: 'white',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          padding: '8px',
        }}
      >
        <div
          style={{ padding: '8px', cursor: 'pointer' }}
          onClick={onAddSubtask}
        >
          Add Subtask
        </div>
        <div
          style={{ padding: '8px', cursor: 'pointer' }}
          onClick={onClose}
        >
          Close
        </div>
      </div>
    );
  };

  const handleSaveTask = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...editingTaskData } : task
      )
    );
    setEditingTaskId(null); // Exit edit mode
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null); // Exit edit mode
  };

  const handleAddSubtask = () => {
    if (contextMenu.taskId) {
      // Set the parent task ID for the new task
      setTask((prevTask) => ({
        ...prevTask,
        parentTaskId: contextMenu.taskId, // Set parentTaskId to the right-clicked row's taskId
      }));
  
      // Show the task form
      setShowForm(true);
    }
  
    // Close the context menu
    setContextMenu({ visible: false, taskId: null, x: 0, y: 0 });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, taskId: null, x: 0, y: 0 });
  };

  // Sample list of assignees (can be fetched from an API)
  const assignees = [
    'John Doe',
    'Jane Smith',
    'Alice Johnson',
    'Bob Brown',
    'Charlie Davis',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow only letters and spaces for 'title' and 'description'
    if ((name === 'title' || name === 'description') && !/^[a-zA-Z\s]*$/.test(value)) {
      return; // Prevent invalid input
    }

    // For 'duration', ensure the value is a valid number
    if (name === 'duration') {
      if (!/^\d*$/.test(value)) {
        return;
      }
    }

    setTask((prevTask) => ({ ...prevTask, [name]: value }));

    // Update suggestions for "Assigned To"
    if (name === 'assignedTo') {
      const filteredSuggestions = assignees.filter((assignee) =>
        assignee.toLowerCase().includes(value.toLowerCase())
      );
      setAssigneeSuggestions(filteredSuggestions);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setTask((prevTask) => ({ ...prevTask, assignedTo: suggestion }));
    setAssigneeSuggestions([]); // Clear suggestions after selection
  };

  const handleAssignedToFocus = () => {
    // Show all suggestions when the input is focused
    setAssigneeSuggestions(assignees);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    if (!task.title.trim() || !task.description.trim()) return;
  
    // Check if a main task already exists and the new task is also a main task
    const mainTaskExists = tasks.some((t) => t.parentTaskId === null);
    if (mainTaskExists && task.parentTaskId === '') {
      alert('Only one main task is allowed. Please create a subtask instead.');
      return;
    }
  
    const newTask = {
      id: Date.now(),
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      duration: task.duration ? Number(task.duration) : 0,
      completionDate: task.completionDate || 'N/A',
      createdDate: task.createdDate || new Date().toISOString().split('T')[0],
      parentTaskId: task.parentTaskId || null, // Ensure parentTaskId is set correctly
    };
  
    setTasks((prevTasks) => [...prevTasks, newTask]); // Add new task to the tasks array
  
    setTask({
      title: '',
      description: '',
      assignedTo: '',
      duration: '',
      completionDate: '',
      createdDate: '',
      parentTaskId: '',
    });
  
    setShowForm(false);
  };

  const handleAddTaskClick = () => {
    // Check if a main task already exists
    const mainTask = tasks.find((task) => task.parentTaskId === null);
  
    if (mainTask) {
      // If a main task exists, set the parentTaskId to the main task's ID
      setTask((prevTask) => ({
        ...prevTask,
        parentTaskId: mainTask.id,
      }));
    } else {
      // If no main task exists, reset the parentTaskId
      setTask((prevTask) => ({
        ...prevTask,
        parentTaskId: '',
      }));
    }
  
    // Show the form
    setShowForm(true);
  };

  const handleClickOutside = (e) => {
    if (formRef.current && !formRef.current.contains(e.target)) {
      const isAnyInputFilled = Object.values(task).some((value) => {
        if (typeof value === 'string') {
          return value.trim() !== '';
        }
        return value !== null && value !== undefined; // Handle non-string values like duration
      });
  
      console.log('Clicked outside. Is any input filled?', isAnyInputFilled); // Debugging
  
      if (!isAnyInputFilled) {
        console.log('No input filled. Closing form.'); // Debugging
        setShowForm(false);
        setTask({
          title: '',
          description: '',
          assignedTo: '',
          duration: '',
          completionDate: '',
          createdDate: '',
          parentTaskId: '', // Explicitly reset parentTaskId
        });
      }
    }
  };

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    setTask((prevTask) => ({ ...prevTask, [name]: value }));
  };

  const handleParentChange = (e, taskId) => {
    const newParentId = e.target.value === '' ? null : e.target.value; // Convert empty string to null

    const taskToModify = tasks.find((task) => task.id === taskId);
    if (taskToModify.parentTaskId === null && newParentId !== null) {
      alert('Main tasks cannot be moved to subtasks.');
      return; // Prevent the change
    }

// Check if a main task already exists and the new task is also a main task
  const mainTaskExists = tasks.some((t) => t.parentTaskId === null && t.id !== taskId);
  if (mainTaskExists && newParentId === null) {
    alert('Only one main task is allowed.');
    return;
  }

    // Check if the new parent is valid
    const isValidParent = (taskId, newParentId) => {
      if (newParentId === null) return true; // No parent is always valid
      if (taskId === newParentId) return false; // A task cannot be its own parent

      // Check if the new parent is a subtask of the current task (to prevent circular dependencies)
      const isCircular = (parentId) => {
        const parentTask = tasks.find((t) => t.id === parentId);
        if (!parentTask) return false;
        if (parentTask.parentTaskId === taskId) return true; // Circular dependency detected
        return isCircular(parentTask.parentTaskId); // Recursively check the parent chain
      };

      return !isCircular(newParentId);
    };

    if (!isValidParent(taskId, newParentId)) {
      alert('Invalid parent selection. A task cannot be its own parent or a subtask of its own subtasks.');
      return;
    }

    // Update the parent task
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, parentTaskId: newParentId } : task
      )
    );
  };

  // Toggle expanded/collapsed state for a task
  const toggleExpand = (taskId) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId], // Toggle the expanded state
    }));
  };

  const handleRowClick = (taskId, e) => {
    // Prevent edit mode if clicking on an input or select element
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'select') {
      return;
    }
  
    if (editingTaskId === taskId) {
      // If the row is already in edit mode, save the changes and exit edit mode
      handleSaveTask(taskId);
    } else {
      // If the row is not in edit mode, enable edit mode
      handleEditTask(taskId);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;

    // Allow only letters and spaces for 'title', 'description', and 'assignedTo'
    if (
      (name === 'title' || name === 'description' || name === 'assignedTo') &&
      !/^[a-zA-Z\s]*$/.test(value)
    ) {
      return; // Prevent invalid input
    }

    // For "Assigned To", only allow values from the predefined list
    if (name === 'assignedTo') {
      const isValidAssignee = assignees.includes(value); // Check if the value is in the predefined list
      if (!isValidAssignee && value.trim() !== '') {
        return; // Prevent invalid input
      }
    }

    // Update the editing task data
    setEditingTaskData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Update suggestions for "Assigned To"
    if (name === 'assignedTo') {
      const filteredSuggestions = assignees.filter((assignee) =>
        assignee.toLowerCase().includes(value.toLowerCase())
      );
      setAssigneeSuggestions(filteredSuggestions);
    }
  };

  const handleRowRightClick = (e, taskId) => {
    e.preventDefault(); // Prevent the default browser context menu

    // Set the context menu position and task ID
    setContextMenu({
      visible: true,
      taskId: taskId,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const renderTasks = (tasks, parentId = null, level = 0) => {
    return tasks
      .filter((task) => task.parentTaskId == parentId) // Filter only direct children
      .map((task) => {
        const hasSubtasks = tasks.some((t) => t.parentTaskId == task.id); // Check if the task has subtasks
        const isExpanded = expandedTasks[task.id]; // Check if the task is expanded
        const isEditing = editingTaskId === task.id; // Check if the task is in edit mode
  
        return (
          <React.Fragment key={task.id}>
            <tr
              key={task.id}
              onClick={(e) => handleRowClick(task.id, e)} // Handle row click for edit mode
              onContextMenu={(e) => handleRowRightClick(e, task.id)} // Keep the right-click handler
            >
              <td style={{ paddingLeft: `${level * 20}px` }}>
                {hasSubtasks && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click from triggering when toggling subtasks
                      toggleExpand(task.id);
                    }}
                    style={{ cursor: 'pointer', marginRight: '8px' }}
                  >
                    {isExpanded ? '▼' : '▶'} {/* Show ▼ if expanded, ▶ if collapsed */}
                  </span>
                )}
                {isEditing ? (
                  <input
                    type="text"
                    name="title"
                    value={editingTaskData.title}
                    onChange={handleEditInputChange}
                  />
                ) : (
                  task.title
                )}
              </td>
              <td>
                {isEditing ? (
                  <input
                    type="text"
                    name="description"
                    value={editingTaskData.description}
                    onChange={handleEditInputChange}
                  />
                ) : (
                  task.description
                )}
              </td>
              <td>
                {isEditing ? (
                  <select
                    value={editingTaskData.assignedTo}
                    onChange={(e) =>
                      setEditingTaskData({ ...editingTaskData, assignedTo: e.target.value })
                    }
                  >
                    <option value="">Select Assignee</option>
                    {assignees.map((assignee, index) => (
                      <option key={index} value={assignee}>
                        {assignee}
                      </option>
                    ))}
                  </select>
                ) : (
                  task.assignedTo
                )}
              </td>
              <td>
                {isEditing ? (
                  <input
                    type="number"
                    value={editingTaskData.duration}
                    onChange={(e) =>
                      setEditingTaskData({ ...editingTaskData, duration: e.target.value })
                    }
                  />
                ) : (
                  task.duration
                )}
              </td>
              <td>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    value={editingTaskData.completionDate}
                    onChange={(e) =>
                      setEditingTaskData({ ...editingTaskData, completionDate: e.target.value })
                    }
                  />
                ) : (
                  formatDateTime(task.completionDate)
                )}
              </td>
              <td>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    value={editingTaskData.createdDate}
                    onChange={(e) =>
                      setEditingTaskData({ ...editingTaskData, createdDate: e.target.value })
                    }
                  />
                ) : (
                  formatDateTime(task.createdDate)
                )}
              </td>
              <td>
                {isEditing ? (
                  <select
                  value={editingTaskData.parentTaskId || ''}
                  onChange={(e) =>
                    setEditingTaskData({ ...editingTaskData, parentTaskId: e.target.value })
                  }
                >
                  <option value="">Main Task</option> {/* Updated label */}
                  {tasks
                    .filter((t) => t.id !== task.id) // Prevent a task from being its own parent
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                </select>
                ) : (
                  <select
  value={task.parentTaskId || ''}
  onChange={(e) => handleParentChange(e, task.id)}
>
  <option value="">Main Task</option> {/* Updated label */}
  {tasks
    .filter((t) => t.id !== task.id) // Prevent a task from being its own parent
    .map((t) => (
      <option key={t.id} value={t.id}>
        {t.title}
      </option>
    ))}
</select>
                )}
              </td>
              {/* Conditionally render the "Actions" column */}
              {isEditing && (
                <td>
                  <button onClick={() => handleSaveTask(task.id)}>Save</button>
                  <button onClick={handleCancelEdit}>Cancel</button>
                </td>
              )}
            </tr>
            {isExpanded && renderTasks(tasks, task.id, level + 1)} {/* Render subtasks if expanded */}
          </React.Fragment>
        );
      });
  };

  // Render the table body without extra whitespace
  const renderTableBody = () => {
    const rows = renderTasks(tasks);
    return <tbody>{rows}</tbody>;
  };

  useEffect(() => {
    if (showForm) {
      console.log('Adding event listener for click outside.'); // Debugging
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      console.log('Removing event listener for click outside.'); // Debugging
      document.removeEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      console.log('Cleaning up event listener for click outside.'); // Debugging
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showForm, task]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, taskId: null, x: 0, y: 0 });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.visible]);

  return (
    <div className="App">
      <h4>PHASED TASKS TABLE</h4>

      <h5>Task List</h5>
      {tasks.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Description</th>
              <th>Assigned To</th>
              <th>Duration</th>
              <th>Created Date</th>
              <th>Completion Date</th>              
              <th>Parent Task</th>    
              {editingTaskId !== null && <th>Actions</th>}                 
            </tr>
          </thead>
          {renderTableBody()} {/* Render the table body without extra whitespace */}
        </table>
      ) : (
        <p>No tasks available.</p>
      )}

      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onAddSubtask={handleAddSubtask}
        onClose={handleCloseContextMenu}
      />

      {/* Add Task Form */}
      <div className="add-task-container">
        {!showForm ? (
          <button className="add-task-button" onClick={handleAddTaskClick}>
            Add Task
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="task-form" ref={formRef}>
            <input
              type="text"
              name="title"
              placeholder="Task Title"
              value={task.title}
              onChange={handleChange}
              required
            />
            <textarea
              name="description"
              placeholder="Task Description"
              value={task.description}
              onChange={handleChange}
              required
            />
            <div className="autocomplete">
              <input
                type="text"
                name="assignedTo"
                placeholder="Assigned To"
                value={task.assignedTo}
                onChange={handleChange}
                onFocus={handleAssignedToFocus}
                autoComplete="off"
              />
              {assigneeSuggestions.length > 0 && (
                <ul className="suggestions">
                  {assigneeSuggestions.map((suggestion, index) => (
                    <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input
              type="number"
              name="duration"
              placeholder="Duration"
              value={task.duration}
              onChange={handleChange}
              min="0"
              autoComplete="off"
            />
            <input
              type="datetime-local"
              name="completionDate"
              value={task.completionDate}
              onChange={handleDateTimeChange}
            />
            <input
              type="datetime-local"
              name="createdDate"
              value={task.createdDate}
              onChange={handleDateTimeChange}
            />
            <label>Parent Task:</label>
            <select
  name="parentTaskId"
  value={task.parentTaskId}
  onChange={handleChange}
  disabled // Disable the dropdown since the parent task is automatically set
>
  <option value="">Main Task</option> {/* Updated label */}
  {tasks
    .filter((t) => t.id === task.parentTaskId) // Only show the parent task
    .map((t) => (
      <option key={t.id} value={t.id}>
        {t.title}
      </option>
    ))}
</select>
            <button type="submit" className="add-task-button">
              Add Task
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;