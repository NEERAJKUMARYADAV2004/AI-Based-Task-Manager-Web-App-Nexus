import React, { useState, useEffect, useRef } from 'react';
import { Card, CustomButton, IconButton } from './UI';
import Sidebar from './Sidebar';
import Header from './Header';
import { API_URL, getAuthHeaders } from '../utils/api';

// --- HELPER FUNCTIONS ---
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const getTaskStatus = (task) => {
  if (task.completed) return 'Completed';
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  now.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  if (dueDate < now) return 'Due';
  if (dueDate.getTime() === now.getTime()) return 'Ongoing';
  return 'Upcoming';
};

const priorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high': return 'bg-red-500/80 border-red-400';
    case 'medium': return 'bg-amber-500/80 border-amber-400';
    case 'low': return 'bg-green-500/80 border-green-400';
    default: return 'bg-gray-500/80 border-gray-400';
  }
};

// --- Task Item Component ---
const TaskItem = ({ task, isEditing, editFormData, handleToggleComplete, handleEditClick, handleDeleteTask, handleEditFormChange, handleSaveEdit, handleCancelEdit }) => {
    return (
        <li className={`p-4 rounded-lg bg-white/5 transition-colors duration-200 border-l-4 ${priorityColor(task.priority)} ${task.completed && !isEditing ? 'opacity-60' : ''}`}>
            {isEditing ? (
                <div className="space-y-3">
                   <input type="text" name="taskName" value={editFormData.taskName} onChange={handleEditFormChange} className="w-full p-2 rounded-lg bg-white/10 text-white font-semibold" required />
                    <textarea name="description" value={editFormData.description} onChange={handleEditFormChange} rows="2" className="w-full p-2 rounded-lg bg-white/10 text-white text-sm" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                         <input type="date" name="dueDate" value={editFormData.dueDate} onChange={handleEditFormChange} className="w-full p-2 rounded-lg bg-white/10 text-white appearance-none" />
                         <select name="priority" value={editFormData.priority} onChange={handleEditFormChange} className="w-full p-2 rounded-lg bg-white/10 text-white appearance-none">
                             <option>Low</option><option>Medium</option><option>High</option>
                         </select>
                         <input type="text" name="workplace" value={editFormData.workplace} onChange={handleEditFormChange} placeholder="Workplace" className="w-full p-2 rounded-lg bg-white/10 text-white" />
                    </div>
                    <div className="flex justify-end gap-3 mt-3">
                        <CustomButton onClick={handleCancelEdit} className="!bg-gray-500 hover:!bg-gray-600 px-4 py-1 text-sm">Cancel</CustomButton>
                        <CustomButton onClick={() => handleSaveEdit(task._id)} className="!bg-green-600 hover:!bg-green-700 px-4 py-1 text-sm">Save</CustomButton>
                    </div>
                </div>
            ) : (
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-grow">
                        <input type="checkbox" checked={task.completed} onChange={() => handleToggleComplete(task._id)} className="h-5 w-5 rounded text-red-500 bg-white/10 border-white/30 focus:ring-red-500 cursor-pointer mt-1 flex-shrink-0" />
                        <div className="flex-grow">
                            <span className={`text-lg text-white font-semibold ${task.completed ? 'line-through text-white/60' : ''}`}>{task.taskName}</span>
                            {task.description && <p className="text-sm text-white/70 mt-1">{task.description}</p>}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60 mt-2">
                                <span>Due: {formatDate(task.dueDate)}</span>
                                {task.workplace && <span>Place: {task.workplace}</span>}
                                <span>Priority: {task.priority}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0 ml-2 sm:ml-4">
                         <IconButton icon={ <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /> </svg> } onClick={() => handleEditClick(task)} className="!text-blue-400 hover:!bg-blue-500/30 hover:!text-blue-300" />
                         <IconButton icon={ <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /> </svg> } onClick={() => handleDeleteTask(task._id)} className="!text-red-400 hover:!bg-red-500/30 hover:!text-red-300" />
                    </div>
                </div>
            )}
        </li>
    );
};

const TodoPage = ({ activeMenu, setActiveMenu, onSignOut, userName }) => {
  const [tasks, setTasks] = useState([]);
  // Form State
  const [taskNameInput, setTaskNameInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');
  const [priorityInput, setPriorityInput] = useState('Medium');
  const [workplaceInput, setWorkplaceInput] = useState('');
  
  // Edit State
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editFormData, setEditFormData] = useState({ taskName: '', description: '', dueDate: '', priority: 'Medium', workplace: '' });
  
  // Voice & Auto-Upload State
  const [isListening, setIsListening] = useState(false);
  const [activeMicField, setActiveMicField] = useState(null); // 'name' or 'desc'
  const [countdown, setCountdown] = useState(0);
  const autoAddTimerRef = useRef(null);

  // --- FETCH TASKS FROM API ---
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${API_URL}/tasks`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (err) { console.error("Failed to fetch tasks", err); }
    };
    fetchTasks();
  }, []);

  // --- Countdown Effect ---
  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // --- SPEECH HELPERS ---
  const speak = (text) => { 
      if ('speechSynthesis' in window) { 
          window.speechSynthesis.cancel(); 
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(text)); 
      } 
  };

  const cancelAutoAdd = () => {
    if (autoAddTimerRef.current) {
      clearTimeout(autoAddTimerRef.current);
      autoAddTimerRef.current = null;
    }
    if (countdown > 0) {
      setCountdown(0);
    }
  };

  const handleVoiceInput = (field) => { // field: 'name' or 'desc'
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    cancelAutoAdd(); // Stop any pending add if switching fields
    setActiveMicField(field);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onend = () => {
        setIsListening(false);
        setActiveMicField(null);
        // Start Auto-Upload Timer only if we have a Task Name
        // If we just filled description but name is empty, don't auto-send yet? 
        // Logic: If we spoke into either, assume user might be done. Check validity in handleAddTask.
        
        // Note: state updates might not be immediate, but handleAddTask checks current state refs or we pass data.
        // Here we rely on state being updated by onresult before onend fires/timer finishes.
        
        setCountdown(5);
        autoAddTimerRef.current = setTimeout(() => {
            document.getElementById('addTaskBtn')?.click(); // Trigger the button click to submit
            setCountdown(0);
        }, 5000);
    };

    recognition.onerror = (event) => {
      console.error("Speech error", event.error);
      setIsListening(false);
      setActiveMicField(null);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (field === 'name') setTaskNameInput(transcript);
      if (field === 'desc') setDescriptionInput(transcript);
    };

    recognition.start();
  };

  // --- CRUD HANDLERS ---
  const handleAddTask = async (e) => {
    if (e) e.preventDefault();
    
    cancelAutoAdd(); // Ensure timer stops if button clicked manually

    if (taskNameInput.trim() === '') {
        // If auto-add triggered but name is empty, don't add, just warn or ignore
        return;
    }

    // Calculate Due Date (Default 1 week if empty)
    let calculatedDueDate;
    if (dueDateInput) {
        calculatedDueDate = dueDateInput;
    } else {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        calculatedDueDate = nextWeek.toISOString().split('T')[0];
    }

    const newTaskData = {
        taskName: taskNameInput,
        description: descriptionInput,
        dueDate: calculatedDueDate,
        priority: priorityInput,
        workplace: workplaceInput
    };

    try {
        const res = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newTaskData)
        });
        if (res.ok) {
            const savedTask = await res.json();
            setTasks([savedTask, ...tasks]); 
            speak(`Task added successfully: ${taskNameInput}`);
            
            // Reset form
            setTaskNameInput(''); setDescriptionInput(''); 
            setDueDateInput(''); // Will default to empty in UI, logic handles 1 week default next time
            setPriorityInput('Medium'); setWorkplaceInput('');
        }
    } catch (err) { console.error("Error adding task", err); }
  };

  const handleToggleComplete = async (id) => {
    const task = tasks.find(t => t._id === id);
    try {
        const res = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ completed: !task.completed })
        });
        if (res.ok) {
            setTasks(tasks.map(t => t._id === id ? { ...t, completed: !t.completed } : t));
        }
    } catch (err) { console.error(err); }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
        const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        if (res.ok) {
            setTasks(tasks.filter(t => t._id !== id));
        }
    } catch (err) { console.error(err); }
  };
  
  const handleEditClick = (task) => { 
      cancelAutoAdd(); // Safety
      setEditingTaskId(task._id); 
      setEditFormData({ taskName: task.taskName, description: task.description, dueDate: formatDateForInput(task.dueDate), priority: task.priority, workplace: task.workplace || '' }); 
  };
  
  const handleSaveEdit = async (id) => {
    try {
        const res = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(editFormData)
        });
        if (res.ok) {
            const updatedTask = await res.json();
            setTasks(tasks.map(t => t._id === id ? updatedTask : t));
            setEditingTaskId(null);
        }
    } catch (err) { console.error(err); }
  };

  const handleCancelEdit = () => { setEditingTaskId(null); };
  const handleEditFormChange = (e) => { const { name, value } = e.target; setEditFormData(prev => ({ ...prev, [name]: value })); };

  // --- Filtering ---
  const upcomingTasks = tasks.filter(task => getTaskStatus(task) === 'Upcoming');
  const ongoingTasks = tasks.filter(task => getTaskStatus(task) === 'Ongoing');
  const dueTasks = tasks.filter(task => getTaskStatus(task) === 'Due');
  const completedTasks = tasks.filter(task => getTaskStatus(task) === 'Completed');

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={onSignOut} />
      <main className="flex-1 overflow-y-scroll custom-scrollbar relative">
        <Header userName={userName} />
        <div className="p-6">
          <Card title="Add New Task" className="w-full max-w-4xl mx-auto !bg-slate-800/80 mb-8">
            
            {/* Auto-Upload Indicator */}
            {countdown > 0 && (
                <div className="mb-4 bg-indigo-900/50 border border-indigo-500/30 rounded-lg p-3 flex justify-between items-center animate-pulse">
                    <div className="flex items-center gap-2 text-indigo-200">
                        <span className="text-xl">⏳</span>
                        <span>Uploading in <strong>{countdown}s</strong>...</span>
                    </div>
                    <CustomButton onClick={cancelAutoAdd} className="!bg-white/10 hover:!bg-white/20 !py-1 !px-3 text-xs">
                        Tap to Edit / Cancel
                    </CustomButton>
                </div>
            )}

            <form onSubmit={handleAddTask} className="space-y-4">
              {/* Task Name + Mic */}
              <div className="flex items-center gap-4">
                <input 
                    type="text" 
                    value={taskNameInput} 
                    onChange={(e) => { setTaskNameInput(e.target.value); cancelAutoAdd(); }} 
                    onFocus={cancelAutoAdd}
                    placeholder={isListening && activeMicField === 'name' ? "Listening..." : "Task Name*"} 
                    required 
                    className={`flex-grow p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent transition-all ${isListening && activeMicField === 'name' ? 'border-red-500 animate-pulse' : ''}`} 
                />
                <IconButton 
                    icon={<span className="text-xl">🎤</span>} 
                    onClick={() => handleVoiceInput('name')} 
                    className={`!bg-indigo-600 hover:!bg-indigo-700 !text-white ${isListening && activeMicField === 'name' ? '!bg-red-600 animate-pulse' : ''}`} 
                    type="button" 
                    title="Speak Task Name"
                />
              </div>

              {/* Description + Mic */}
              <div className="flex items-center gap-4">
                  <textarea 
                    value={descriptionInput} 
                    onChange={(e) => { setDescriptionInput(e.target.value); cancelAutoAdd(); }} 
                    onFocus={cancelAutoAdd}
                    placeholder={isListening && activeMicField === 'desc' ? "Listening..." : "Description (Optional)"} 
                    rows="2" 
                    className={`flex-grow p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent transition-all ${isListening && activeMicField === 'desc' ? 'border-red-500 animate-pulse' : ''}`} 
                  />
                  <IconButton 
                    icon={<span className="text-xl">🎤</span>} 
                    onClick={() => handleVoiceInput('desc')} 
                    className={`!bg-indigo-600 hover:!bg-indigo-700 !text-white ${isListening && activeMicField === 'desc' ? '!bg-red-600 animate-pulse' : ''}`} 
                    type="button" 
                    title="Speak Description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {/* Due Date - Defaults to 1 week logic handled in handleAddTask, UI shows placeholder or empty */}
                 <div className="flex flex-col">
                    <label className="text-xs text-white/50 mb-1 ml-1">Due Date (Default: 1 Week)</label>
                    <input 
                        type="date" 
                        value={dueDateInput} 
                        onChange={(e) => { setDueDateInput(e.target.value); cancelAutoAdd(); }} 
                        onFocus={cancelAutoAdd}
                        className="w-full p-3 rounded-lg bg-white/10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent" 
                    />
                 </div>
                 
                 <div className="flex flex-col">
                    <label className="text-xs text-white/50 mb-1 ml-1">Priority</label>
                    <select 
                        value={priorityInput} 
                        onChange={(e) => { setPriorityInput(e.target.value); cancelAutoAdd(); }} 
                        onFocus={cancelAutoAdd}
                        className="w-full p-3 rounded-lg bg-white/10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent"
                    > 
                        <option>Low</option> <option>Medium</option> <option>High</option> 
                    </select>
                 </div>

                 <div className="flex flex-col">
                    <label className="text-xs text-white/50 mb-1 ml-1">Workplace</label>
                    <input 
                        type="text" 
                        value={workplaceInput} 
                        onChange={(e) => { setWorkplaceInput(e.target.value); cancelAutoAdd(); }} 
                        onFocus={cancelAutoAdd}
                        placeholder="e.g., Home, Office" 
                        className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent" 
                    />
                 </div>
              </div>

              <div className="text-right">
                <CustomButton id="addTaskBtn" type="submit" className="!bg-red-600 hover:!bg-red-700 !shadow-red-500/50 px-8"> Add Task </CustomButton>
              </div>
            </form>
          </Card>

          <div className="w-full max-w-4xl mx-auto space-y-8">
              {ongoingTasks.length > 0 && ( <section> <h3 className="text-2xl font-bold text-amber-400 mb-4 border-b border-amber-400/30 pb-2">Ongoing (Due Today)</h3> <ul className="space-y-4"> {ongoingTasks.map(task => <TaskItem key={task._id} task={task} isEditing={editingTaskId === task._id} editFormData={editFormData} handleToggleComplete={handleToggleComplete} handleEditClick={handleEditClick} handleDeleteTask={handleDeleteTask} handleEditFormChange={handleEditFormChange} handleSaveEdit={handleSaveEdit} handleCancelEdit={handleCancelEdit} />)} </ul> </section> )}
              {upcomingTasks.length > 0 && ( <section> <h3 className="text-2xl font-bold text-indigo-400 mb-4 border-b border-indigo-400/30 pb-2">Upcoming</h3> <ul className="space-y-4"> {upcomingTasks.map(task => <TaskItem key={task._id} task={task} isEditing={editingTaskId === task._id} editFormData={editFormData} handleToggleComplete={handleToggleComplete} handleEditClick={handleEditClick} handleDeleteTask={handleDeleteTask} handleEditFormChange={handleEditFormChange} handleSaveEdit={handleSaveEdit} handleCancelEdit={handleCancelEdit} />)} </ul> </section> )}
              {dueTasks.length > 0 && ( <section> <h3 className="text-2xl font-bold text-red-400 mb-4 border-b border-red-400/30 pb-2">Due (Past Deadline)</h3> <ul className="space-y-4"> {dueTasks.map(task => <TaskItem key={task._id} task={task} isEditing={editingTaskId === task._id} editFormData={editFormData} handleToggleComplete={handleToggleComplete} handleEditClick={handleEditClick} handleDeleteTask={handleDeleteTask} handleEditFormChange={handleEditFormChange} handleSaveEdit={handleSaveEdit} handleCancelEdit={handleCancelEdit} />)} </ul> </section> )}
              {completedTasks.length > 0 && ( <section> <h3 className="text-2xl font-bold text-green-400 mb-4 border-b border-green-400/30 pb-2">Completed</h3> <ul className="space-y-4"> {completedTasks.map(task => <TaskItem key={task._id} task={task} isEditing={editingTaskId === task._id} editFormData={editFormData} handleToggleComplete={handleToggleComplete} handleEditClick={handleEditClick} handleDeleteTask={handleDeleteTask} handleEditFormChange={handleEditFormChange} handleSaveEdit={handleSaveEdit} handleCancelEdit={handleCancelEdit} />)} </ul> </section> )}
              {tasks.length === 0 && ( <p className="text-center text-white/50 mt-10 text-lg">Your To-Do list is empty. Add a task above to get started!</p> )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TodoPage;