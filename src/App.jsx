import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import FooterClock from './components/FooterClock';

function App() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState({ title: '', description: '', assignedTo: '', duration: '', completionDate: '', createdDate: '', parentTaskId: '' });
  const [showForm, setShowForm] = useState(false);
  const [assigneeSuggestions, setAssigneeSuggestions] = useState([]);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskData, setEditingTaskData] = useState({});
  const [dueDateError, setDueDateError] = useState('');
  const [contextMenu, setContextMenu] = useState({ visible: false, taskId: null, x: 0, y: 0 });
  const [showAssigneeSuggestions, setShowAssigneeSuggestions] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const formRef = useRef(null);
  const [isCursorActive, setIsCursorActive] = useState(true);

  // Cursor activity detection
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

  const calculateDurationInDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate)) return '';
    const timeDiff = endDate - startDate;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return daysDiff > 0 ? daysDiff : 0;
  };

  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear all fields?')) {
      setTask({ title: '', description: '', assignedTo: '', duration: '', completionDate: '', createdDate: '', parentTaskId: '' });
      setDueDateError('');
      setAssigneeSuggestions([]);
      setShowAssigneeSuggestions(false);
    }
  };

  const getParentTaskTitle = (parentTaskId) => {
    if (!parentTaskId) return 'Main Task';
    const parentTask = tasks.find((t) => t.id === parentTaskId);
    return parentTask ? parentTask.title : 'Main Task';
  };

  const isDescendant = (taskId, potentialParentId, tasks) => {
    let currentTaskId = potentialParentId;
    while (currentTaskId) {
      if (currentTaskId === taskId) return true;
      const currentTask = tasks.find((t) => t.id === currentTaskId);
      currentTaskId = currentTask ? currentTask.parentTaskId : null;
    }
    return false;
  };

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

  const handleEditTask = (taskId) => {
    const taskToEdit = tasks.find((t) => t.id === taskId);
    setEditingTaskId(taskId);
    setEditingTaskData({ ...taskToEdit });
  };

  const ContextMenu = ({ visible, x, y, onAddSubtask, onClose }) => {
    if (!visible) return null;
    return (
      <div style={{ position: 'fixed', top: y, left: x, backgroundColor: 'white', color: 'black', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', zIndex: 1000, padding: '8px', borderRadius: '6px' }} className="context-menu">
        <div style={{ padding: '8px', cursor: 'pointer' }} onClick={onAddSubtask}>Add Subtask</div>
        <div style={{ padding: '8px', cursor: 'pointer' }} onClick={onClose}>Close</div>
      </div>
    );
  };

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

  const handleCancelEdit = () => {
    const originalTask = tasks.find((t) => t.id === editingTaskId);
    setEditingTaskData({ ...originalTask });
    setEditingTaskId(null);
  };

  const handleAddSubtask = () => {
    if (contextMenu.taskId) {
      setTask((prev) => ({ ...prev, parentTaskId: contextMenu.taskId }));
      setShowForm(true);
    }
    setContextMenu({ visible: false, taskId: null, x: 0, y: 0 });
  };

  const handleCloseContextMenu = () => setContextMenu({ visible: false, taskId: null, x: 0, y: 0 });

  const assignees = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown', 'Charlie Davis'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
    if (name === 'assignedTo') {
      const filteredSuggestions = assignees.filter((a) => a.toLowerCase().includes(value.toLowerCase()));
      setAssigneeSuggestions(filteredSuggestions);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setTask((prev) => ({ ...prev, assignedTo: suggestion }));
    setAssigneeSuggestions([]);
    setShowAssigneeSuggestions(false);
  };

  const handleAssignedToFocus = () => {
    setAssigneeSuggestions(assignees);
    setShowAssigneeSuggestions(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task.title.trim() || !task.description.trim()) return;

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
  };

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

  useEffect(() => {
    return () => {
      const createdInput = document.getElementById('createdDate');
      const completionInput = document.getElementById('completionDate');
      if (createdInput?.dataset.blurTimeout) clearTimeout(createdInput.dataset.blurTimeout);
      if (completionInput?.dataset.blurTimeout) clearTimeout(completionInput.dataset.blurTimeout);
    };
  }, []);

  useEffect(() => {
    if (editingTaskId && editingTaskData.createdDate && editingTaskData.completionDate) {
      const newDuration = calculateDurationInDays(editingTaskData.createdDate, editingTaskData.completionDate);
      if (newDuration !== editingTaskData.duration) {
        setEditingTaskData((prev) => ({ ...prev, duration: newDuration }));
      }
    }
  }, [editingTaskData.createdDate, editingTaskData.completionDate, editingTaskId]);

  const handleParentChange = (e, taskId) => {
    const newParentId = e.target.value || null;
    if (isDescendant(newParentId, taskId, tasks)) {
      alert('Invalid parent selection. A task cannot be its own parent or a subtask of its own subtasks.');
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, parentTaskId: newParentId } : t)));
  };

  const toggleExpand = (taskId) => setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));

  const handleRowClick = (taskId, e) => {
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'select') return;
    if (editingTaskId !== taskId) handleEditTask(taskId);
  };

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

  const handleRowRightClick = (e, taskId) => {
    e.preventDefault();
    setContextMenu({ visible: true, taskId, x: e.clientX, y: e.clientY });
  };

  const renderTasks = (tasks, parentId = null, level = 0) =>
    tasks.filter((t) => t.parentTaskId === parentId).map((task) => {
      const hasSubtasks = tasks.some((t) => t.parentTaskId === task.id);
      const isExpanded = expandedTasks[task.id];
      const isEditing = editingTaskId === task.id;
      return (
        <React.Fragment key={task.id}>
          <tr className="task-item" onClick={(e) => handleRowClick(task.id, e)} onContextMenu={(e) => handleRowRightClick(e, task.id)}>
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

  const renderTableBody = () => <tbody>{renderTasks(tasks)}</tbody>;

  // Dark mode toggle effect
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
    // Remove direct background manipulation from body
  }, [darkMode]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showForm, task]);

  useEffect(() => {
    if (task.createdDate && task.completionDate) {
      setTask((prev) => ({ ...prev, duration: calculateDurationInDays(prev.createdDate, task.completionDate) }));
    }
  }, [task.createdDate, task.completionDate]);

  return (
    <div className="App">
      <div className={`wallpaper ${darkMode ? 'dark-mode' : ''}`}></div>
      <div className={isCursorActive ? 'cursor-active' : 'no-cursor'}>
        <div id="falling-leaf-container" style={{ background: darkMode ? 'none' : "url('/wallpaper.jpg') no-repeat center center fixed", backgroundSize: 'cover' }}>
          <button
            className="mode-toggle"
            onClick={() => setDarkMode((prev) => !prev)}
            style={{ position: 'absolute', top: '10px', right: '10px', padding: '10px' }}
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