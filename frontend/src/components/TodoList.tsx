'use client';

import { useState, useEffect } from 'react';
import { Todo, fetchTodos, createTodo } from '@/lib/api';
import TodoItem from './TodoItem';

export default function TodoList() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [loading, setLoading] = useState(false);

    const loadTodos = async () => {
        try {
            const data = await fetchTodos();
            setTodos(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadTodos();
    }, []);

    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        setLoading(true);
        try {
            await createTodo({ title: newTitle, description: newDesc });
            setNewTitle('');
            setNewDesc('');
            loadTodos();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Todo App</h1>

            <form onSubmit={handleAddTodo} className="mb-8 space-y-4">
                <div>
                    <input
                        type="text"
                        placeholder="What needs to be done?"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        disabled={loading}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="Description (optional)"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        disabled={loading}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !newTitle.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                >
                    {loading ? 'Adding...' : 'Add Todo'}
                </button>
            </form>

            <div className="space-y-4">
                {todos.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">No todos yet. Add one above!</p>
                ) : (
                    todos.map((todo) => (
                        <TodoItem
                            key={todo.id}
                            todo={todo}
                            onUpdate={loadTodos}
                            onDelete={loadTodos}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
