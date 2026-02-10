'use client';

import { Todo, updateTodo, deleteTodo } from '@/lib/api';
import { useState } from 'react';

interface TodoItemProps {
    todo: Todo;
    onUpdate: () => void;
    onDelete: () => void;
}

export default function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
    const [loading, setLoading] = useState(false);

    const toggleComplete = async () => {
        setLoading(true);
        try {
            await updateTodo(todo.id, { completed: !todo.completed });
            onUpdate();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await deleteTodo(todo.id);
            onDelete();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-3">
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={toggleComplete}
                    disabled={loading}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                    <h3 className={`text-lg font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {todo.title}
                    </h3>
                    {todo.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{todo.description}</p>
                    )}
                </div>
            </div>
            <button
                onClick={handleDelete}
                disabled={loading}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
                Delete
            </button>
        </div>
    );
}
