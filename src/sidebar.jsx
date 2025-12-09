import React from 'react';
import { format, parseISO, differenceInHours } from 'date-fns';
import { FaSignOutAlt } from 'react-icons/fa';

const Sidebar = ({ tasks, toggleTask, onAddTask, onEditTask, onSignOut }) => {
  // Use ALL tasks passed from App.jsx (No filtering by Today)
  const allTasks = tasks; 

  // Filter To-Do items
  const todoList = allTasks.filter(task => !task.completed);

  // Filter Accomplished items (Last 24h only)
  const accomplishedList = allTasks.filter(task => {
    if (!task.completed) return false;
    if (task.completedAt) {
        const hoursSinceCompletion = differenceInHours(new Date(), parseISO(task.completedAt));
        return hoursSinceCompletion < 24; 
    }
    return true; 
  });

  // Sort: Soonest tasks at the top
  const sortFn = (a, b) => {
    // Safety check: Default to a far future date if startDate is missing to prevent crashes
    const dateA = a.startDate ? new Date(a.startDate) : new Date(8640000000000000);
    const dateB = b.startDate ? new Date(b.startDate) : new Date(8640000000000000);
    return dateA - dateB;
  };
  
  todoList.sort(sortFn);
  accomplishedList.sort(sortFn);

  const totalRelevant = allTasks.length;
  const totalCompleted = allTasks.filter(t => t.completed).length;
  const percentage = totalRelevant === 0 ? 0 : Math.round((totalCompleted / totalRelevant) * 100);

  const renderTaskCard = (task) => {
    // 🛡️ SAFETY CHECK: If startDate is missing/undefined, do not render (Prevents White Screen)
    if (!task.startDate) {
        console.warn("Task missing start date:", task);
        return null; 
    }
    
    const displayDate = parseISO(task.startDate);
    
    return (
        <div 
            key={task.id} 
            className={`
            relative min-h-12 w-full rounded-lg transition-all flex flex-col justify-center px-4 py-2 shadow-sm group
            ${task.completed ? 'bg-[#A0A09C] opacity-75' : 'bg-[#CFCFCB] hover:bg-[#C4C4C0]'}
            `}
        >
            <div className="flex justify-between items-center w-full gap-2">
                <div 
                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                    className={`w-4 h-4 rounded-sm border-2 cursor-pointer flex items-center justify-center flex-shrink-0 ${task.completed ? 'bg-gray-700 border-gray-700' : 'border-gray-600'}`}
                >
                    {task.completed && <div className="w-2 h-2 bg-white rounded-[1px]" />}
                </div>

                <span 
                    onClick={() => onEditTask(task)}
                    className={`font-bold truncate text-sm flex-1 cursor-pointer hover:underline ${task.completed ? 'text-gray-300 line-through' : 'text-gray-800'}`}
                >
                    {task.title}
                </span>

                <span className="bg-[#EAE8E3]/80 text-gray-600 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-gray-300 whitespace-nowrap">
                    {format(displayDate, 'MMM d')}
                </span>
            </div>
            
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/5 rounded-l-lg"></div>
        </div>
    );
  };

  return (
    <div className="w-[320px] h-full py-6 pl-6 pr-2 flex flex-col justify-center">
      <div className="bg-[#EAE8E3] h-full w-full rounded-[30px] p-6 flex flex-col shadow-inner relative border border-gray-300">
        
        {/* Progress Circle */}
        <div className="flex justify-center mb-6 mt-2 relative">
          <div className="w-32 h-32 relative">
            <svg className="transform -rotate-90 w-full h-full">
              <circle cx="64" cy="64" r="50" stroke="#D1D1CD" strokeWidth="14" fill="transparent" />
              <circle
                cx="64" cy="64" r="50"
                stroke="#6B7280"
                strokeWidth="14"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - percentage / 100)}
                strokeLinecap="butt"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-gray-700">
              <span className="text-2xl font-bold tracking-tighter text-gray-800">{percentage}%</span>
            </div>
          </div>
        </div>

        {/* --- TO DO LIST --- */}
        <div className="flex-1 flex flex-col overflow-hidden mb-2">
            <h2 className="text-lg font-bold text-gray-800 mb-2 tracking-wide uppercase border-b-2 border-gray-300 pb-1">
                To Do
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide pb-2">
                {todoList.length === 0 ? (
                    <div className="text-center mt-4 text-gray-400 font-bold uppercase text-[10px]">No upcoming tasks</div>
                ) : (
                    todoList.map(task => renderTaskCard(task))
                )}
            </div>
        </div>

        {/* --- ACCOMPLISHED LIST --- */}
        <div className="flex-1 flex flex-col overflow-hidden border-t-2 border-dashed border-gray-300 pt-2">
            <h2 className="text-lg font-bold text-gray-600 mb-2 tracking-wide uppercase pb-1 flex justify-between items-center">
                <span>Accomplished</span>
                <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded-full">{accomplishedList.length}</span>
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide pb-2">
                {accomplishedList.length === 0 ? (
                    <div className="text-center mt-4 text-gray-400 font-bold uppercase text-[10px]">No tasks finished recently</div>
                ) : (
                    accomplishedList.map(task => renderTaskCard(task))
                )}
            </div>
        </div>

        {/* BUTTONS CONTAINER */}
        <div className="mt-4 flex flex-col gap-3">
          <button 
            onClick={onAddTask}
            className="bg-[#4B5563] text-white text-xs font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-800 transition tracking-wider uppercase w-full"
          >
            Add Task
          </button>

          <button 
            onClick={onSignOut}
            className="flex items-center justify-center gap-2 text-gray-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition pt-2 border-t border-gray-200"
          >
            Sign Out <FaSignOutAlt />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;