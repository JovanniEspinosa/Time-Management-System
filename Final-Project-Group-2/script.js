// Data storage for tasks
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let weeklySummary = JSON.parse(localStorage.getItem('weeklySummary')) || [];

// Timer-related variables
let currentTaskId = null;
let timerInterval = null;
let timeSpent = 0;

// Elements
const taskSearch = document.getElementById('task-search');
const taskForm = document.getElementById('add-task-form');
const taskList = document.getElementById('task-list');
const currentTaskLabel = document.getElementById('current-task');
const timeSpentLabel = document.getElementById('time-spent');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const taskDay = document.getElementById('task-day');
const weeklySummaryContainer = document.getElementById('weekly-summary');

// Initialize Flatpickr for the date input field
flatpickr('#task-day', {
  dateFormat: 'Y-m-d', // YYYY-MM-DD format
});

// Event listener to handle adding/editing tasks
taskForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const taskTitle = document.getElementById('task-title').value;
  const taskDesc = document.getElementById('task-desc').value;
  const taskPriority = document.getElementById('task-priority').value;
  const taskTime = parseInt(document.getElementById('task-time').value);
  const timeUnit = document.getElementById('time-unit').value;
  const taskStart = document.getElementById('task-start').value;
  const taskDayValue = taskDay.value;

  if (!taskTitle || !taskPriority || !taskTime || !taskStart || !taskDayValue) return;

  const task = {
    id: Date.now(),
    title: taskTitle,
    description: taskDesc,
    priority: taskPriority,
    estimatedTime: taskTime,
    timeUnit: timeUnit,
    startTime: taskStart,
    day: taskDayValue,
    timeSpent: 0, // Initialize with zero time spent
  };

  tasks.push(task);
  localStorage.setItem('tasks', JSON.stringify(tasks));

  taskForm.reset();
  displayTasks();
  displayWeeklySummary();
});

// Display tasks when the page loads or is refreshed
function displayTasks() {
  taskList.innerHTML = '';
  tasks.forEach((task) => {
    const taskRow = document.createElement('tr');
    taskRow.dataset.id = task.id;
    taskRow.innerHTML = `
      <td>${task.title}</td>
      <td>${task.description}</td>
      <td>${task.priority}</td>
      <td>${task.estimatedTime} ${task.timeUnit}</td>
      <td>${task.startTime}</td>
      <td>${task.day}</td>
      <td>
        <button class="btn btn-info" onclick="startTask(${task.id})">Select</button>
        <button class="btn btn-warning" onclick="editTask(${task.id})">Edit</button>
        <button class="btn btn-danger" onclick="deleteTask(${task.id})">Delete</button>
      </td>
    `;
    taskList.appendChild(taskRow);
  });
}

// Display weekly summary
function displayWeeklySummary() {
  weeklySummaryContainer.innerHTML = '';
  weeklySummary.forEach((summary) => {
    const summaryRow = document.createElement('tr');
    summaryRow.innerHTML = `
      <td>${summary.day}</td>
      <td>${summary.estimatedTime} mins</td>
      <td>${summary.actualTime} mins</td>
    `;
    weeklySummaryContainer.appendChild(summaryRow);
  });
}

// Start Task Timer
function startTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  currentTaskId = id;
  currentTaskLabel.textContent = task.title;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  stopBtn.disabled = false;

  // Reset timeSpent if starting a new task
  timeSpent = task.timeSpent || 0;

  timerInterval = setInterval(function () {
    timeSpent++;
    timeSpentLabel.textContent = formatTime(timeSpent);
    const taskIndex = tasks.findIndex(t => t.id === id);
    tasks[taskIndex].timeSpent = timeSpent; // Update time spent in the task object
    localStorage.setItem('tasks', JSON.stringify(tasks)); // Store updated tasks
  }, 1000);
}

// Pause Task Timer
pauseBtn.addEventListener('click', function () {
  clearInterval(timerInterval);
  startBtn.disabled = false;
  pauseBtn.disabled = true;
});

// Stop Task Timer
stopBtn.addEventListener('click', function () {
  clearInterval(timerInterval);
  const task = tasks.find(t => t.id === currentTaskId);
  if (task) {
    task.timeSpent = timeSpent;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    timeSpentLabel.textContent = formatTime(task.timeSpent);

    // Update weekly summary
    updateWeeklySummary(task);
  }

  currentTaskLabel.textContent = 'None';
  timeSpent = 0;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  stopBtn.disabled = true;
  displayWeeklySummary(); // Update weekly summary display
});

// Format time in MM:SS format
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Update Weekly Summary
function updateWeeklySummary(task) {
  const taskDay = task.day;
  const timeSpentInMinutes = Math.floor(task.timeSpent / 60);
  const existingDay = weeklySummary.find(day => day.day === taskDay);

  if (existingDay) {
    // Update existing entry for the day
    existingDay.estimatedTime += task.estimatedTime;
    existingDay.actualTime += timeSpentInMinutes;
  } else {
    // Add new entry for the day
    weeklySummary.push({
      day: taskDay,
      estimatedTime: task.estimatedTime,
      actualTime: timeSpentInMinutes,
    });
  }

  // Save updated weekly summary in localStorage
  localStorage.setItem('weeklySummary', JSON.stringify(weeklySummary));
}

// Delete Task
function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  localStorage.setItem('tasks', JSON.stringify(tasks));
  displayTasks();
  displayWeeklySummary(); // Update weekly summary after deletion
}

// Edit Task (currently just resets form for editing)
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  document.getElementById('task-title').value = task.title;
  document.getElementById('task-desc').value = task.description;
  document.getElementById('task-priority').value = task.priority;
  document.getElementById('task-time').value = task.estimatedTime;
  document.getElementById('time-unit').value = task.timeUnit;
  document.getElementById('task-start').value = task.startTime;
  document.getElementById('task-day').value = task.day;

  deleteTask(id); // Remove task before re-adding it
}

// Search tasks based on title or description
taskSearch.addEventListener('input', function () {
  const searchText = taskSearch.value.toLowerCase();
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchText) ||
    task.description.toLowerCase().includes(searchText)
  );
  taskList.innerHTML = '';
  filteredTasks.forEach(task => {
    const taskRow = document.createElement('tr');
    taskRow.dataset.id = task.id;
    taskRow.innerHTML = `
      <td>${task.title}</td>
      <td>${task.description}</td>
      <td>${task.priority}</td>
      <td>${task.estimatedTime} ${task.timeUnit}</td>
      <td>${task.startTime}</td>
      <td>${task.day}</td>
      <td>
        <button class="btn btn-info" onclick="startTask(${task.id})">Select</button>
        <button class="btn btn-warning" onclick="editTask(${task.id})">Edit</button>
        <button class="btn btn-danger" onclick="deleteTask(${task.id})">Delete</button>
      </td>
    `;
    taskList.appendChild(taskRow);
  });
});

// Display tasks and weekly summary when the page loads
displayTasks();
displayWeeklySummary();