import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import FooterClock from './components/FooterClock';
import TaskGraph from './components/TaskGraph';
import { ReactFlowProvider } from 'reactflow';
import TaskForm from './components/TaskForm';

// Main App component for task management
function App() {
  // Safely save tasks to localStorage with validation
  const saveTasksToStorage = (tasksToSave) => {
    if (!Array.isArray(tasksToSave)) {
      console.error('Tasks to save is not an array');
      return;
    }
    
    if (tasksToSave.some(task => !validateTaskStructure(task))) {
      console.error('Invalid task structure detected');
      return;
    }
    
    safeLocalStorage.setItem('phased-tasks', JSON.stringify(tasksToSave));
  };

  // State for tasks, form data, UI toggles, and interactions
  const [tasks, setTasks] = useState(() => {
    try {
      const savedTasks = safeLocalStorage.getItem('phased-tasks');
      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch (error) {
      console.error('Failed to load tasks from localStorage', error);
      return [];
    }
  });
  const [task, setTask] = useState({
    title: '', description: '', assignedTo: '', duration: '', completionDate: '', createdDate: '', parentTaskId: '', progress: 0
  });
  const [showForm, setShowForm] = useState(false); // Toggle task form visibility
  const [assigneeSuggestions, setAssigneeSuggestions] = useState([]); // Assignee input suggestions
  const [expandedTasks, setExpandedTasks] = useState({}); // Track expanded tasks with subtasks
  const [editingTaskId, setEditingTaskId] = useState(null); // ID of task being edited
  const [editingTaskData, setEditingTaskData] = useState({}); // Data of task being edited
  const [dueDateError, setDueDateError] = useState(''); // Date validation errors
  const [contextMenu, setContextMenu] = useState({ visible: false, taskId: null, x: 0, y: 0 }); // Right-click context menu
  const [showAssigneeSuggestions, setShowAssigneeSuggestions] = useState(false); // Assignee suggestions dropdown
  const [darkMode, setDarkMode] = useState(false); // Theme toggle (starts in light mode)
  const [isCursorActive, setIsCursorActive] = useState(true); // Cursor activity for animations
  const [view, setView] = useState('table'); // Toggle between table and graph views
  const formRef = useRef(null); // Reference to task form for click-outside detection
  const taskTitleRef = useRef(null); // Reference to focus task title input

  // Detect cursor activity for animations
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

  useEffect(() => {
    if (view === 'graph' && tasks.length > 0) {
      const tableWrapper = document.querySelector('.table-wrapper');
      const graphContainer = document.querySelector('.graph-view-container');
      if (tableWrapper && graphContainer) {
        const tableHeight = tableWrapper.offsetHeight;
        graphContainer.style.height = `${tableHeight}px`;
      }
    }
  }, [view, tasks]);

  // Initialize dark mode and tasks on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (tasks.length === 0) {
      handleLoadTasks();
    }
  }, []);

  // Safe localStorage wrapper to handle access errors
  const safeLocalStorage = {
    getItem: (key) => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('LocalStorage access denied', error);
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('LocalStorage access denied', error);
      }
    }
  };

  // Calculate duration between two dates in days
  const calculateDurationInDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate) || isNaN(endDate)) return '';
    const timeDiff = endDate - startDate;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return daysDiff > 0 ? daysDiff : 0;
  };

  // Export tasks as JSON file
  const exportTasks = async () => {
    try {
      // Format tasks as text
      const formatTask = (task, level = 0) => {
        const indent = '  '.repeat(level);
        const fields = [
          `${indent}Title: ${task.title}`,
          `${indent}Description: ${task.description}`,
          `${indent}Assigned To: ${task.assignedTo}`,
          `${indent}Duration: ${task.duration} ${task.duration === 1 ? 'day' : 'days'}`,
          `${indent}Created On: ${formatDateTime(task.createdDate)}`,
          `${indent}Due By: ${formatDateTime(task.completionDate)}`,
          `${indent}Parent Task: ${getParentTaskTitle(task.parentTaskId)}`,
          `${indent}Progress: ${task.progress || 0}%`,
        ].join('\n');
        return fields;
      };
  
    // Recursively format tasks with hierarchy
    const formatTasksHierarchy = (tasks, parentId = null, level = 0) => {
      const filteredTasks = tasks.filter((t) => t.parentTaskId === parentId);
      let result = '';
      filteredTasks.forEach((task, index) => {
        result += formatTask(task, level);
        result += '\n';
        const subtasks = formatTasksHierarchy(tasks, task.id, level + 1);
        if (subtasks) result += subtasks;
        if (index < filteredTasks.length - 1 || level > 0) result += '\n';
      });
      return result;
    };
  
    // Generate the text content
    const textContent = formatTasksHierarchy(tasks);

    // Check if File System Access API is supported
    if ('showSaveFilePicker' in window) {
      // Prompt user to choose a save location
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: 'tasks.txt',
        types: [
          {
            description: 'Text Files',
            accept: { 'text/plain': ['.txt'] },
          },
        ],
      });
      const writableStream = await fileHandle.createWritable();
      await writableStream.write(textContent);
      await writableStream.close();
    } else {
      // Fallback to default download behavior
      console.warn('File System Access API not supported. Using default download.');

  // Create and download the text file
  const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', 'tasks.txt');
      linkElement.click();
    }
  } catch (error) {
    console.error('Error exporting tasks:', error);
    alert('Failed to export tasks. Please try again.');
  }
};

const exportTasksAsJson = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dataStr = JSON.stringify(tasks, null, 2);

    // Check if File System Access API is supported
    if ('showSaveFilePicker' in window) {
      // Prompt user to choose a save location
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: `tasks-${timestamp}.json`,
        types: [
          {
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });
      const writableStream = await fileHandle.createWritable();
      await writableStream.write(dataStr);
      await writableStream.close();
    } else {
      // Fallback to default download behavior
      console.warn('File System Access API not supported. Using default download.');
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', `tasks-${timestamp}.json`);
      linkElement.click();
    }
  } catch (error) {
    console.error('Error exporting tasks as JSON:', error);
    alert('Failed to export JSON. Please try again.');
  }
};

  // Import tasks from JSON file
// Import tasks from JSON file
// Import tasks from JSON file
const importTasks = (event) => {
  const fileReader = new FileReader();
  fileReader.readAsText(event.target.files[0], "UTF-8");
  fileReader.onload = e => {
    try {
      const importedTasks = JSON.parse(e.target.result);
      if (!Array.isArray(importedTasks)) {
        alert('Invalid file format: Expected an array of tasks');
        return;
      }

      // Validate imported tasks
      if (importedTasks.some(task => !validateTaskStructure(task))) {
        alert('Invalid task structure in imported file');
        return;
      }

      // If no existing tasks, directly set imported tasks
      if (tasks.length === 0) {
        setTasks(importedTasks);
        saveTasksToStorage(importedTasks);
        alert('Tasks imported successfully');
        return;
      }

      // If there are existing tasks, prompt for merge or replace
      const mergeTasks = window.confirm('Merge imported tasks with existing tasks? Click "OK" to merge or "Cancel" to replace all existing tasks.');
      setTasks(prevTasks => {
        let mergedTasks;
        if (mergeTasks) {
          const updatedTasks = [...prevTasks];
          importedTasks.forEach(importedTask => {
            const index = updatedTasks.findIndex(task => task.id === importedTask.id);
            if (index !== -1) {
              updatedTasks[index] = importedTask; // Update existing task
            } else {
              updatedTasks.push(importedTask); // Add new task
            }
          });
          mergedTasks = updatedTasks;
        }
        saveTasksToStorage(mergedTasks);
        return mergedTasks;
      });
      alert('Tasks imported successfully');
    } catch (error) {
      alert('Error importing tasks: Invalid file format');
      console.error('Failed to import tasks', error);
    }
  };
};

  // Clear task form with confirmation
  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear all fields?')) {
      setTask({ title: '', description: '', assignedTo: '', duration: '', completionDate: '', createdDate: '', parentTaskId: '', progress: 0 });
      setDueDateError('');
      setAssigneeSuggestions([]);
      setShowAssigneeSuggestions(false);
    }
  };

  // Clear all tasks with confirmation
  const handleClearAllTasks = () => {
    if (window.confirm('Are you sure you want to delete all tasks? This action cannot be undone.')) {
      setTasks([]);
      safeLocalStorage.setItem('phased-tasks', JSON.stringify([]));
      setEditingTaskId(null);
      setEditingTaskData({});
      setExpandedTasks({});
    }
  };

  // Get parent task title by ID
  const getParentTaskTitle = (parentTaskId) => {
    if (!parentTaskId) return 'Main Task';
    const parentTask = tasks.find((t) => t.id === parentTaskId);
    return parentTask ? parentTask.title : 'Main Task';
  };

  // Check if a task is a descendant to prevent circular dependencies
  const isDescendant = (taskId, potentialParentId, tasks) => {
    let currentTaskId = potentialParentId;
    while (currentTaskId) {
      if (currentTaskId === taskId) return true;
      const currentTask = tasks.find((t) => t.id === currentTaskId);
      currentTaskId = currentTask ? currentTask.parentTaskId : null;
    }
    return false;
  };

  // Format date to DD-MM-YYYY, HH:MM AM/PM
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

  // Start editing a task
  const handleEditTask = (taskId) => {
    const taskToEdit = tasks.find((t) => t.id === taskId);
    setEditingTaskId(taskId);
    setEditingTaskData({ ...taskToEdit });
  };

  // Context menu for right-click actions
  const ContextMenu = ({ visible, x, y, onAddSubtask, onClose }) => {
    if (!visible) return null;
    return (
      <div
        style={{
          position: 'fixed', top: y, left: x, backgroundColor: 'white', color: 'black',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', zIndex: 1000, padding: '8px', borderRadius: '6px'
        }}
        className="context-menu"
      >
        <div style={{ padding: '8px', cursor: 'pointer' }} onClick={onAddSubtask}>Add Subtask</div>
        <div style={{ padding: '8px', cursor: 'pointer' }} onClick={onClose}>Close</div>
      </div>
    );
  };

  // Save edited task with date validation
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
      const updatedTasks = [...prevTasks];
      importedTasks.forEach(importedTask => {
        const index = updatedTasks.findIndex(task => task.id === importedTask.id);
        if (index !== -1) {
          updatedTasks[index] = importedTask; // Update existing task
        } else {
          updatedTasks.push(importedTask); // Add new task
        }
      });
      saveTasksToStorage(updatedTasks);
      return updatedTasks;
    });
    setEditingTaskId(null);
  };

  // Cancel task editing
  const handleCancelEdit = () => {
    const originalTask = tasks.find((t) => t.id === editingTaskId);
    setEditingTaskData({ ...originalTask });
    setEditingTaskId(null);
  };

  // Add a subtask by setting parent task ID
  const handleAddSubtask = () => {
    if (contextMenu.taskId) {
      setTask({
        title: '', description: '', assignedTo: '', duration: '', completionDate: '',
        createdDate: '', parentTaskId: contextMenu.taskId, progress: 0
      });
      setDueDateError('');
      setShowForm(true);
      setTimeout(() => taskTitleRef.current?.focus(), 0);
    }
    setContextMenu({ visible: false, taskId: null, x: 0, y: 0 });
  };

  // Close context menu
  const handleCloseContextMenu = () => setContextMenu({ visible: false, taskId: null, x: 0, y: 0 });

  // List of assignees for suggestions
  const assignees = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown', 'Charlie Davis'];

  // Handle form input changes and assignee suggestions
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
    if (name === 'assignedTo') {
      const filteredSuggestions = assignees.filter((a) => a.toLowerCase().includes(value.toLowerCase()));
      setAssigneeSuggestions(filteredSuggestions);
    }
  };

  // Select assignee from suggestions
  const handleSuggestionClick = (suggestion) => {
    setTask((prev) => ({ ...prev, assignedTo: suggestion }));
    setAssigneeSuggestions([]);
    setShowAssigneeSuggestions(false);
  };

  // Show assignee suggestions on input focus
  const handleAssignedToFocus = () => {
    setAssigneeSuggestions(assignees);
    setShowAssigneeSuggestions(true);
  };

  // Load tasks from localStorage
  const handleLoadTasks = () => {
    try {
      const savedTasks = safeLocalStorage.getItem('phased-tasks');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        if (Array.isArray(parsedTasks)) {
          setTasks(parsedTasks);
        } else {
          console.error('Loaded tasks is not an array');
        }
      }
    } catch (error) {
      console.error('Failed to load tasks', error);
    }
  };

  // Validate task structure
  const validateTaskStructure = (task) => {
    const requiredFields = ['id', 'title', 'description', 'assignedTo', 'completionDate', 'createdDate'];
    return requiredFields.every(field => field in task);
  };

  // Submit new task with validation
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task.title.trim() || !task.description.trim() || !task.assignedTo.trim() ||
        !task.createdDate || !task.completionDate) {
      alert('Please fill in all required fields.');
      return;
    }

    const currentDate = new Date();
    const createdDate = new Date(task.createdDate);
    const completionDate = new Date(task.completionDate);

    if (createdDate < currentDate || completionDate < currentDate || completionDate < createdDate) {
      setDueDateError('Invalid dates. Check Created On and Due By dates.');
      return;
    }

    const createdDateFinal = task.createdDate || new Date().toISOString().slice(0, 16);
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
    saveTasksToStorage([...tasks, newTask]);
  };

  // Show form to add new task
  const handleAddTaskClick = () => {
    const defaultDate = new Date().toISOString().slice(0, 16);
    setTask({
      title: '', description: '', assignedTo: '', duration: '', completionDate: defaultDate,
      createdDate: defaultDate, parentTaskId: '', progress: 0
    });
    setDueDateError('');
    setShowForm(true);
    setTimeout(() => taskTitleRef.current?.focus(), 0);
  };

  // Delete task and its subtasks
  const handleDeleteTask = (taskId, e) => {
    e.stopPropagation();
    const deleteTaskAndSubtasks = (id) => {
      const subtasks = tasks.filter((t) => t.parentTaskId === id);
      subtasks.forEach((subtask) => deleteTaskAndSubtasks(subtask.id));
      setTasks((prevTasks) => {
        const updatedTasks = prevTasks.filter((t) => t.id !== id);
        saveTasksToStorage(updatedTasks);
        return updatedTasks;
      });
    };

    if (window.confirm('Are you sure you want to delete this task and its subtasks?')) {
      deleteTaskAndSubtasks(taskId);
      if (editingTaskId === taskId) {
        setEditingTaskId(null);
        setEditingTaskData({});
      }
    }
  };

  // Handle clicks outside form to close if empty
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

  // Handle date input changes with validation
  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    setTask((prevTask) => {
      const updatedTask = { ...prevTask, [name]: value };
      const currentDate = new Date();

      if (name === 'createdDate' && new Date(value) < currentDate) {
        setDueDateError('Created On date and time cannot be in the past.');
      } else if (name === 'completionDate' && updatedTask.createdDate) {
        const createdDate = new Date(updatedTask.createdDate);
        const completionDate = new Date(value);
        if (completionDate < createdDate || completionDate < currentDate) {
          setDueDateError('Invalid Due By date.');
        } else {
          setDueDateError('');
        }
      } else {
        setDueDateError('');
      }

      if (updatedTask.createdDate && updatedTask.completionDate) {
        updatedTask.duration = calculateDurationInDays(updatedTask.createdDate, updatedTask.completionDate);
      }

      return updatedTask;
    });
  };

  // Cleanup date input blur timeouts
  useEffect(() => {
    return () => {
      const createdInput = document.getElementById('createdDate');
      const completionInput = document.getElementById('completionDate');
      if (createdInput?.dataset.blurTimeout) clearTimeout(createdInput.dataset.blurTimeout);
      if (completionInput?.dataset.blurTimeout) clearTimeout(completionInput.dataset.blurTimeout);
    };
  }, []);

  // Update duration for edited task
  useEffect(() => {
    if (editingTaskId && editingTaskData.createdDate && editingTaskData.completionDate) {
      const newDuration = calculateDurationInDays(editingTaskData.createdDate, editingTaskData.completionDate);
      if (newDuration !== editingTaskData.duration) {
        setEditingTaskData((prev) => ({ ...prev, duration: newDuration }));
      }
    }
  }, [editingTaskData.createdDate, editingTaskData.completionDate, editingTaskId]);

  // Change task parent with validation
  const handleParentChange = (e, taskId) => {
    const newParentId = e.target.value || null;
    if (isDescendant(newParentId, taskId, tasks)) {
      alert('Invalid parent selection.');
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, parentTaskId: newParentId } : t)));
  };

  // Toggle task expansion
  const toggleExpand = (taskId) => setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));

  // Create falling leaf animation
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

  // Handle input changes for editing task
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'createdDate' || name === 'completionDate') {
      const currentDate = new Date();
      const selectedDate = new Date(value);
      if (selectedDate < currentDate || (name === 'completionDate' && new Date(editingTaskData.createdDate) > selectedDate)) {
        setDueDateError('Invalid date selection.');
        return;
      }
    }
    setEditingTaskData((prev) => ({ ...prev, [name]: value }));
    if (name === 'assignedTo') {
      const filteredSuggestions = assignees.filter((a) => a.toLowerCase().includes(value.toLowerCase()));
      setAssigneeSuggestions(filteredSuggestions);
    }
  };

  // Handle right-click for context menu
  const handleRowRightClick = (e, taskId) => {
    e.preventDefault();
    setContextMenu({ visible: true, taskId, x: e.clientX, y: e.clientY });
  };

  // Recursively render tasks
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
            <td>{isEditing ? <input type="text" name="description" value={editingTaskData.description} onChange={handleEditInputChange} /> : task.description}</td>
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
            <td>{isEditing ? <input type="number" value={editingTaskData.duration || ''} disabled /> : `${task.duration} ${task.duration === 1 ? 'day' : 'days'}`}</td>
            <td>
              {isEditing ? (
                <input type="datetime-local" value={editingTaskData.createdDate} onChange={handleEditInputChange} name="createdDate" min={new Date().toISOString().slice(0, 16)} />
              ) : `📅 ${formatDateTime(task.createdDate)}`}
            </td>
            <td>
              {isEditing ? (
                <input type="datetime-local" value={editingTaskData.completionDate} onChange={handleEditInputChange} name="completionDate" min={editingTaskData.createdDate || new Date().toISOString().slice(0, 16)} />
              ) : `⏳ ${formatDateTime(task.completionDate)}`}
            </td>
            <td>
              {task.parentTaskId ? (
                <>
                  {tasks.find((t) => t.id === task.parentTaskId)?.title || 'Main Task'}
                  {isEditing && (
                    <select value={task.parentTaskId || ''} onChange={(e) => handleParentChange(e, task.id)} style={{ marginLeft: '10px' }}>
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
                    onChange={(e) => setEditingTaskData({ ...editingTaskData, progress: parseInt(e.target.value) })}
                  />
                  <span>{editingTaskData.progress || 0}%</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '100px', height: '10px', backgroundColor: '#e0e0e0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${task.progress || 0}%`, height: '100%', backgroundColor: task.progress === 100 ? '#4caf50' : '#2196f3' }}></div>
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

  // Render table body
  const renderTableBody = () => <tbody>{renderTasks(tasks)}</tbody>;

  // Calculate overall project progress
  const calculateOverallProgress = () => {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return Math.round(totalProgress / tasks.length);
  };

  // Calculate parent task progress based on subtasks
  const calculateParentProgress = (taskId) => {
    const subtasks = tasks.filter(t => t.parentTaskId === taskId);
    if (subtasks.length === 0) return null;
    const totalProgress = subtasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return Math.round(totalProgress / subtasks.length);
  };

  // Apply dark mode and persist preference
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Handle click-outside for form
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showForm, task]);

  // Update task duration on date changes
  useEffect(() => {
    if (task.createdDate && task.completionDate) {
      setTask((prev) => ({ ...prev, duration: calculateDurationInDays(prev.createdDate, task.completionDate) }));
    }
  }, [task.createdDate, task.completionDate]);

  // Main UI render
  return (
    <div className="App">
      <div className={`wallpaper ${darkMode ? 'dark-mode' : ''}`}></div>
      <div className={isCursorActive ? 'cursor-active' : 'no-cursor'}>
        <div id="falling-leaf-container" style={{ background: darkMode ? 'none' : "url('/wallpaper.jpg') no-repeat center center fixed", backgroundSize: 'cover' }}>
          <button className="mode-toggle" onClick={() => setDarkMode((prev) => !prev)} style={{ position: 'absolute', top: '2px', right: '20px', padding: '10px', zIndex: 10 }}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button className="view-toggle" onClick={() => setView(view === 'table' ? 'graph' : 'table')} style={{ position: 'absolute', top: '2px', right: '120px', padding: '10px', zIndex: 10 }}>
            {view === 'table' ? 'Graph View' : 'Table View'}
          </button>
        </div>
        <div className="table-container">
          <div className="table-header">
            <h4>PHASED TASKS TABLE</h4>
            <h5>{view === 'table' ? 'Task List' : 'Dependency Graph'}</h5>
            <div className="header-buttons" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={exportTasks} className="export-button">Export Tasks as Text</button>
              <button onClick={exportTasksAsJson} className="export-json-button">Export Tasks as JSON</button>
              <label className="import-button">
                Import Tasks
                <input type="file" onChange={importTasks} style={{ display: 'none' }} accept=".json" />
              </label>
              <button onClick={handleClearAllTasks} className="clear-all-button" style={{ backgroundColor: '#ff4d4d', color: 'white' }}>
                Clear All Tasks
              </button>
            </div>
          </div>
          {view === 'table' ? (
  tasks.length > 0 ? (
    <div className="table-wrapper">
      <br />
      <div className="progress-summary">
        <h3>Project Progress</h3>
        <div className="overall-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${calculateOverallProgress()}%`,
                backgroundColor: calculateOverallProgress() === 100 ? '#4caf50' : '#2196f3',
              }}
            ></div>
          </div>
          <span>{calculateOverallProgress()}% Complete</span>
        </div>
        <div className="progress-stats">
          <div>Total Tasks: {tasks.length}</div>
          <div>Completed: {tasks.filter((t) => t.progress === 100).length}</div>
          <div>In Progress: {tasks.filter((t) => t.progress > 0 && t.progress < 100).length}</div>
          <div>Not Started: {tasks.filter((t) => !t.progress || t.progress === 0).length}</div>
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
    {console.log('Rendering graph view with tasks:', tasks)}
    {tasks.length > 0 ? (
      <ReactFlowProvider>
        <TaskGraph tasks={tasks} onNodeClick={(taskId) => handleEditTask(taskId)} />
      </ReactFlowProvider>
    ) : (
      <div className="empty-graph-message">
        <h3>No Tasks to Display</h3>
        <p>Add tasks using the button below to see the dependency graph</p>
      </div>
    )}
  </div>
)}
          <ContextMenu visible={contextMenu.visible} x={contextMenu.x} y={contextMenu.y} onAddSubtask={handleAddSubtask} onClose={handleCloseContextMenu} />
          <div className="add-task-container">
            {!showForm ? (
              <button className="add-task-btn" onClick={handleAddTaskClick} style={{ backgroundColor: darkMode ? '#333' : '#f0f0f0' }}>
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