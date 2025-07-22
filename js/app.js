const API_URL = 'https://dummyjson.com/todos';
const LIMIT = 10;
let todos = [], currentPage = 1, filteredTodos = [];

const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const todoList = document.getElementById('todoList');
const pagination = document.getElementById('pagination');

const fetchTodos = async () => {
  try {
    loadingEl.style.display = 'block';
    const res = await fetch(`${API_URL}?limit=100`);
    if (!res.ok) throw new Error('Failed to fetch todos');
    const data = await res.json();
    todos = data.todos.map(todo => ({
      ...todo,
      createdAt: new Date(Date.now() - Math.random() * 10000000000) // Random date for filtering
    }));
    filteredTodos = [...todos];
    renderTodos();
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    loadingEl.style.display = 'none';
  }
};

const renderTodos = () => {
  todoList.innerHTML = '';
  pagination.innerHTML = '';
  const start = (currentPage - 1) * LIMIT;
  const paginated = filteredTodos.slice(start, start + LIMIT);

  if (paginated.length === 0) {
    todoList.innerHTML = '<li class="list-group-item text-center">No todos found</li>';
  }

  paginated.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <span>${todo.todo} <small class="text-muted">(${todo.createdAt.toLocaleDateString()})</small></span>
      <div>
        <button class="btn btn-sm btn-outline-primary me-2" onclick="editTodo(${todo.id})">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteTodo(${todo.id})">Delete</button>
      </div>
    `;
    todoList.appendChild(li);
  });

  const totalPages = Math.ceil(filteredTodos.length / LIMIT);
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === currentPage ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener('click', () => {
      currentPage = i;
      renderTodos();
    });
    pagination.appendChild(li);
  }
};

const applyFilters = () => {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const from = new Date(document.getElementById('fromDate').value);
  const to = new Date(document.getElementById('toDate').value);

  filteredTodos = todos.filter(todo => {
    const task = todo.todo.toLowerCase();
    const created = new Date(todo.createdAt);
    const matchesSearch = task.includes(search);
    const matchesDate = (!isNaN(from) ? created >= from : true) && (!isNaN(to) ? created <= to : true);
    return matchesSearch && matchesDate;
  });

  currentPage = 1;
  renderTodos();
};

document.getElementById('todoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newTodoText = document.getElementById('newTodo').value.trim();
  if (!newTodoText) return;

  try {
    loadingEl.style.display = 'block';
    const res = await fetch(API_URL + '/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todo: newTodoText, completed: false, userId: 5 })
    });
    if (!res.ok) throw new Error('Failed to add todo');
    const newTodo = await res.json();
    newTodo.createdAt = new Date();
    todos.unshift(newTodo);
    applyFilters();
    document.getElementById('newTodo').value = '';
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    loadingEl.style.display = 'none';
  }
});

const deleteTodo = async (id) => {
  if (!confirm('Are you sure you want to delete this todo?')) return;
  try {
    loadingEl.style.display = 'block';
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete todo');
    todos = todos.filter(todo => todo.id !== id);
    applyFilters();
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    loadingEl.style.display = 'none';
  }
};

const editTodo = (id) => {
  const todo = todos.find(t => t.id === id);
  const newTask = prompt('Edit task:', todo.todo);
  if (newTask && newTask.trim() !== '') {
    updateTodo(id, newTask.trim());
  }
};

const updateTodo = async (id, newText) => {
  try {
    loadingEl.style.display = 'block';
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todo: newText })
    });
    if (!res.ok) throw new Error('Failed to update todo');
    const updatedTodo = await res.json();
    todos = todos.map(t => t.id === id ? { ...t, todo: updatedTodo.todo } : t);
    applyFilters();
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    loadingEl.style.display = 'none';
  }
};

fetchTodos();
