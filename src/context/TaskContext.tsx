
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

import { supabase } from '../lib/supabase';

export type Task = {
  id: string;
  title: string;
  description: string;
  time: string;
  category: string;
  priority: string;
  completed: boolean;
};

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Complete React Native assignment',
    description: '',
    time: '10:00 AM',
    category: 'Study',
    priority: 'High',
    completed: false,
  },
  {
    id: '2',
    title: 'Review project requirements',
    description: '',
    time: '12:30 PM',
    category: 'Work',
    priority: 'Medium',
    completed: true,
  },
  {
    id: '3',
    title: 'Read programming notes',
    description: '',
    time: '04:00 PM',
    category: 'Study',
    priority: 'Low',
    completed: false,
  },
];

type NewTask = Omit<Task, 'id' | 'completed'>;

type TaskContextType = {
  tasks: Task[];
  addTask: (task: NewTask) => void;
  toggleTask: (id: string) => void;
  updateTask: (id: string, updatedTask: NewTask) => void;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      const { data, error } = await supabase
        .from('tasks')
        .select('*');

      if (error) {
        console.error('Supabase fetch error:', error.message);
        return;
      }

      if (!active) return;

      if (data.length === 0) {
        const { data: seededTasks, error: seedError } = await supabase
          .from('tasks')
          .insert(initialTasks)
          .select();

        if (seedError) {
          console.error('Initial tasks error:', seedError.message);
          return;
        }

        if (active) setTasks(seededTasks || []);
      } else {
        setTasks(data);
      }
    }

    loadTasks();

    return () => {
      active = false;
    };
  }, []);

  async function addTask(task: NewTask) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();

    if (error) {
      console.error('Add task error:', error.message);
      return;
    }

    setTasks((previousTasks) => [...previousTasks, data]);
  }

  async function toggleTask(id: string) {
    const currentTask = tasks.find((task) => task.id === id);

    if (!currentTask) return;

    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: !currentTask.completed })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Toggle task error:', error.message);
      return;
    }

    setTasks((previousTasks) =>
      previousTasks.map((task) => task.id === id ? data : task)
    );
  }

  async function updateTask(id: string, updatedTask: NewTask) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updatedTask)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update task error:', error.message);
      return;
    }

    setTasks((previousTasks) =>
      previousTasks.map((task) => task.id === id ? data : task)
    );
  }

  return (
    <TaskContext.Provider value={{ tasks, addTask, toggleTask, updateTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);

  if (!context) {
    throw new Error('useTasks must be used inside TaskProvider');
  }

  return context;
}
