import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const TaskModal = ({ isOpen, onClose, selectedDate, onSave, taskToEdit, onDelete }) => {
  const [formData, setFormData] = useState({ title: '', description: '', startDate: '', endDate: '' });

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setFormData(taskToEdit);
      } else {
        const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
        setFormData({ title: '', description: '', startDate: dateStr, endDate: '' });
      }
    }
  }, [isOpen, taskToEdit, selectedDate]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      id: taskToEdit ? taskToEdit.id : uuidv4(), 
      completed: taskToEdit ? taskToEdit.completed : false,
      ...formData 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#F2F0E9] rounded-[20px] shadow-2xl w-[400px] p-6 border-2 border-gray-800">
        <h2 className="text-xl font-bold text-gray-800 mb-4 uppercase tracking-widest">
          {taskToEdit ? 'Edit Agenda' : 'New Agenda'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Task / Agenda Name</label>
            <input 
              required
              className="w-full bg-[#EAE8E3] border-2 border-gray-300 rounded-lg p-3 text-gray-800 font-bold focus:border-gray-800 focus:outline-none"
              placeholder="E.g. Submit Project"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Start Date</label>
              <input 
                type="date" 
                required 
                className="w-full bg-[#EAE8E3] border-2 border-gray-300 rounded-lg p-2 text-sm font-bold" 
                value={formData.startDate} 
                onChange={e => setFormData({...formData, startDate: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Deadline (Optional)</label>
              <input 
                type="date" 
                /* NO REQUIRED TAG HERE */
                className="w-full bg-[#EAE8E3] border-2 border-gray-300 rounded-lg p-2 text-sm font-bold text-gray-600" 
                value={formData.endDate} 
                onChange={e => setFormData({...formData, endDate: e.target.value})} 
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            {taskToEdit && (
              <button type="button" onClick={() => { onDelete(taskToEdit.id); onClose(); }} className="text-red-500 text-xs font-bold uppercase hover:underline">Delete</button>
            )}
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 text-xs font-bold uppercase">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-gray-800 hover:bg-black text-white rounded-lg text-xs font-bold uppercase shadow-lg">Save</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;