import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import FooterClock from './components/FooterClock';

// Main App component for task management
function App() {
  // State for managing tasks and form data
  const [tasks, setTasks] = useState([]); // List of tasks
  const [task, setTask] = useState({ title: '', description: '', assignedTo: '', duration: '', completionDate: '', createdDate: '', parentTaskId: '' }); // Form data for new task
  const [showForm, setShowForm] = useState(false); // Toggle for showing/hiding the task form
  const [assigneeSuggestions, setAssigneeSuggestions] = useState([]); // Suggestions for assignee input
  const [expandedTasks, setExpandedTasks] = useState({}); // Track expanded state of tasks with subtasks
  const [editingTaskId, setEditingTaskId] = useState(null); // ID of task being edited
  const [editingTaskData, setEditingTaskData] = useState({}); // Data of task being edited
  const [dueDateError, setDueDateError] = useState(''); // Error message for invalid dates
  const [contextMenu, setContextMenu] = useState({ visible: false, taskId: null, x: 0, y: 0 }); // Context menu state for right-click actions
  const [showAssigneeSuggestions, setShowAssigneeSuggestions] = useState(false); // Toggle for assignee suggestions dropdown
  const [darkMode, setDarkMode] = useState(false); // Always start in light mode
  const [isCursorActive, setIsCursorActive] = useState(true); // Track cursor activity for animations
  const formRef = useRef(null); // Reference to the task form for click-outside detection
  const taskTitleRef = useRef(null); // Reference for focus on the "Task Title" input field

  // Effect to detect cursor activity for animations
  useEffect(() => {
    let cursorTimeout;
    const handleCursorMove = () => {
      setIsCursorActive(true);
      clearTimeout(cursorTimeout);
      cursorTimeout = setTimeout(() => setIsCursorActive(false), 2000);
    };
    window.addEventListener('mousemove', handleCursorMove);
    window.addEventListener('touchmove', handleCursorMove);
    return () => {
      window.removeEventListener('mousemove', handleCursorMove);
      window.removeEventListener('touchmove', handleCursorMove);
      clearTimeout(cursorTimeout);
    };
  }, []);

  // Calculate duration between two dates in days
  const calculateDurationInDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate)) return '';
    const timeDiff = endDate - startDate;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return daysDiff > 0 ? daysDiff : 0;
  };

  // Clear the task form with confirmation
  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear all fields?')) {
      setTask({ title: '', description: '', assignedTo: '', duration: '', completionDate: '', createdDate: '', parentTaskId: '' });
      setDueDateError('');
      setAssigneeSuggestions([]);
      setShowAssigneeSuggestions(false);
    }
  };

  // Get the title of a parent task by its ID
  const getParentTaskTitle = (parentTaskId) => {
    if (!parentTaskId) return 'Main Task';
    const parentTask = tasks.find((t) => t.id === parentTaskId);
    return parentTask ? parentTask.title : 'Main Task';
  };

  // Check if a task is a descendant of another to prevent circular dependencies
  const isDescendant = (taskId, potentialParentId, tasks) => {
    let currentTaskId = potentialParentId;
    while (currentTaskId) {
      if (currentTaskId === taskId) return true;
      const currentTask = tasks.find((t) => t.id === currentTaskId);
      currentTaskId = currentTask ? currentTask.parentTaskId : null;
    }
    return false;
  };

  // Format a date string into a readable format (DD-MM-YYYY, HH:MM AM/PM)
  const formatDateTime = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = date.getHours() % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${day}-${month}-${year}, ${hours}:${minutes} ${ampm}`;
  };

  // Start editing a task by setting its ID and data
  const handleEditTask = (taskId) => {
    const taskToEdit = tasks.find((t) => t.id === taskId);
    setEditingTaskId(taskId);
    setEditingTaskData({ ...taskToEdit });
  };

  // Context menu component for right-click actions
  const ContextMenu = ({ visible, x, y, onAddSubtask, onClose }) => {
    if (!visible) return null;
    return (
      <div style={{ position: 'fixed', top: y, left: x, backgroundColor: 'white', color: 'black', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', zIndex: 1000, padding: '8px', borderRadius: '6px' }} className="context-menu">
        <div style={{ padding: '8px', cursor: 'pointer' }} onClick={onAddSubtask}>Add Subtask</div>
        <div style={{ padding: '8px', cursor: 'pointer' }} onClick={onClose}>Close</div>
      </div>
    );
  };

  // Save edited task after validation
  const handleSaveTask = (taskId) => {
    const currentDate = new Date();
    const createdDate = new Date(editingTaskData.createdDate);
    const completionDate = new Date(editingTaskData.completionDate);

    if (createdDate < currentDate) {
      setDueDateError('Created On date and time cannot be in the past.');
      return;
    }

    if (completionDate < createdDate) {
      setDueDateError('Due By date and time cannot be earlier than Created On.');
      return;
    }

    if (completionDate < currentDate) {
      setDueDateError('Due By date and time cannot be in the past.');
      return;
    }

    setTasks((prevTasks) => prevTasks.map((t) => (t.id === taskId ? { ...editingTaskData } : t)));
    setEditingTaskId(null);
  };

  // Cancel editing and revert changes
  const handleCancelEdit = () => {
    const originalTask = tasks.find((t) => t.id === editingTaskId);
    setEditingTaskData({ ...originalTask });
    setEditingTaskId(null);
  };

  // Add a subtask by setting the parent task ID and showing the form
  const handleAddSubtask = () => {
    if (contextMenu.taskId) {
      setTask({
        title: '',
        description: '',
        assignedTo: '',
        duration: '',
        completionDate: '',
        createdDate: '',
        parentTaskId: contextMenu.taskId // Set the parent task ID from context menu
      });
      setDueDateError('');
      setShowForm(true);
      setTimeout(() => {
        if (taskTitleRef.current) {
          taskTitleRef.current.focus();
        }
      }, 0); // Ensure DOM is updated before focusing
    }
    setContextMenu({ visible: false, taskId: null, x: 0, y: 0 });
  };

  // Close the context menu
  const handleCloseContextMenu = () => setContextMenu({ visible: false, taskId: null, x: 0, y: 0 });

  // List of available assignees for suggestions
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

  // Select an assignee from suggestions
  const handleSuggestionClick = (suggestion) => {
    setTask((prev) => ({ ...prev, assignedTo: suggestion }));
    setAssigneeSuggestions([]);
    setShowAssigneeSuggestions(false);
  };

  // Show assignee suggestions when the input is focused
  const handleAssignedToFocus = () => {
    setAssigneeSuggestions(assignees);
    setShowAssigneeSuggestions(true);
  };

  // Submit the form to add a new task
  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if required fields are filled
    if (!task.title.trim() || !task.description.trim()) {
      alert('Please fill in Task Title and Description.');
      return;
    }
    if (!task.assignedTo.trim()) {
      alert('Please select an assignee for the task.');
      return;
    }
    if (!task.createdDate) {
      alert('Please specify the Created On date and time.');
      return;
    }
    if (!task.completionDate) {
      alert('Please specify the Due By date and time.');
      return;
    }

    const currentDate = new Date();
    const createdDate = new Date(task.createdDate);
    const completionDate = new Date(task.completionDate);

    if (createdDate < currentDate) {
      setDueDateError('Created On date and time cannot be in the past.');
      return;
    }

    if (completionDate < createdDate) {
      setDueDateError('Due By date and time cannot be earlier than Created On.');
      return;
    }

    if (completionDate < currentDate) {
      setDueDateError('Due By date and time cannot be in the past.');
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedNow = `${year}-${month}-${day}T${hours}:${minutes}`;

    const createdDateFinal = task.createdDate || formattedNow;
    const durationInDays = task.duration || calculateDurationInDays(createdDateFinal, task.completionDate);

    const newTask = {
      id: Date.now().toString(),
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      duration: durationInDays,
      completionDate: task.completionDate,
      createdDate: createdDateFinal,
      parentTaskId: task.parentTaskId || null,
      subtasks: [],
    };

    setTasks([...tasks, newTask]);
    setTask({ title: '', description: '', assignedTo: '', duration: '', completionDate: '', createdDate: '', parentTaskId: '' });
    setShowForm(false);
  };

  // Show the form to add a new task
  const handleAddTaskClick = () => {
    setTask({
      title: '',
      description: '',
      assignedTo: '',
      duration: '',
      completionDate: '',
      createdDate: '',
      parentTaskId: ''
    });
    setDueDateError('');
    setShowForm(true);
    // Focus the Task Title input after the form is shown
    setTimeout(() => {
      if (taskTitleRef.current) {
        taskTitleRef.current.focus();
      }
    }, 0); // Timeout ensures the DOM is updated
  };

  // Recursively delete a task and its subtasks
const handleDeleteTask = (taskId, e) => {
  e.stopPropagation(); // Prevent the row's onClick from firing
  const deleteTaskAndSubtasks = (id) => {
    // Find all subtasks of the current task
    const subtasks = tasks.filter((t) => t.parentTaskId === id);
    // Recursively delete each subtask
    subtasks.forEach((subtask) => deleteTaskAndSubtasks(subtask.id));
    // Remove the task itself
    setTasks((prevTasks) => prevTasks.filter((t) => t.id !== id));
  };

  if (window.confirm('Are you sure you want to delete this task and its subtasks?')) {
    deleteTaskAndSubtasks(taskId);
    // If the deleted task was being edited, clear the editing state
    if (editingTaskId === taskId) {
      setEditingTaskId(null);
      setEditingTaskData({});
    }
  }
};

  // Handle clicks outside the form to close it if empty
  const handleClickOutside = (e) => {
    if (formRef.current && !formRef.current.contains(e.target) && !task.title.trim() && !task.description.trim()) {
      if (!e.target.closest('.mode-toggle')) {
        setShowForm(false);
      }
    }
    const assigneeInput = document.querySelector('input[name="assignedTo"]');
    const suggestionsList = document.querySelector('.suggestions');
    if (assigneeInput && !assigneeInput.contains(e.target) && suggestionsList && !suggestionsList.contains(e.target)) {
      setShowAssigneeSuggestions(false);
    }
  };

  // Handle date and time input changes with validation
  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    setTask((prevTask) => {
      const updatedTask = { ...prevTask, [name]: value };
      const currentDate = new Date();

      if (name === 'createdDate') {
        const selectedDate = new Date(value);
        if (selectedDate < currentDate) {
          setDueDateError('Created On date and time cannot be in the past.');
        } else {
          setDueDateError('');
        }
      }

      if (name === 'completionDate' && updatedTask.createdDate) {
        const createdDate = new Date(updatedTask.createdDate);
        const completionDate = new Date(value);
        if (completionDate < createdDate) {
          setDueDateError('Due By date and time cannot be earlier than Created On.');
        } else if (completionDate < currentDate) {
          setDueDateError('Due By date and time cannot be in the past.');
        } else {
          setDueDateError('');
        }
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

  // Cleanup for date input blur timeouts
  useEffect(() => {
    return () => {
      const createdInput = document.getElementById('createdDate');
      const completionInput = document.getElementById('completionDate');
      if (createdInput?.dataset.blurTimeout) clearTimeout(createdInput.dataset.blurTimeout);
      if (completionInput?.dataset.blurTimeout) clearTimeout(completionInput.dataset.blurTimeout);
    };
  }, []);

  // Update duration when editing task dates change
  useEffect(() => {
    if (editingTaskId && editingTaskData.createdDate && editingTaskData.completionDate) {
      const newDuration = calculateDurationInDays(editingTaskData.createdDate, editingTaskData.completionDate);
      if (newDuration !== editingTaskData.duration) {
        setEditingTaskData((prev) => ({ ...prev, duration: newDuration }));
      }
    }
  }, [editingTaskData.createdDate, editingTaskData.completionDate, editingTaskId]);

  // Change the parent task of a task with validation
  const handleParentChange = (e, taskId) => {
    const newParentId = e.target.value || null;
    if (isDescendant(newParentId, taskId, tasks)) {
      alert('Invalid parent selection. A task cannot be its own parent or a subtask of its own subtasks.');
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, parentTaskId: newParentId } : t)));
  };

  // Toggle the expanded state of a task with subtasks
  const toggleExpand = (taskId) => setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));

  // Handle row click to start editing a task
  const handleRowClick = (taskId, e) => {
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'select') return;
    if (editingTaskId !== taskId) handleEditTask(taskId);
  };

  // Create falling leaf animation effect
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

  // Handle input changes during task editing with validation
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'createdDate') {
      const currentDate = new Date();
      const selectedDate = new Date(value);

      if (selectedDate < currentDate) {
        setDueDateError('Created On date and time cannot be in the past.');
        return;
      } else {
        setDueDateError('');
      }

      if (editingTaskData.completionDate && new Date(editingTaskData.completionDate) < selectedDate) {
        setDueDateError('Due By date and time cannot be earlier than Created On.');
        return;
      }
    }

    if (name === 'completionDate' && editingTaskData.createdDate) {
      const createdDate = new Date(editingTaskData.createdDate);
      const completionDate = new Date(value);
      const currentDate = new Date();

      if (completionDate < createdDate) {
        setDueDateError('Due By date and time cannot be earlier than Created On.');
        return;
      }

      if (completionDate < currentDate) {
        setDueDateError('Due By date and time cannot be in the past.');
        return;
      }

      setDueDateError('');
    }

    setEditingTaskData((prev) => ({ ...prev, [name]: value }));

    if (name === 'assignedTo') {
      const filteredSuggestions = assignees.filter((a) => a.toLowerCase().includes(value.toLowerCase()));
      setAssigneeSuggestions(filteredSuggestions);
    }
  };

  // Handle right-click to show context menu
  const handleRowRightClick = (e, taskId) => {
    e.preventDefault();
    setContextMenu({ visible: true, taskId, x: e.clientX, y: e.clientY });
  };

  // Recursively render tasks and their subtasks
  const renderTasks = (tasks, parentId = null, level = 0) =>
    tasks.filter((t) => t.parentTaskId === parentId).map((task) => {
      const hasSubtasks = tasks.some((t) => t.parentTaskId === task.id);
      const isExpanded = expandedTasks[task.id];
      const isEditing = editingTaskId === task.id;
      return (
        <React.Fragment key={task.id}>
          <tr className="task-item" onClick={(e) => handleRowClick(task.id, e)} onContextMenu={(e) => handleRowRightClick(e, task.id)}>
            <td className="task-title" style={{ paddingLeft: `${level * 20 + 20}px` }}>
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
            <td>
              {isEditing ? (
                <input
                  type="datetime-local"
                  value={editingTaskData.createdDate}
                  onChange={handleEditInputChange}
                  name="createdDate"
                  min={new Date().toISOString().slice(0, 16)}
                />
              ) : (
                `📅 ${formatDateTime(task.createdDate)}`
              )}
            </td>
            <td>
              {isEditing ? (
                <input
                  type="datetime-local"
                  value={editingTaskData.completionDate}
                  onChange={handleEditInputChange}
                  name="completionDate"
                  min={editingTaskData.createdDate || new Date().toISOString().slice(0, 16)}
                />
              ) : (
                `⏳ ${formatDateTime(task.completionDate)}`
              )}
            </td>
            <td>{task.parentTaskId ? (
              <>
                {tasks.find((t) => t.id === task.parentTaskId)?.title || 'Main Task'}
                <select value={task.parentTaskId || ''} onChange={(e) => handleParentChange(e, task.id)} style={{ marginLeft: '10px' }}>
                  <option value="">Change Parent Task</option>
                  {tasks.filter((t) => t.id !== task.id && !isDescendant(t.id, task.id, tasks)).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </>
            ) : 'Main Task'}</td>
            <td>
              {isEditing ? (
                <>
                  <button onClick={() => handleSaveTask(task.id)}>Save</button>
                  <button onClick={handleCancelEdit}>Cancel</button>
                </>
              ) : (
                <button onClick={(e) => handleDeleteTask(task.id, e)} style={{ color: 'red' }}>Delete</button>
              )}
            </td>
          </tr>
          {isExpanded && renderTasks(tasks, task.id, level + 1)}
        </React.Fragment>
      );
    });

  // Render the table body with tasks
  const renderTableBody = () => <tbody>{renderTasks(tasks)}</tbody>;

  // Apply dark mode and persist in localStorage
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Add event listener for click-outside detection
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showForm, task]);

  // Update task duration when created/completion dates change
  useEffect(() => {
    if (task.createdDate && task.completionDate) {
      setTask((prev) => ({ ...prev, duration: calculateDurationInDays(prev.createdDate, task.completionDate) }));
    }
  }, [task.createdDate, task.completionDate]);

  // Render the main UI
  return (
    <div className="App">
      <div className={`wallpaper ${darkMode ? 'dark-mode' : ''}`}></div>
      <div className={isCursorActive ? 'cursor-active' : 'no-cursor'}>
        <div id="falling-leaf-container" style={{ background: darkMode ? 'none' : "url('/wallpaper.jpg') no-repeat center center fixed", backgroundSize: 'cover' }}>
          <button
            className="mode-toggle"
            onClick={() => setDarkMode((prev) => !prev)}
            style={{ position: 'absolute', top: '2px', right: '20px', padding: '10px', zIndex: 10 }}
          >
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
                    <th>Actions</th>
                    
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
                    <input type="text" name="title" placeholder="Task Title" value={task.title} onChange={handleChange} required ref={taskTitleRef} />
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
                    <input
                      type="datetime-local"
                      id="createdDate"
                      name="createdDate"
                      value={task.createdDate}
                      onChange={handleDateTimeChange}
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
                      onChange={handleDateTimeChange}
                      min={task.createdDate || new Date().toISOString().slice(0, 16)}
                      title="Estimated or actual completion date."
                    />
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
    </div>
  );
}

export default App;