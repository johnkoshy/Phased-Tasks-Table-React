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
  const [expandedTasks, setExpandedTasks] = useState({});
  const formRef = useRef(null);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskData, setEditingTaskData] = useState({});

  const [editError, setEditError] = useState('');

  // Function to calculate duration in days
  const calculateDurationInDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
  
    if (isNaN(startDate) || isNaN(endDate)) return ""; // Return empty if dates are invalid
  
    const timeDiff = endDate - startDate; // Difference in milliseconds
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
  
    return daysDiff > 0 ? daysDiff : 0; // Prevent negative values
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
    setEditingTaskData({ ...taskToEdit });
  };

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    taskId: null,
    x: 0,
    y: 0,
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
        <div style={{ padding: '8px', cursor: 'pointer' }} onClick={onAddSubtask}>
          Add Subtask
        </div>
        <div style={{ padding: '8px', cursor: 'pointer' }} onClick={onClose}>
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
    setEditingTaskId(null);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
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

    if ((name === 'title' || name === 'description') && !/^[a-zA-Z\s]*$/.test(value)) {
      return;
    }

    if (name === 'duration' && !/^\d*$/.test(value)) {
      return;
    }

    setTask((prevTask) => ({ ...prevTask, [name]: value }));

    if (name === 'assignedTo') {
      const filteredSuggestions = assignees.filter((assignee) =>
        assignee.toLowerCase().includes(value.toLowerCase())
      );
      setAssigneeSuggestions(filteredSuggestions);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setTask((prevTask) => ({ ...prevTask, assignedTo: suggestion }));
    setAssigneeSuggestions([]);
  };

  const handleAssignedToFocus = () => {
    setAssigneeSuggestions(assignees);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    if (!task.title.trim() || !task.description.trim()) return;
  
    // Ensure task.duration is formatted correctly before submitting
    const durationInDays = task.duration ? task.duration : calculateDurationInDays(task.createdDate, task.completionDate);
  
    const newTask = {
      id: Date.now().toString(), // Ensure unique ID
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      duration: durationInDays,  // Set duration properly here
      completionDate: task.completionDate,
      createdDate: new Date().toISOString(),
      parentTaskId: task.parentTaskId || null, // Allow null for main tasks
      subtasks: [], // Ensure subtasks are empty at creation
    };
  
    // Add the new task to the list
    setTasks([...tasks, newTask]);
  
    // Reset the form
    setTask({
      title: '',
      description: '',
      assignedTo: '',
      duration: '',  // Reset the duration
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
    if (formRef.current && !formRef.current.contains(e.target)) {
      const isAnyInputFilled = Object.values(task).some((value) => {
        if (typeof value === 'string') {
          return value.trim() !== '';
        }
        return value !== null && value !== undefined;
      });

      if (!isAnyInputFilled) {
        setShowForm(false);
        setTask({
          title: '',
          description: '',
          assignedTo: '',
          duration: '',
          completionDate: '',
          createdDate: '',
          parentTaskId: '',
        });
      }
    }
  };

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
  
    setTask((prevTask) => {
      const updatedTask = { ...prevTask, [name]: value };
  
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
      return;
    }

    if (editingTaskId === taskId) {
      handleSaveTask(taskId);
    } else {
      handleEditTask(taskId);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;

    if (
      (name === 'title' || name === 'description' || name === 'assignedTo') &&
      !/^[a-zA-Z\s]*$/.test(value)
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
              <td style={{ paddingLeft: `${level * 20}px` }}>
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
      onChange={(e) =>
        setEditingTaskData({ ...editingTaskData, duration: e.target.value })
      }
    />
  ) : (
    `${task.duration} ${task.duration === 1 ? "day" : "days"}` // This will display "1 day" or "X days"
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
                  <td>⏳ {formatDateTime(task.completionDate)}</td>
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
                  <td>📅 {formatDateTime(task.createdDate)}</td>
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
                    <option value="">Main Task</option>
                    {tasks
                      .filter((t) => t.id !== task.id && !isDescendant(t.id, task.id, tasks))
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
                    <option value="">Main Task</option>
                    {tasks
                      .filter((t) => t.id !== task.id && !isDescendant(t.id, task.id, tasks))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </select>
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


  useEffect(() => {
    if (showForm) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

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
      <div className="page-container">
      <h4>PHASED TASKS TABLE</h4>

      <h5>Task List</h5>
      {tasks.length > 0 ? (
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
            <div>
            <input
  type="number"
  name="duration"
  placeholder="Duration (days)"
  value={task.duration || ""}  // Use raw value
  onChange={handleChange}
/>

  {task.duration !== "" && (
    <span>{task.duration === "1" ? "day" : "days"}</span>
  )}
</div>

            <label title="This is the date the task was created." htmlFor="createdDate">Created On:</label>
            <input
              type="datetime-local"
              id="createdDate"
              name="createdDate"
              value={task.createdDate}
              onChange={handleDateTimeChange}
              title="Date when the task was created."
            />

            <label title="This is the expected completion date." htmlFor="completionDate">Due By:</label>
            <input
              type="datetime-local"
              id="completionDate"
              name="completionDate"
              value={task.completionDate}
              onChange={handleDateTimeChange}
              title="Estimated or actual completion date."
            />

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
            <button type="submit" className="add-task-button">
              Add Task
            </button>
          </form>
        )}
      </div>
      </div>
    </div>
  );
}

export default App;