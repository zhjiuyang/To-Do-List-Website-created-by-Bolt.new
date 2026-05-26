import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { Plus, Trash2, Check, CheckCircle2, X, Pencil, AlertCircle } from 'lucide-react';

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  position: number;
  created_at: string;
}

const priorityConfig = {
  high: { color: 'red', label: '高', ring: 'ring-red-400' },
  medium: { color: 'orange', label: '中', ring: 'ring-orange-400' },
  low: { color: 'green', label: '低', ring: 'ring-green-400' },
};

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<Todo | null>(null);
  const [dragOverItem, setDragOverItem] = useState<Todo | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  async function fetchTodos() {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('position', { ascending: true });

    if (!error && data) {
      setTodos(data);
    }
    setLoading(false);
  }

  async function addTodo() {
    if (!input.trim()) return;

    const maxPosition = todos.length > 0 ? Math.max(...todos.map(t => t.position)) : 0;

    const { data, error } = await supabase
      .from('todos')
      .insert({ content: input.trim(), priority, position: maxPosition + 1 })
      .select()
      .single();

    if (!error && data) {
      setTodos((prev) => [data, ...prev.map(t => ({ ...t, position: t.position + 1 }))]);
      setInput('');
      setPriority('medium');
    }
  }

  async function toggleTodo(id: string, completed: boolean) {
    const { error } = await supabase
      .from('todos')
      .update({ completed: !completed })
      .eq('id', id);

    if (!error) {
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, completed: !completed } : todo
        )
      );
    }
  }

  async function deleteTodo(id: string) {
    const { error } = await supabase.from('todos').delete().eq('id', id);

    if (!error) {
      setTodos(todos.filter((todo) => todo.id !== id));
    }
  }

  async function clearCompleted() {
    const completedTodos = todos.filter((t) => t.completed);
    const ids = completedTodos.map((t) => t.id);

    const { error } = await supabase
      .from('todos')
      .delete()
      .in('id', ids);

    if (!error) {
      setTodos(todos.filter((todo) => !todo.completed));
    }
  }

  async function clearAll() {
    const ids = todos.map((t) => t.id);

    const { error } = await supabase
      .from('todos')
      .delete()
      .in('id', ids);

    if (!error) {
      setTodos([]);
      setShowClearConfirm(false);
    }
  }

  async function updatePositions(reorderedTodos: Todo[]) {
    const updates = reorderedTodos.map((todo, index) => ({
      id: todo.id,
      position: index + 1,
    }));

    for (const update of updates) {
      await supabase
        .from('todos')
        .update({ position: update.position })
        .eq('id', update.id);
    }
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditContent(todo.content);
    setEditPriority(todo.priority);
  }

  async function saveEdit(id: string) {
    if (!editContent.trim()) return;

    const { error } = await supabase
      .from('todos')
      .update({ content: editContent.trim(), priority: editPriority })
      .eq('id', id);

    if (!error) {
      setTodos(
        todos.map((todo) =>
          todo.id === id
            ? { ...todo, content: editContent.trim(), priority: editPriority }
            : todo
        )
      );
    }
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleDragStart(e: React.DragEvent, todo: Todo) {
    setDraggedItem(todo);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, todo: Todo) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverItem?.id !== todo.id) {
      setDragOverItem(todo);
    }
  }

  function handleDragEnd() {
    if (draggedItem && dragOverItem && draggedItem.id !== dragOverItem.id) {
      const items = [...todos];
      const dragIndex = items.findIndex((i) => i.id === draggedItem.id);
      const dropIndex = items.findIndex((i) => i.id === dragOverItem.id);

      const [removed] = items.splice(dragIndex, 1);
      items.splice(dropIndex, 0, removed);

      setTodos(items);
      updatePositions(items);
    }
    setDraggedItem(null);
    setDragOverItem(null);
  }

  const completedCount = todos.filter((t) => t.completed).length;
  const uncompletedCount = todos.length - completedCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-8 flex items-center justify-center gap-2">
            <span>📝</span>
            <span>我的待办清单</span>
          </h1>

          <div className="space-y-3 mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                placeholder="今天要做什么？"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              />
              <button
                onClick={addTodo}
                disabled={!input.trim()}
                className="px-5 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex gap-2">
              <span className="text-sm text-gray-500 self-center">优先级：</span>
              {(['high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    priority === p
                      ? `bg-${priorityConfig[p].color}-500 text-white shadow-md`
                      : `bg-${priorityConfig[p].color}-100 text-${priorityConfig[p].color}-600 hover:bg-${priorityConfig[p].color}-200`
                  }`}
                  style={{
                    backgroundColor:
                      priority === p
                        ? priorityConfig[p].color === 'red'
                          ? '#ef4444'
                          : priorityConfig[p].color === 'orange'
                          ? '#f97316'
                          : '#22c55e'
                        : undefined,
                    color: priority === p ? 'white' : undefined,
                  }}
                >
                  {priorityConfig[p].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mb-6 px-1">
            <div className="flex gap-6 text-sm">
              <span className="text-gray-600">
                未完成: <span className="font-semibold text-blue-600">{uncompletedCount}</span>
              </span>
              <span className="text-gray-600">
                已完成: <span className="font-semibold text-green-600">{completedCount}</span>
              </span>
            </div>
            <div className="flex gap-2">
              {completedCount > 0 && (
                <button
                  onClick={clearCompleted}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <CheckCircle2 size={16} />
                  <span>清空已完成</span>
                </button>
              )}
              {todos.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                  <span>全部清空</span>
                </button>
              )}
            </div>
          </div>

          {showClearConfirm && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="text-red-500" size={20} />
                <span className="text-red-700 font-medium">确认要清空所有任务吗？</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearAll}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-all"
                >
                  确认清空
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500">
              加载中...
            </div>
          ) : todos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-400 text-lg mb-2">暂无任务</p>
              <p className="text-gray-300 text-sm">添加一个新的任务开始吧！</p>
            </div>
          ) : (
            <div className="space-y-3" ref={listRef}>
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  draggable={editingId !== todo.id}
                  onDragStart={(e) => editingId !== todo.id && handleDragStart(e, todo)}
                  onDragOver={(e) => handleDragOver(e, todo)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => e.preventDefault()}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    editingId === todo.id ? '' : 'cursor-grab active:cursor-grabbing'
                  } ${
                    draggedItem?.id === todo.id
                      ? 'opacity-50 scale-95'
                      : dragOverItem?.id === todo.id
                      ? 'border-blue-400 border-2'
                      : ''
                  } ${
                    todo.completed
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  {editingId === todo.id ? (
                    <>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(todo.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <div className="flex gap-1">
                        {(['high', 'medium', 'low'] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => setEditPriority(p)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                              editPriority === p
                                ? 'ring-2 ' + priorityConfig[p].ring
                                : ''
                            }`}
                            style={{
                              backgroundColor:
                                p === 'high'
                                  ? '#ef444420'
                                  : p === 'medium'
                                  ? '#f9731620'
                                  : '#22c55e20',
                              color:
                                p === 'high'
                                  ? '#ef4444'
                                  : p === 'medium'
                                  ? '#f97316'
                                  : '#22c55e',
                            }}
                          >
                            {priorityConfig[p].label}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => saveEdit(todo.id)}
                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleTodo(todo.id, todo.completed)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          todo.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {todo.completed && <Check size={14} strokeWidth={3} />}
                      </button>
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            todo.priority === 'high'
                              ? '#ef4444'
                              : todo.priority === 'medium'
                              ? '#f97316'
                              : '#22c55e',
                        }}
                      />
                      <span
                        className={`flex-1 text-gray-700 ${
                          todo.completed ? 'line-through text-gray-400' : ''
                        }`}
                      >
                        {todo.content}
                      </span>
                      <button
                        onClick={() => startEdit(todo)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all flex-shrink-0"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          按住任务可拖拽排序
        </p>
      </div>
    </div>
  );
}

export default App;
