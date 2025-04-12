import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import FooterClock from './components/FooterClock';
import TaskGraph from './components/TaskGraph'; // Import TaskGraph
import { ReactFlowProvider } from 'reactflow';
import TaskForm from './components/TaskForm'; // Import the new component

// Main App component for task management
function App() {
  // State for managing tasks and form data
  const [tasks, setTasks] = useState([]); // List of tasks
  const [task, setTask] = useState({ title: '', description: '', assignedTo: '', duration: '', completionDate: '', createdDate: '', parentTaskId: '', progress: 0 }); // Form data for new task
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
  const [view, setView] = useState('table'); // Add view state: 'table' or 'graph'

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
      setTask({ title: '', description: '', assignedTo: '', duration: '', completionDate: '', createdDate: '', parentTaskId: '', progress: 0 });
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

    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(t => 
        t.id === taskId ? { ...editingTaskData } : t
      );
      
      // Update parent task progress if this is a subtask
      const task = updatedTasks.find(t => t.id === taskId);
      if (task.parentTaskId) {
        const parentProgress = calculateParentProgress(task.parentTaskId);
        if (parentProgress !== null) {
          return updatedTasks.map(t => 
            t.id === task.parentTaskId 
              ? { ...t, progress: parentProgress } 
              : t
          );
        }
      }
      return updatedTasks;
    });
    
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
  }

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
      progress: task.progress || 0
    };

    setTasks([...tasks, newTask]);
    setTask({ title: '', description: '', assignedTo: '', duration: '', completionDate: '', createdDate: '', parentTaskId: '' });
    setShowForm(false);
  };

  // Show the form to add a new task
  const handleAddTaskClick = () => {
    const now = new Date();
    const defaultDate = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    
    setTask({
      title: '',
      description: '',
      assignedTo: '',
      duration: '',
      completionDate: defaultDate,
      createdDate: defaultDate,
      parentTaskId: '',
      progress: 0
    });
    
    setDueDateError('');
    setShowForm(true);
    
    setTimeout(() => {
      if (taskTitleRef.current) {
        taskTitleRef.current.focus();
      }
    }, 0);
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
          <tr className="task-item" onContextMenu={(e) => handleRowRightClick(e, task.id)}>
            <td className="task-title" style={{ paddingLeft: `${level * 20 + 20}px` }}>
              {hasSubtasks && (
                <span onClick={(e) => { e.stopPropagation(); toggleExpand(task.id); }} style={{ cursor: 'pointer', marginRight: '8px' }}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
              {isEditing ? <input type="text" name="title" value={editingTaskData.title} onChange={handleEditInputChange} /> : task.title}
            </td>
            <td>
              {isEditing ? (
                <input type="text" name="description" value={editingTaskData.description} onChange={handleEditInputChange} />
              ) : task.description}
            </td>
            <td>
              {isEditing ? (
                <select value={editingTaskData.assignedTo} onChange={(e) => setEditingTaskData({ ...editingTaskData, assignedTo: e.target.value })}>
                  <option value="">Select Assignee</option>
                  {assignees.map((assignee, index) => (
                    <option key={index} value={assignee}>{assignee}</option>
                  ))}
                </select>
              ) : task.assignedTo}
            </td>
            <td>
              {isEditing ? (
                <input type="number" value={editingTaskData.duration || ''} disabled />
              ) : `${task.duration} ${task.duration === 1 ? 'day' : 'days'}`}
            </td>
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
            <td>
              {task.parentTaskId ? (
                <>
                  {tasks.find((t) => t.id === task.parentTaskId)?.title || 'Main Task'}
                  {isEditing && (
                    <select 
                      value={task.parentTaskId || ''} 
                      onChange={(e) => handleParentChange(e, task.id)} 
                      style={{ marginLeft: '10px' }}
                    >
                      <option value="">Change Parent Task</option>
                      {tasks.filter((t) => t.id !== task.id && !isDescendant(t.id, task.id, tasks)).map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  )}
                </>
              ) : 'Main Task'}
            </td>
            <td>
              {isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editingTaskData.progress || 0}
                    onChange={(e) => setEditingTaskData({
                      ...editingTaskData,
                      progress: parseInt(e.target.value)
                    })}
                  />
                  <span>{editingTaskData.progress || 0}%</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '100px',
                    height: '10px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '5px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${task.progress || 0}%`,
                      height: '100%',
                      backgroundColor: task.progress === 100 ? '#4caf50' : '#2196f3'
                    }}></div>
                  </div>
                  <span>{task.progress || 0}%</span>
                </div>
              )}
            </td>
            <td>
              {isEditing ? (
                <>
                  <button onClick={() => handleSaveTask(task.id)}>Save</button>
                  <button onClick={handleCancelEdit}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => handleEditTask(task.id)}>Edit</button>
                  <button onClick={(e) => handleDeleteTask(task.id, e)} style={{ color: 'red' }}>Delete</button>
                </>
              )}
            </td>
          </tr>
          {isExpanded && renderTasks(tasks, task.id, level + 1)}
        </React.Fragment>
      );
    });

  // Render the table body with tasks
  const renderTableBody = () => <tbody>{renderTasks(tasks)}</tbody>;

  const calculateOverallProgress = () => {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return Math.round(totalProgress / tasks.length);
  };

  const calculateParentProgress = (taskId) => {
    const subtasks = tasks.filter(t => t.parentTaskId === taskId);
    if (subtasks.length === 0) return null;
    
    const totalProgress = subtasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return Math.round(totalProgress / subtasks.length);
  };

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
          <button
            className="view-toggle"
            onClick={() => {
              console.log('Toggling view to:', view === 'table' ? 'graph' : 'table');
              setView(view === 'table' ? 'graph' : 'table');
            }}
            style={{ 
              position: 'absolute', 
              top: '2px', 
              right: '120px', 
              padding: '10px', 
              zIndex: 10 
            }}
          >
            {view === 'table' ? 'Graph View' : 'Table View'}
          </button>
        </div>
        <div className="table-container">
          <div className="table-header">
            <h4>PHASED TASKS TABLE</h4>
            <h5>{view === 'table' ? 'Task List' : 'Dependency Graph'}</h5>
          </div>
          {view === 'table' ? (
            tasks.length > 0 ? (
              
              <div className="table-wrapper">
                <br></br>
<div className="progress-summary">
  <h3>Project Progress</h3>
  <div className="overall-progress">
    <div className="progress-bar">
      <div 
        className="progress-fill" 
        style={{ 
          width: `${calculateOverallProgress()}%`,
          backgroundColor: calculateOverallProgress() === 100 ? '#4caf50' : '#2196f3'
        }}
      ></div>
    </div>
    <span>{calculateOverallProgress()}% Complete</span>
  </div>
  <div className="progress-stats">
    <div>Total Tasks: {tasks.length}</div>
    <div>Completed: {tasks.filter(t => t.progress === 100).length}</div>
    <div>In Progress: {tasks.filter(t => t.progress > 0 && t.progress < 100).length}</div>
    <div>Not Started: {tasks.filter(t => !t.progress || t.progress === 0).length}</div>
  </div>
</div>



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
                      <th>Progress</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  {renderTableBody()}
                </table>
              </div>
            ) : (
              <p className="no-tasks-message">No tasks available. Add your first task to get started!</p>
            )
          ) : (
            <div className="graph-view-container">
              {tasks.length > 0 ? (
                <ReactFlowProvider>
                  <TaskGraph 
                    tasks={tasks}
                    onNodeClick={(taskId) => {
                      const task = tasks.find(t => t.id === taskId);
                      if (task) handleEditTask(taskId);
                    }}
                  />
                </ReactFlowProvider>
              ) : (
                <div className="empty-graph-message">
                  <h3>No Tasks to Display</h3>
                  <p>Add tasks to see the dependency graph</p>
                  <button 
                    className="add-first-task-btn"
                    onClick={handleAddTaskClick}
                  >
                    Add First Task
                  </button>
                </div>
              )}
            </div>
          )}
          <ContextMenu visible={contextMenu.visible} x={contextMenu.x} y={contextMenu.y} onAddSubtask={handleAddSubtask} onClose={handleCloseContextMenu} />
          <div className="add-task-container">
            {!showForm ? (
              <button 
                className="add-task-btn" 
                onClick={handleAddTaskClick} 
                style={{ backgroundColor: darkMode ? '#333' : '#f0f0f0' }}
              >
                Add Task
              </button>
            ) : (
              <TaskForm
                task={task}
                tasks={tasks}
                onSubmit={handleSubmit}
                onChange={handleChange}
                onClear={handleClearForm}
                onDateTimeChange={handleDateTimeChange}
                onFocusAssignedTo={handleAssignedToFocus}
                onSuggestionClick={handleSuggestionClick}
                dueDateError={dueDateError}
                showAssigneeSuggestions={showAssigneeSuggestions}
                assigneeSuggestions={assigneeSuggestions}
                formRef={formRef}
                taskTitleRef={taskTitleRef}
              />
            )}
          </div>
        </div>
        <FooterClock />
      </div>
    </div>
  );
}

export default App;