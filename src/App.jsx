import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import FooterClock from "./components/FooterClock";
import AssigneeInput from './components/AssigneeInput';
import styled from 'styled-components';

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
  const [expandedTasks, setExpandedTasks] = useState({});
  const formRef = useRef(null);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskData, setEditingTaskData] = useState({});

  const [editError, setEditError] = useState('');

  const [dueDateError, setDueDateError] = useState(''); // State for error message

  // Function to calculate duration in days
  const calculateDurationInDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate) || isNaN(endDate)) return ""; // Return empty if dates are invalid

    const timeDiff = endDate - startDate; // Difference in milliseconds
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert to days

    return daysDiff > 0 ? daysDiff : 0; // Prevent negative values
  };

  const getParentTaskTitle = (parentTaskId) => {
    if (!parentTaskId) return "Main Task";
    const parentTask = tasks.find((task) => task.id === parentTaskId);
    return parentTask ? parentTask.title : "Main Task";
  };


  // Define isDescendant function
  const isDescendant = (taskId, potentialParentId, tasks) => {
    let currentTaskId = potentialParentId;

    while (currentTaskId !== null) {
      if (currentTaskId === taskId) {
        return true; // The task is a descendant of the potential parent
      }

      const currentTask = tasks.find((t) => t.id === currentTaskId);
      currentTaskId = currentTask ? currentTask.parentTaskId : null;
    }

    return false; // The task is not a descendant
  };

  const createdDateRef = useRef(null);
  const completionDateRef = useRef(null);

  const formatDateTime = (isoDate) => {
    if (!isoDate) return "N/A";

    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;

    return `${year}-${month}-${day}, ${hours}:${minutes} ${ampm}`;
  };

  const handleEditTask = (taskId) => {
    const taskToEdit = tasks.find((task) => task.id === taskId);
    setEditingTaskId(taskId);
    setEditingTaskData({ ...taskToEdit }); // Include parentTaskId
  };

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    taskId: null,
    x: 0,
    y: 0,
  });

  const [showAssigneeSuggestions, setShowAssigneeSuggestions] = useState(false);

  const ContextMenu = ({ visible, x, y, onAddSubtask, onClose }) => {
    if (!visible) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: y,
          left: x,
          backgroundColor: 'white', // Default background for light mode
          color: 'black', // Default text color for light mode
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          padding: '8px',
          borderRadius: '6px',
        }}
        className="context-menu" // Add the context-menu class
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



  const Button = styled.button`
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #45a049;
  }
`;

  const handleSaveTask = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...editingTaskData } : task
      )
    );
    setEditingTaskId(null); // Exit edit mode
  };

  const handleCancelEdit = () => {
    const originalTask = tasks.find((task) => task.id === editingTaskId);
    setEditingTaskData({ ...originalTask }); // Reset to original data
    setEditingTaskId(null); // Exit edit mode
  };

  const handleAddSubtask = () => {
    if (contextMenu.taskId) {
      setTask((prevTask) => ({
        ...prevTask,
        parentTaskId: contextMenu.taskId,
      }));
      setShowForm(true);
    }
    setContextMenu({ visible: false, taskId: null, x: 0, y: 0 });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, taskId: null, x: 0, y: 0 });
  };

  const assignees = [
    'John Doe',
    'Jane Smith',
    'Alice Johnson',
    'Bob Brown',
    'Charlie Davis',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));

    if (name === 'assignedTo') {
      const filteredSuggestions = assignees.filter((assignee) =>
        assignee.toLowerCase().includes(value.toLowerCase())
      );
      setAssigneeSuggestions(filteredSuggestions);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setTask((prev) => ({ ...prev, assignedTo: suggestion }));
    setAssigneeSuggestions([]);
    setShowAssigneeSuggestions(false); // Hide suggestions
  };

  const handleAssignedToFocus = () => {
    setAssigneeSuggestions(assignees);
    setShowAssigneeSuggestions(true); // Show suggestions
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!task.title.trim() || !task.description.trim()) return;

    const durationInDays = task.duration ? task.duration : calculateDurationInDays(task.createdDate, task.completionDate);

    const newTask = {
      id: Date.now().toString(), // Ensure unique ID
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      duration: durationInDays,
      completionDate: task.completionDate,
      createdDate: new Date().toISOString(),
      parentTaskId: task.parentTaskId || null, // Include parentTaskId
      subtasks: [],
    };

    setTasks([...tasks, newTask]);

    // Reset the form
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
    setTask((prevTask) => ({
      ...prevTask,
      parentTaskId: '', // Allow the task to be a main task by default
    }));
    setShowForm(true);
  };

  const handleClickOutside = (e) => {
    // Check if clicked outside the form
    if (formRef.current && !formRef.current.contains(e.target)) {
      // Check if no input values are entered
      if (!task.title.trim() && !task.description.trim()) {
        setShowForm(false); // Close form if no data entered
      }
    }

    // Check if clicked outside the assignee suggestions
    const assigneeInput = document.querySelector('input[name="assignedTo"]');
    const suggestionsList = document.querySelector('.suggestions');

    if (
      assigneeInput &&
      !assigneeInput.contains(e.target) &&
      suggestionsList &&
      !suggestionsList.contains(e.target)
    ) {
      setShowAssigneeSuggestions(false); // Hide suggestions
    }
  };

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;

    setTask((prevTask) => {
      const updatedTask = { ...prevTask, [name]: value };

      // Validate Created On date
      if (name === 'createdDate') {
        const selectedDate = new Date(value);
        const currentDate = new Date();

        if (selectedDate < currentDate) {
          setDueDateError('Created On date cannot be earlier than the current date.');
          return prevTask; // Do not update the state if the date is invalid
        } else {
          setDueDateError(''); // Clear error if valid
        }
      }

      // Validate Due By date
      if (name === 'completionDate' && updatedTask.createdDate) {
        const createdDate = new Date(updatedTask.createdDate);
        const completionDate = new Date(value);

        if (completionDate < createdDate) {
          setDueDateError('Due By date cannot be earlier than Created On date.');
        } else {
          setDueDateError(''); // Clear error if valid
        }
      }

      // Recalculate duration dynamically
      if (updatedTask.createdDate && updatedTask.completionDate) {
        updatedTask.duration = calculateDurationInDays(updatedTask.createdDate, updatedTask.completionDate);
      }

      return updatedTask;
    });
  };



  const handleParentChange = (e, taskId) => {
    const newParentId = e.target.value === '' ? null : e.target.value;

    const taskToModify = tasks.find((task) => task.id === taskId);

    // Check if the new parent is a descendant of the current task
    if (isDescendant(newParentId, taskId, tasks)) {
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

  const toggleExpand = (taskId) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleRowClick = (taskId, e) => {
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'select') {
      return; // Ignore clicks on input or select elements
    }

    if (editingTaskId === taskId) {
      // If already in edit mode, do nothing (wait for explicit Save or Cancel)
      return;
    } else {
      // Enter edit mode
      handleEditTask(taskId);
    }
  };

  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
  }

  useEffect(() => {
    const numLeaves = 20; // Number of falling leaves
    const leafContainer = document.getElementById('falling-leaf-container');

    for (let i = 0; i < numLeaves; i++) {
      const leaf = document.createElement('div');
      leaf.classList.add('leaf');
      leaf.style.left = `${Math.random() * 100}%`; // Random horizontal position
      leaf.style.animationDuration = `${Math.random() * 5 + 5}s`; // Random fall speed
      leaf.style.animationDelay = `${Math.random() * 5}s`; // Random start time
      leafContainer.appendChild(leaf);
    }
  }, []);

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;

    if (
      (name === 'title' || name === 'description') &&
      !/^[a-zA-Z0-9\s]*$/.test(value) // Allow numbers
    ) {
      return;
    }

    if (name === 'assignedTo') {
      const isValidAssignee = assignees.includes(value);
      if (!isValidAssignee && value.trim() !== '') {
        return;
      }
    }

    setEditingTaskData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === 'assignedTo') {
      const filteredSuggestions = assignees.filter((assignee) =>
        assignee.toLowerCase().includes(value.toLowerCase())
      );
      setAssigneeSuggestions(filteredSuggestions);
    }
  };

  const handleRowRightClick = (e, taskId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      taskId: taskId,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const renderTasks = (tasks, parentId = null, level = 0) => {
    return tasks
      .filter((task) => task.parentTaskId == parentId)
      .map((task) => {
        const hasSubtasks = tasks.some((t) => t.parentTaskId == task.id);
        const isExpanded = expandedTasks[task.id];
        const isEditing = editingTaskId === task.id;

        return (
          <React.Fragment key={task.id}>
            <tr
              key={task.id}
              onClick={(e) => handleRowClick(task.id, e)}
              onContextMenu={(e) => handleRowRightClick(e, task.id)}
            >
              <td className="task-title" style={{ paddingLeft: `${level * 20 + 10}px` }}>
                {hasSubtasks && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(task.id);
                    }}
                    style={{ cursor: 'pointer', marginRight: '8px' }}
                  >
                    {isExpanded ? '▼' : '▶'}
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
                    value={editingTaskData.duration || ""}
                    disabled
                  />
                ) : (
                  `${task.duration} ${task.duration === 1 ? "day" : "days"}`
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
                  `📅 ${formatDateTime(task.createdDate)}`
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
                  `⏳ ${formatDateTime(task.completionDate)}`
                )}
              </td>
              <td>
                {task.parentTaskId ? ( // If it's a subtask
                  <>
                    {tasks.find((t) => t.id === task.parentTaskId)?.title || "Main Task"} {/* Display parent task title */}
                    <select
                      value={task.parentTaskId || ''}
                      onChange={(e) => handleParentChange(e, task.id)}
                      style={{ marginLeft: '10px' }} // Add some spacing
                    >
                      <option value="">Change Parent Task</option>
                      {tasks
                        .filter(
                          (t) =>
                            t.id !== task.id && // Exclude the current task
                            !isDescendant(t.id, task.id, tasks) // Exclude descendants
                        )
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} {/* Display the title of the parent task */}
                          </option>
                        ))}
                    </select>
                  </>
                ) : (
                  "Main Task" // If it's a main task, just display "Main Task"
                )}
              </td>
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
  };

  const renderTableBody = () => {
    const rows = renderTasks(tasks);
    return <tbody>{rows}</tbody>;
  };

  const formatDuration = (days) => `${days} day${days !== 1 ? "s" : ""}`;

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const [wallpaperHidden, setWallpaperHidden] = useState(() => {
    return darkMode; // Hide wallpaper if dark mode is on
  });

  const assigneeRef = useRef(null); // Add this line at the top of your component

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      document.body.style.background = "none"; // Hide wallpaper
    } else {
      document.body.classList.remove("dark-mode");
      document.body.style.background = "url('/wallpaper.jpg') no-repeat center center fixed";
      document.body.style.backgroundSize = "cover";
    }
  }, [darkMode]);


  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showForm, task]);

  useEffect(() => {
    if (task.createdDate && task.completionDate) {
      setTask((prevTask) => ({
        ...prevTask,
        duration: calculateDurationInDays(prevTask.createdDate, task.completionDate),
      }));
    }
  }, [task.createdDate, task.completionDate]);



  useEffect(() => {
    function handleClickOutside(event) {
      if (
        showForm && // Only check if the form is open
        formRef.current &&
        !formRef.current.contains(event.target) // If clicked outside the form
      ) {
        // Check if no input values are entered
        if (!task.title.trim() && !task.description.trim()) {
          setShowForm(false); // Close form if no data entered
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showForm, task]); // Depend on `task` to detect changes in input



  return (
    <div className="App">
      {/* Dark Mode Button */}
      <div id="falling-leaf-container"
        style={{
          background: wallpaperHidden ? "none" : "url('/wallpaper.jpg') no-repeat center center fixed",
          backgroundSize: "cover",

        }}

      >
        <button
          onClick={() => setDarkMode((prev) => !prev)}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            padding: "10px",
          }}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <div className="table-container">
        <div class="table-header">
          <h4>PHASED TASKS TABLE</h4>
          <h5>Task List</h5>
        </div>
        {tasks.length > 0 ? (
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Description</th>
                  <th>Assigned To</th>
                  <th>Duration (Days)</th> {/* Updated column header */}
                  <th>Created On</th>
                  <th>Due By</th>
                  <th>Parent Task</th>
                  {editingTaskId !== null && <th>Actions</th>}
                </tr>
              </thead>
              {renderTableBody()}
            </table>
          </div>
        ) : (
          <p>No tasks available.</p>
        )}

        <ContextMenu
          visible={contextMenu.visible}
          x={contextMenu.x}
          y={contextMenu.y}
          onAddSubtask={handleAddSubtask}
          onClose={handleCloseContextMenu}
        />

        <div className="add-task-container">
          {!showForm ? (
            <button
              className="add-task-btn"
              onClick={handleAddTaskClick}
              style={{

                backgroundColor: darkMode ? '#333' : '#f0f0f0', // Optional: Adjust background color
              }}
            >
              Add Task
            </button>

          ) : (
            <div className="task-form-container">
              <form onSubmit={handleSubmit} className="task-form" ref={formRef}>

                <div className="form-group">
                  <label>Task Title:</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Task Title"
                    value={task.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Task Description:</label>
                  <textarea
                    name="description"
                    placeholder="Task Description"
                    value={task.description}
                    onChange={handleChange}
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
                    onChange={handleChange}
                    onFocus={handleAssignedToFocus}
                    autoComplete="off"
                  />
                  {showAssigneeSuggestions && assigneeSuggestions.length > 0 && (
                    <ul className="suggestions">
                      {assigneeSuggestions.map((suggestion, index) => (
                        <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
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
                    value={task.duration || ""}
                    disabled
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Created On:</label>
                  <input
                    type="datetime-local"
                    id="createdDate"
                    name="createdDate"
                    value={task.createdDate}
                    ref={createdDateRef}
                    onChange={handleDateTimeChange} // Handle date/time change
                    onBlur={() => createdDateRef.current.blur()} // Close the date picker when losing focus
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
                    ref={completionDateRef}
                    onChange={handleDateTimeChange}
                    onBlur={() => completionDateRef.current.blur()}
                    title="Estimated or actual completion date."
                    min={task.createdDate} // Set min date to Created On date
                  />
                  {dueDateError && <p style={{ color: 'red', fontSize: '0.9em' }}>{dueDateError}</p>}
                </div>
                <div className="form-group">
                  <label>Parent Task:</label>
                  <select
                    name="parentTaskId"
                    value={task.parentTaskId}
                    onChange={handleChange}
                  >
                    <option value="">Main Task</option>
                    {tasks
                      .filter((t) => t.id !== task.id) // Exclude the current task from the list
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </select>
                </div>
                <button type="submit" className="add-task-button">
                  Add Task
                </button>
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