import React from 'react';
import { format, parseISO } from 'date-fns';

const DayModal = ({ isOpen, onClose, selectedDate, tasks, onAddTask, onEditTask, toggleTask }) => {
  if (!isOpen) return null;

  // Filter tasks for this specific date
  const dayString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  
  const dailyTasks = tasks.filter(task => {
    // Check Start Date
    const start = task.startDate === dayString;
    // Check End Date (if it exists)
    const end = task.endDate === dayString;
    // Check if date falls in between (optional, but good for ranges)
    // For now, let's stick to start/end matches to match your calendar view logic
    return start || end;
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-[#F2F0E9] rounded-[20px] shadow-2xl w-[350px] max-h-[80vh] flex flex-col border-2 border-gray-900 p-4">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b-2 border-gray-300 pb-2">
          <div>
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">
              {selectedDate && format(selectedDate, 'MMM d')}
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {selectedDate && format(selectedDate, 'EEEE')}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition">
            ✕
          </button>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4 scrollbar-hide">
          {dailyTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs font-bold uppercase tracking-widest">
              No tasks for this day
            </div>
          ) : (
            dailyTasks.map(task => (
              <div 
                key={task.id}
                className={`p-3 rounded-lg border-2 border-gray-200 flex items-center gap-3 transition hover:border-gray-400 cursor-pointer ${task.completed ? 'bg-gray-200 opacity-60' : 'bg-white'}`}
                onClick={() => { onClose(); onEditTask(task); }}
              >
                 <div 
                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                    className={`w-4 h-4 rounded-[2px] border-2 flex items-center justify-center cursor-pointer ${task.completed ? 'bg-gray-800 border-gray-800' : 'border-gray-400'}`}
                 >
                    {task.completed && <div className="w-2 h-2 bg-white rounded-[1px]" />}
                 </div>
                 <span className={`text-xs font-bold uppercase truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                   {task.title}
                 </span>
              </div>
            ))
          )}
        </div>

        {/* Footer / Add Button */}
        <button 
          onClick={() => { onClose(); onAddTask(); }}
          className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs hover:bg-blue-600 transition shadow-lg"
        >
          + Add Task
        </button>

      </div>
    </div>
  );
};

export default DayModal;