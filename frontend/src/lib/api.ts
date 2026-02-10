const API_URL = '/api';

export interface Todo {
    id: number;
    title: string;
    description?: string;
    completed: boolean;
}

export const fetchTodos = async (): Promise<Todo[]> => {
    const response = await fetch(`${API_URL}/todos`);
    if (!response.ok) throw new Error('Failed to fetch todos');
    return response.json();
};

export const createTodo = async (todo: { title: string; description?: string }): Promise<Todo> => {
    const response = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo),
    });
    if (!response.ok) throw new Error('Failed to create todo');
    return response.json();
};

export const updateTodo = async (id: number, todo: Partial<Todo>): Promise<Todo> => {
    const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo),
    });
    if (!response.ok) throw new Error('Failed to update todo');
    return response.json();
};

export const deleteTodo = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete todo');
};
