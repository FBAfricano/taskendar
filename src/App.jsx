import React, { useState, useEffect } from 'react';
import { 
  format, startOfMonth, startOfWeek, 
  eachDayOfInterval, addMonths, subMonths, isSameDay, 
  addDays, startOfYear, endOfYear, eachMonthOfInterval, addYears, subYears, setMonth 
} from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaEye, FaEyeSlash, FaCheckCircle, FaRegCircle, FaExclamationCircle } from 'react-icons/fa';

import { supabase } from './supabaseClient'; 
import Sidebar from './sidebar';      
import TaskModal from './taskModal';  
import Auth from './auth';
import DayModal from './dayModal';


function App() {
  const [session, setSession] = useState(null);

  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  
  // --- PASSWORD RESET STATE ---
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  // --- APP STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [view, setView] = useState('calendar'); 
  const [tasks, setTasks] = useState([]); 

  // --- PASSWORD VALIDATION LOGIC ---
  const requirements = [
    { text: "At least 6 characters", met: newPassword.length >= 6 },
    { text: "One lowercase letter", met: /[a-z]/.test(newPassword) },
    { text: "One uppercase letter", met: /[A-Z]/.test(newPassword) },
    { text: "One number", met: /[0-9]/.test(newPassword) },
    { text: "One symbol (!@#$)", met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
  ];
  const isPasswordValid = requirements.every(req => req.met);
  const doPasswordsMatch = newPassword === confirmPassword; 

  // 1. Check Login & Listen for Password Recovery
  useEffect(() => {
    if (window.location.hash && window.location.hash.includes('type=recovery')) {
        setShowPasswordReset(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordReset(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Tasks
  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

// In App.jsx

  const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id);
      
      if (error) {
          console.error('Error fetching tasks:', error);
      } else {
          // DEBUG: See exactly what Supabase is sending in the console
          console.log("Supabase Raw Data:", data); 

          const formattedData = (data || []).map(task => ({
              ...task,
              // 🛡️ CATCH-ALL: Check all 3 possibilities for the column name
              startDate: task.start_date || task.startDate || task.startdate, 
              endDate: task.end_date || task.endDate || task.enddate,
              completedAt: task.completed_at || task.completedAt || task.completedat
          }));
          
          console.log("App Data (After Fix):", formattedData);
          setTasks(formattedData);
      }
    };

  // --- PASSWORD UPDATE HANDLER ---
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setResetMessage('');
    
    if (!isPasswordValid) {
        setResetMessage("Please satisfy all password requirements.");
        return;
    }

    if (!doPasswordsMatch) {
        setResetMessage("Passwords do not match.");
        return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
        setResetMessage(error.message);
    } else {
        setResetMessage("Success! Redirecting to Sign In...");
        window.history.replaceState(null, '', window.location.pathname);
        setTimeout(async () => {
            await supabase.auth.signOut(); 
            setShowPasswordReset(false);
        }, 2000); 
    }
  };

  // --- DATABASE HANDLERS ---
  const saveTask = async (taskData) => {
      // 1. UPDATE EXISTING TASK
      if (editingTask) {
          const { error } = await supabase
              .from('tasks')
              .update({
                  title: taskData.title,
                  // LEFT SIDE = Database Column | RIGHT SIDE = Value from App/Modal
                  start_date: taskData.startDate, 
                  end_date: taskData.endDate,     
                  description: taskData.description
              })
              .eq('id', taskData.id);
          if (!error) fetchTasks(); 
      } 
      // 2. CREATE NEW TASK
      else {
          const { error } = await supabase
              .from('tasks')
              .insert([{
                  title: taskData.title,
                  // LEFT SIDE = Database Column | RIGHT SIDE = Value from App/Modal
                  start_date: taskData.startDate, 
                  end_date: taskData.endDate,     
                  description: taskData.description,
                  user_id: session.user.id, 
                  completed: false
              }]);
          if (!error) fetchTasks(); 
      }
    };

  const toggleTaskCompletion = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const newStatus = !task.completed;
    const newTimestamp = newStatus ? new Date().toISOString() : null;

    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: newStatus, completedAt: newTimestamp } : t));

    // ---------------------------------------------------------
    // FIX: Map App key to DB key (completedat)
    // ---------------------------------------------------------
    await supabase
        .from('tasks')
        .update({ 
            completed: newStatus, 
            completed_at: newTimestamp // Changed to completedat
        })
        .eq('id', taskId);
  };

  const deleteTask = async (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  };

  const handleLogout = async () => {
      console.log("Attempting forced logout...");
      await supabase.auth.signOut().catch(console.error);
      localStorage.removeItem('sb-znusjaonzptwlrpkbjaf-auth-token');
      window.location.reload();
    };

  // --- CALENDAR LOGIC ---
  const monthStart = startOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = addDays(startDate, 41); 
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentYearStart = startOfYear(currentDate);
  const currentYearEnd = endOfYear(currentDate);
  const yearMonths = eachMonthOfInterval({ start: currentYearStart, end: currentYearEnd });

  // --- EVENT HANDLERS ---
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handlePrevYear = () => setCurrentDate(subYears(currentDate, 1));
  const handleNextYear = () => setCurrentDate(addYears(currentDate, 1));

  const handleDayClick = (day) => {
    setSelectedDate(day);
    setIsDayModalOpen(true);
    setEditingTask(null);
  };

  const handleAddTaskFromDayView = () => {
    setIsDayModalOpen(false); // Close day view
    setEditingTask(null);     // Reset editing state
    setIsModalOpen(true);     // Open Form
  };

  const handleMonthClick = (monthIndex) => {
    const newDate = setMonth(currentDate, monthIndex);
    setCurrentDate(newDate);
    setView('calendar'); 
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  if (!session) return <Auth />;

  if (showPasswordReset) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-[#F2F0E9]">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-96 border-2 border-gray-900 animate-in fade-in zoom-in duration-300">
                <h1 className="text-2xl font-extrabold text-gray-800 mb-6 uppercase text-center tracking-tight">
                    Set New Password
                </h1>
                
                <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                    <div className="relative">
                        <input 
                            type={showNewPassword ? "text" : "password"}
                            placeholder="New password"
                            className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-lg font-bold text-gray-800 focus:border-gray-900 outline-none pr-10"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <button 
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-800 transition"
                        >
                            {showNewPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                        </button>
                    </div>

                    <div className="relative">
                        <input 
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            className={`
                                w-full p-3 bg-gray-50 border-2 rounded-lg font-bold text-gray-800 focus:outline-none transition
                                ${confirmPassword && !doPasswordsMatch ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-gray-900'}
                            `}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                         {confirmPassword && !doPasswordsMatch && (
                            <div className="absolute right-3 top-3.5 text-red-500">
                                <FaExclamationCircle size={20} />
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Requirements:</p>
                        <div className="space-y-1">
                            {requirements.map((req, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    {req.met ? (
                                        <FaCheckCircle className="text-green-500 text-xs" />
                                    ) : (
                                        <FaRegCircle className="text-gray-300 text-xs" />
                                    )}
                                    <span className={`text-[10px] font-bold transition-colors ${req.met ? 'text-green-600' : 'text-gray-400'}`}>
                                        {req.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button 
                        className={`
                            text-white font-bold py-3 rounded-lg transition uppercase tracking-wider
                            ${!isPasswordValid || !doPasswordsMatch
                                ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                                : 'bg-gray-900 hover:bg-blue-700'
                            }
                        `}
                        disabled={!isPasswordValid || !doPasswordsMatch}
                    >
                        Update Password
                    </button>
                </form>

                {resetMessage && (
                    <div className={`mt-4 text-center text-sm font-bold p-2 rounded-lg ${resetMessage.includes('Success') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                        {resetMessage}
                    </div>
                )}
            </div>
        </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#F2F0E9] text-gray-900 font-sans overflow-hidden">
      <Sidebar 
        tasks={tasks} 
        toggleTask={toggleTaskCompletion}
        onEditTask={handleEditTask}
        onAddTask={() => { setEditingTask(null); setIsModalOpen(true); }}
        onSignOut={handleLogout}
        selectedDate={selectedDate}
      />
      
       <div className="flex-1 flex flex-col h-full pr-6 py-6 pl-2">
        <div className="flex items-end justify-between mb-4 px-1 border-b-4 border-gray-900 pb-2 relative">
          <h1 className="text-5xl font-extrabold text-gray-800 tracking-tighter w-20">
            {format(currentDate, 'MM')}
          </h1>
          
          <div className="flex items-center gap-6 select-none">
            {view === 'calendar' && (
                <button onClick={handlePrevMonth} className="text-gray-400 hover:text-black transition-colors p-2">
                    <FaChevronLeft size={20} />
                </button>
            )}
            
            <h1 
                onClick={() => setView(view === 'calendar' ? 'months' : 'calendar')}
                className={`
                    text-3xl font-bold uppercase tracking-[0.2em] cursor-pointer transition-colors min-w-[250px] text-center
                    ${view === 'months' ? 'text-blue-600' : 'text-gray-800 hover:text-blue-600'}
                `}
            >
              {view === 'calendar' ? format(currentDate, 'MMMM') : 'SELECT MONTH'}
            </h1>

            {view === 'calendar' && (
                <button onClick={handleNextMonth} className="text-gray-400 hover:text-black transition-colors p-2">
                    <FaChevronRight size={20} />
                </button>
            )}
          </div>
          
          <div className="flex items-center justify-end w-48 gap-4">
             {view === 'months' && (
                <button onClick={handlePrevYear} className="text-gray-400 hover:text-black transition-colors">
                    <FaChevronLeft size={16} />
                </button>
             )}
             
             <h1 className="text-5xl font-extrabold text-gray-800 tracking-tighter">
                {format(currentDate, 'yyyy')}
             </h1>

             {view === 'months' && (
                <button onClick={handleNextYear} className="text-gray-400 hover:text-black transition-colors">
                    <FaChevronRight size={16} />
                </button>
             )}
          </div>
        </div>

        <div className="flex-1 flex flex-col border-t-2 border-l-2 border-gray-900 bg-[#F2F0E9] relative overflow-hidden">
          
          {view === 'calendar' && (
            <>
              <div className="grid grid-cols-7">
                {weekDays.map(day => (
                  <div key={day} className="h-10 flex items-center justify-center border-r-2 border-b-2 border-gray-900 bg-[#EAE8E3]">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">{day}</span>
                  </div>
                ))}
              </div>

              <div className="flex-1 grid grid-cols-7 grid-rows-6"> 
                {calendarDays.map((day, idx) => {
                  const isToday = isSameDay(day, new Date());
                  const dayString = format(day, 'yyyy-MM-dd');
                  
                  const dayTasks = tasks.filter(task => {
                    if (task.endDate && task.endDate !== '') {
                        return task.endDate === dayString;
                    } else {
                        return task.startDate === dayString;
                    }
                  });

                  dayTasks.sort((a, b) => Number(a.completed) - Number(b.completed));

                  return (
                    <div 
                      key={idx} 
                      onClick={() => handleDayClick(day)}
                      className={`
                        relative border-r-2 border-b-2 border-gray-900 p-1 cursor-pointer
                        transition-colors flex flex-col group overflow-hidden
                        ${isToday ? 'bg-[#BFDBFE]' : 'hover:bg-[#EAE8E3]'}
                      `}
                    >
                      <span className={`text-sm font-bold pl-1 ${isToday ? 'text-[#1E3A8A]' : 'text-gray-600'}`}>
                        {format(day, 'd')}
                      </span>
                      
                      <div className="mt-1 flex flex-col gap-1 overflow-y-auto pr-1 scrollbar-hide w-full">
                        {dayTasks.map(task => (
                          <div 
                            key={task.id} 
                            onClick={(e) => { e.stopPropagation(); }}
                            className={`
                              w-full rounded-sm px-1 py-1 text-[10px] font-bold flex items-center gap-1 min-h-[22px] shadow-sm transition-colors
                              ${task.completed 
                                ? 'bg-gray-400 text-gray-200 line-through opacity-60' 
                                : isToday 
                                    ? 'bg-[#1E3A8A] text-blue-50 hover:bg-[#172554]' 
                                    : 'bg-[#6B7280] text-white hover:bg-gray-900'
                               }
                            `}
                          >
                             <div 
                                onClick={() => toggleTaskCompletion(task.id)}
                                className={`
                                    w-3 h-3 border rounded-[2px] flex items-center justify-center cursor-pointer flex-shrink-0
                                    ${task.completed ? 'border-gray-500 bg-gray-600' : 'border-white/50'}
                                `}
                             >
                                 {task.completed && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
                             </div>

                            <span 
                                onClick={() => handleEditTask(task)}
                                className="truncate flex-1 cursor-pointer hover:underline"
                                title={task.title}
                            >
                                {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {view === 'months' && (
             <div className="flex-1 grid grid-cols-3 grid-rows-4">
                {yearMonths.map((monthDate, i) => {
                    const isCurrentMonth = format(monthDate, 'M') === format(new Date(), 'M') && format(monthDate, 'yyyy') === format(new Date(), 'yyyy');
                    
                    return (
                        <div 
                            key={i}
                            onClick={() => handleMonthClick(i)}
                            className={`
                                border-r-2 border-b-2 border-gray-900 flex items-center justify-center cursor-pointer
                                hover:bg-[#EAE8E3] transition-all relative group
                                ${isCurrentMonth ? 'bg-[#BFDBFE]' : ''}
                            `}
                        >
                            <span className={`
                                text-3xl font-black uppercase tracking-widest group-hover:scale-110 transition-transform
                                ${isCurrentMonth ? 'text-[#1E3A8A]' : 'text-gray-800'}
                            `}>
                                {format(monthDate, 'MMMM')}
                            </span>
                        </div>
                    );
                })}
             </div>
          )}

        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        selectedDate={selectedDate}
        onSave={saveTask}
        onDelete={deleteTask}
        taskToEdit={editingTask}
      />

      <DayModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        selectedDate={selectedDate}
        tasks={tasks} // Pass all tasks
        onAddTask={handleAddTaskFromDayView}
        onEditTask={(task) => { setIsDayModalOpen(false); handleEditTask(task); }}
        toggleTask={toggleTaskCompletion}
      />
    </div>
  );
}

export default App;