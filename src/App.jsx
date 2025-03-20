import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import FooterClock from './components/FooterClock';
import styled from 'styled-components';

// Main App component for task management
function App() {
  // State for managing tasks and form data
  const [tasks, setTasks] = useState([]); // List of all tasks
  const [task, setTask] = useState({ title: '', description: '', assignedTo: '', duration: '', completionDate: '', createdDate: '', parentTaskId: '' }); // New task form data
  const [showForm, setShowForm] = useState(false); // Toggle task form visibility
  const [assigneeSuggestions, setAssigneeSuggestions] = useState([]); // Autocomplete suggestions for assignees
  const [expandedTasks, setExpandedTasks] = useState({}); // Tracks expanded subtasks
  const [editingTaskId, setEditingTaskId] = useState(null); // ID of task being edited
  const [editingTaskData, setEditingTaskData] = useState({}); // Data of task being edited
  const [dueDateError, setDueDateError] = useState(''); // Error message for date validation
  const [contextMenu, setContextMenu] = useState({ visible: false, taskId: null, x: 0, y: 0 }); // Context menu state
  const [showAssigneeSuggestions, setShowAssigneeSuggestions] = useState(false); // Toggle assignee suggestions visibility
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true'); // Dark mode state from localStorage
  const formRef = useRef(null); // Reference to task form for outside click detection

  // Calculate duration between two dates in days
  const calculateDurationInDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate)) return '';
    const timeDiff = endDate - startDate;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return daysDiff > 0 ? daysDiff : 0;
  };

  // Clear form inputs with confirmation
  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear all fields?')) {
      setTask({ title: '', description: '', assignedTo: '', duration: '', completionDate: '', createdDate: '', parentTaskId: '' });
      setDueDateError('');
      setAssigneeSuggestions([]);
      setShowAssigneeSuggestions(false);
    }
  };

  // Get title of parent task or return 'Main Task' if none
  const getParentTaskTitle = (parentTaskId) => {
    if (!parentTaskId) return 'Main Task';
    const parentTask = tasks.find((t) => t.id === parentTaskId);
    return parentTask ? parentTask.title : 'Main Task';
  };

  // Check if a task is a descendant of another to prevent circular references
  const isDescendant = (taskId, potentialParentId, tasks) => {
    let currentTaskId = potentialParentId;
    while (currentTaskId) {
      if (currentTaskId === taskId) return true;
      const currentTask = tasks.find((t) => t.id === currentTaskId);
      currentTaskId = currentTask ? currentTask.parentTaskId : null;
    }
    return false;
  };

  // Format ISO date to a readable string
  const formatDateTime = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = date.getHours() % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${year}-${month}-${day}, ${hours}:${minutes} ${ampm}`;
  };

  // Enter edit mode for a specific task
  const handleEditTask = (taskId) => {
    const taskToEdit = tasks.find((t) => t.id === taskId);
    setEditingTaskId(taskId);
    setEditingTaskData({ ...taskToEdit });
  };

  // Context menu component for adding subtasks
  const ContextMenu = ({ visible, x, y, onAddSubtask, onClose }) => {
    if (!visible) return null;
    return (
      <div style={{ position: 'fixed', top: y, left: x, backgroundColor: 'white', color: 'black', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', zIndex: 1000, padding: '8px', borderRadius: '6px' }} className="context-menu">
        <div style={{ padding: '8px', cursor: 'pointer' }} onClick={onAddSubtask}>Add Subtask</div>
        <div style={{ padding: '8px', cursor: 'pointer' }} onClick={onClose}>Close</div>
      </div>
    );
  };

  // Save edited task and exit edit mode
  const handleSaveTask = (taskId) => {
    setTasks((prevTasks) => prevTasks.map((t) => (t.id === taskId ? { ...editingTaskData } : t)));
    setEditingTaskId(null);
  };

  // Cancel editing and revert to original task data
  const handleCancelEdit = () => {
    const originalTask = tasks.find((t) => t.id === editingTaskId);
    setEditingTaskData({ ...originalTask });
    setEditingTaskId(null);
  };

  // Open form to add a subtask under the selected task
  const handleAddSubtask = () => {
    if (contextMenu.taskId) {
      setTask((prev) => ({ ...prev, parentTaskId: contextMenu.taskId }));
      setShowForm(true);
    }
    setContextMenu({ visible: false, taskId: null, x: 0, y: 0 });
  };

  // Close context menu
  const handleCloseContextMenu = () => setContextMenu({ visible: false, taskId: null, x: 0, y: 0 });

  // List of possible assignees
  const assignees = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown', 'Charlie Davis'];

  // Handle form input changes and update assignee suggestions
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
    if (name === 'assignedTo') {
      const filteredSuggestions = assignees.filter((a) => a.toLowerCase().includes(value.toLowerCase()));
      setAssigneeSuggestions(filteredSuggestions);
    }
  };

  // Set task assignee from suggestion and hide suggestions
  const handleSuggestionClick = (suggestion) => {
    setTask((prev) => ({ ...prev, assignedTo: suggestion }));
    setAssigneeSuggestions([]);
    setShowAssigneeSuggestions(false);
  };

  // Show all assignee suggestions on input focus
  const handleAssignedToFocus = () => {
    setAssigneeSuggestions(assignees);
    setShowAssigneeSuggestions(true);
  };

  // Submit new task and reset form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task.title.trim() || !task.description.trim()) return;
    const durationInDays = task.duration || calculateDurationInDays(task.createdDate, task.completionDate);
    const newTask = {
      id: Date.now().toString(),
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      duration: durationInDays,
      completionDate: task.completionDate,
      createdDate: new Date().toISOString(),
      parentTaskId: task.parentTaskId || null,
      subtasks: [],
    };
    setTasks([...tasks, newTask]);
    setTask({ title: '', description: '', assignedTo: '', duration: '', completionDate: '', createdDate: '', parentTaskId: '' });
    setShowForm(false);
  };

  // Show form for adding a new main task
  const handleAddTaskClick = () => {
    setTask((prev) => ({ ...prev, parentTaskId: '' }));
    setShowForm(true);
  };

  // Close form or hide suggestions if clicked outside
  const handleClickOutside = (e) => {
    if (formRef.current && !formRef.current.contains(e.target) && !task.title.trim() && !task.description.trim()) {
      setShowForm(false);
    }
    const assigneeInput = document.querySelector('input[name="assignedTo"]');
    const suggestionsList = document.querySelector('.suggestions');
    if (assigneeInput && !assigneeInput.contains(e.target) && suggestionsList && !suggestionsList.contains(e.target)) {
      setShowAssigneeSuggestions(false);
    }
  };

  // Handle date input changes with validation and duration calculation
  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    setTask((prevTask) => {
      const updatedTask = { ...prevTask, [name]: value };
      if (name === 'createdDate') {
        const selectedDate = new Date(value);
        if (selectedDate < new Date()) {
          setDueDateError('Created On date cannot be earlier than the current date.');
          return prevTask;
        }
        setDueDateError('');
      }
      if (name === 'completionDate' && updatedTask.createdDate) {
        const createdDate = new Date(updatedTask.createdDate);
        const completionDate = new Date(value);
        setDueDateError(completionDate < createdDate ? 'Due By date cannot be earlier than Created On date.' : '');
      }
      if (updatedTask.createdDate && updatedTask.completionDate) {
        updatedTask.duration = calculateDurationInDays(updatedTask.createdDate, updatedTask.completionDate);
      }
      return updatedTask;
    });
    if (e.target.dataset.blurTimeout) clearTimeout(e.target.dataset.blurTimeout);
    const timeoutId = setTimeout(() => e.target.blur(), 3000);
    e.target.dataset.blurTimeout = timeoutId;
  };

  // Cleanup timeouts on component unmount
  useEffect(() => {
    return () => {
      const createdInput = document.getElementById('createdDate');
      const completionInput = document.getElementById('completionDate');
      if (createdInput?.dataset.blurTimeout) clearTimeout(createdInput.dataset.blurTimeout);
      if (completionInput?.dataset.blurTimeout) clearTimeout(completionInput.dataset.blurTimeout);
    };
  }, []);

  // Update task parent with validation against circular references
  const handleParentChange = (e, taskId) => {
    const newParentId = e.target.value || null;
    if (isDescendant(newParentId, taskId, tasks)) {
      alert('Invalid parent selection. A task cannot be its own parent or a subtask of its own subtasks.');
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, parentTaskId: newParentId } : t)));
  };

  // Toggle subtask expansion
  const toggleExpand = (taskId) => setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));

  // Handle row click to enter edit mode
  const handleRowClick = (taskId, e) => {
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'select') return;
    if (editingTaskId !== taskId) handleEditTask(taskId);
  };

  // Create falling leaf animations on mount
  useEffect(() => {
    const numLeaves = 20;
    const leafContainer = document.getElementById('falling-leaf-container');
    for (let i = 0; i < numLeaves; i++) {
      const leaf = document.createElement('div');
      leaf.classList.add('leaf');
      leaf.style.left = `${Math.random() * 100}%`;
      leaf.style.animationDuration = `${Math.random() * 5 + 5}s`;
      leaf.style.animationDelay = `${Math.random() * 5}s`;
      leafContainer.appendChild(leaf);
    }
  }, []);

  // Handle input changes during editing with validation
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'title' || name === 'description') && !/^[a-zA-Z0-9\s]*$/.test(value)) return;
    if (name === 'assignedTo' && !assignees.includes(value) && value.trim() !== '') return;
    setEditingTaskData((prev) => ({ ...prev, [name]: value }));
    if (name === 'assignedTo') {
      const filteredSuggestions = assignees.filter((a) => a.toLowerCase().includes(value.toLowerCase()));
      setAssigneeSuggestions(filteredSuggestions);
    }
  };

  // Show context menu on right-click
  const handleRowRightClick = (e, taskId) => {
    e.preventDefault();
    setContextMenu({ visible: true, taskId, x: e.clientX, y: e.clientY });
  };

  // Recursively render tasks and subtasks
  const renderTasks = (tasks, parentId = null, level = 0) =>
    tasks.filter((t) => t.parentTaskId === parentId).map((task) => {
      const hasSubtasks = tasks.some((t) => t.parentTaskId === task.id);
      const isExpanded = expandedTasks[task.id];
      const isEditing = editingTaskId === task.id;
      return (
        <React.Fragment key={task.id}>
          <tr onClick={(e) => handleRowClick(task.id, e)} onContextMenu={(e) => handleRowRightClick(e, task.id)}>
            <td className="task-title" style={{ paddingLeft: `${level * 20 + 10}px` }}>
              {hasSubtasks && (
                <span onClick={(e) => { e.stopPropagation(); toggleExpand(task.id); }} style={{ cursor: 'pointer', marginRight: '8px' }}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
              {isEditing ? <input type="text" name="title" value={editingTaskData.title} onChange={handleEditInputChange} /> : task.title}
            </td>
            <td>{isEditing ? <input type="text" name="description" value={editingTaskData.description} onChange={handleEditInputChange} /> : task.description}</td>
            <td>{isEditing ? (
              <select value={editingTaskData.assignedTo} onChange={(e) => setEditingTaskData({ ...editingTaskData, assignedTo: e.target.value })}>
                <option value="">Select Assignee</option>
                {assignees.map((assignee, index) => <option key={index} value={assignee}>{assignee}</option>)}
              </select>
            ) : task.assignedTo}</td>
            <td>{isEditing ? <input type="number" value={editingTaskData.duration || ''} disabled /> : `${task.duration} ${task.duration === 1 ? 'day' : 'days'}`}</td>
            <td>{isEditing ? <input type="datetime-local" value={editingTaskData.createdDate} onChange={(e) => setEditingTaskData({ ...editingTaskData, createdDate: e.target.value })} /> : `📅 ${formatDateTime(task.createdDate)}`}</td>
            <td>{isEditing ? <input type="datetime-local" value={editingTaskData.completionDate} onChange={(e) => setEditingTaskData({ ...editingTaskData, completionDate: e.target.value })} /> : `⏳ ${formatDateTime(task.completionDate)}`}</td>
            <td>{task.parentTaskId ? (
              <>
                {tasks.find((t) => t.id === task.parentTaskId)?.title || 'Main Task'}
                <select value={task.parentTaskId || ''} onChange={(e) => handleParentChange(e, task.id)} style={{ marginLeft: '10px' }}>
                  <option value="">Change Parent Task</option>
                  {tasks.filter((t) => t.id !== task.id && !isDescendant(t.id, task.id, tasks)).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </>
            ) : 'Main Task'}</td>
            {isEditing && (
              <td>
                <button onClick={() => handleSaveTask(task.id)}>Save</button>
                <button onClick={handleCancelEdit}>Cancel</button>
              </td>
            )}
          </tr>
          {isExpanded && renderTasks(tasks, task.id, level + 1)}
        </React.Fragment>
      );
    });

  // Render table body with tasks
  const renderTableBody = () => <tbody>{renderTasks(tasks)}</tbody>;

  // Apply dark mode and background styles
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.style.background = 'none';
    } else {
      document.body.classList.remove('dark-mode');
      document.body.style.background = "url('/wallpaper.jpg') no-repeat center center fixed";
      document.body.style.backgroundSize = 'cover';
    }
  }, [darkMode]);

  // Add event listener for outside clicks
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showForm, task]);

  // Update task duration when dates change
  useEffect(() => {
    if (task.createdDate && task.completionDate) {
      setTask((prev) => ({ ...prev, duration: calculateDurationInDays(prev.createdDate, task.completionDate) }));
    }
  }, [task.createdDate, task.completionDate]);

  // Render the app UI
  return (
    <div className="App">
      <div id="falling-leaf-container" style={{ background: darkMode ? 'none' : "url('/wallpaper.jpg') no-repeat center center fixed", backgroundSize: 'cover' }}>
        <button onClick={() => setDarkMode((prev) => !prev)} style={{ position: 'absolute', top: '10px', right: '10px', padding: '10px' }}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
      <div className="table-container">
        <div className="table-header">
          <h4>PHASED TASKS TABLE</h4>
          <h5>Task List</h5>
        </div>
        {tasks.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Description</th>
                  <th>Assigned To</th>
                  <th>Duration (Days)</th>
                  <th>Created On</th>
                  <th>Due By</th>
                  <th>Parent Task</th>
                  {editingTaskId !== null && <th>Actions</th>}
                </tr>
              </thead>
              {renderTableBody()}
            </table>
          </div>
        ) : <p>No tasks available.</p>}
        <ContextMenu visible={contextMenu.visible} x={contextMenu.x} y={contextMenu.y} onAddSubtask={handleAddSubtask} onClose={handleCloseContextMenu} />
        <div className="add-task-container">
          {!showForm ? (
            <button className="add-task-btn" onClick={handleAddTaskClick} style={{ backgroundColor: darkMode ? '#333' : '#f0f0f0' }}>Add Task</button>
          ) : (
            <div className="task-form-container">
              <form onSubmit={handleSubmit} className="task-form" ref={formRef}>
                <div className="form-group">
                  <label>Task Title:</label>
                  <input type="text" name="title" placeholder="Task Title" value={task.title} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Task Description:</label>
                  <textarea name="description" placeholder="Task Description" value={task.description} onChange={handleChange} required />
                </div>
                <div className="autocomplete">
                  <label>Assigned To:</label>
                  <input type="text" name="assignedTo" placeholder="Assigned To" value={task.assignedTo} onChange={handleChange} onFocus={handleAssignedToFocus} autoComplete="off" />
                  {showAssigneeSuggestions && assigneeSuggestions.length > 0 && (
                    <ul className="suggestions">
                      {assigneeSuggestions.map((suggestion, index) => (
                        <li key={index} onClick={() => handleSuggestionClick(suggestion)}>{suggestion}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="form-group">
                  <label>Duration (Days):</label>
                  <input type="number" name="duration" placeholder="Duration (days)" value={task.duration || ''} disabled onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Created On:</label>
                  <input type="datetime-local" id="createdDate" name="createdDate" value={task.createdDate} onChange={handleDateTimeChange} title="Date when the task was created." />
                </div>
                <div className="form-group">
                  <label>Due By:</label>
                  <input type="datetime-local" id="completionDate" name="completionDate" value={task.completionDate} onChange={handleDateTimeChange} title="Estimated or actual completion date." min={task.createdDate} />
                  {dueDateError && <p style={{ color: 'red', fontSize: '0.9em' }}>{dueDateError}</p>}
                </div>
                <div className="form-group">
                  <label>Parent Task:</label>
                  <select name="parentTaskId" value={task.parentTaskId} onChange={handleChange}>
                    <option value="">Main Task</option>
                    {tasks.filter((t) => t.id !== task.id).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
                <div className="form-buttons">
                  <button type="submit" className="add-task-button">Add Task</button>
                  <button type="button" className="clear-button" onClick={handleClearForm}>Clear</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <FooterClock />
    </div>
  );
}

export default App;