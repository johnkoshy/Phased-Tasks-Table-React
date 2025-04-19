Task Management Application
A React-based task management application built with Vite for creating, organizing, and tracking tasks with hierarchical dependencies. Features include a table view, dependency graph view, dark mode, task import/export, and progress tracking.
Table of Contents

Features
Installation
Usage
Project Structure
Contributing
License

Features

Task Management: Create, edit, delete, and organize tasks with fields for title, description, assignee, duration, created date, due date, parent task, and progress.
Hierarchical Tasks: Support for parent-child task relationships with expandable subtasks in table view.
Dependency Graph: Visualize task dependencies in a graph view using React Flow.
Progress Tracking: Track individual task progress (0-100%) and overall project progress with visual progress bars.
Import/Export: Export tasks as JSON or text files and import tasks from JSON files.
Clear All Tasks: Remove all tasks with a confirmation prompt.
Dark Mode: Toggle between light and dark themes, with preference saved in localStorage.
Responsive Design: Includes animations like falling leaves and cursor activity detection.
Local Storage: Persist tasks and theme preferences using localStorage with safe access handling.
Context Menu: Right-click tasks to add subtasks.
Assignee Suggestions: Autocomplete suggestions for assignee input based on a predefined list.

Installation
This project uses React with Vite for a fast development experience with Hot Module Replacement (HMR) and ESLint for code linting.

Clone the Repository:
git clone https://github.com/johnkoshy/phased-tasks-table.git
cd your-repo-name


Install Dependencies: Ensure you have Node.js installed. Then, install the required npm packages:
npm install

Key dependencies include:

react: For building the UI.
reactflow: For the dependency graph view.
@vitejs/plugin-react: Uses Babel for Fast Refresh (configured in vite.config.js).
Other dependencies are listed in package.json.


Start the Development Server:
npm run dev

The application will run at http://localhost:5173 (default Vite port) with HMR enabled.


Usage

Add a Task:

Click the "Add Task" button to open the task form.
Fill in required fields (title, description, assignee, created date, due date).
Optionally assign a parent task for hierarchical organization.
Submit to add the task to the table or graph view.


View Tasks:

Table View: Displays tasks in a table with expandable subtasks. Edit or delete tasks using the action buttons.
Graph View: Shows tasks as nodes with edges representing dependencies. Click a node to edit the task.
Toggle between views using the "Graph View" or "Table View" button.


Edit a Task:

In table view, click "Edit" on a task row to modify its details.
In graph view, click a task node to open the edit form.
Save or cancel changes using the respective buttons.


Delete a Task:

In table view, click "Delete" on a task row. This removes the task and its subtasks after confirmation.
Alternatively, use the "Clear All Tasks" button in the header to remove all tasks after confirmation.


Import/Export Tasks:

Export tasks as a JSON file or a formatted text file using the "Export Tasks as JSON" or "Export Tasks as Text" buttons.
Import tasks from a JSON file using the "Import Tasks" button.


Toggle Dark Mode:

Use the "Dark Mode" or "Light Mode" button in the top-right corner to switch themes.


Track Progress:

Update task progress using the slider in edit mode.
View overall project progress and task statistics (total, completed, in progress, not started) in table view.



Project Structure
your-repo-name/
├── public/
│   ├── index.html        # Main HTML file
│   └── wallpaper.jpg     # Background image for light mode
├── src/
│   ├── components/
│   │   ├── FooterClock.js  # Component for displaying a footer clock
│   │   ├── TaskForm.js     # Component for the task input form
│   │   └── TaskGraph.js    # Component for the dependency graph view
│   ├── App.js            # Main App component
│   ├── App.css           # Styles for the application
│   └── index.js          # Entry point for React
├── vite.config.js        # Vite configuration file
├── package.json          # Project dependencies and scripts
└── README.md             # This file

Contributing
Contributions are welcome! To contribute:

Fork the repository.
Create a feature branch (git checkout -b feature/your-feature).
Commit your changes (git commit -m 'Add your feature').
Push to the branch (git push origin feature/your-feature).
Open a pull request.

Please ensure your code follows the existing style and includes tests where applicable.
License
This project is licensed under the MIT License. See the LICENSE file for details.
