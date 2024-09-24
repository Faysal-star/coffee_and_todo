import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const API_URL = "http://localhost:3001/api";
// const API_URL = "http://192.168.0.100:3001/api";

export default function Todo() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const res = await fetch(`${API_URL}/todos`);
    if (!res.ok) {
      console.error("Failed to fetch todos" + res.statusText);
      return;
    }
    const data = await res.json();
    setTodos(data);
  };

  const addTodo = () => {
    if (newTodo.trim() !== "") {
      const newId = Math.max(...todos.map((t) => t.id), 0) + 1;
      setTodos([...todos, { id: newId, text: newTodo, completed: false }]);
      setNewTodo("");
      fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newTodo , completed: false }),
      }).then((res) => {
        if (!res.ok) {
          console.error("Failed to add todo" + res.statusText);
        }
      });
    }
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );

    const todo = todos.find((todo) => todo.id === id);
    fetch(`${API_URL}/todos/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: todo?.text, completed: !todo?.completed }),
        }).then((res) => {
        if (!res.ok) {
            console.error("Failed to update todo" + res.statusText);
        }
        }).then(() => fetchTodos());
  };

  const deleteTodo = async (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    fetch(`${API_URL}/todos/${id}`, {
        method: "DELETE",
        }).then((res) => {
        if (!res.ok) {
            console.error("Failed to delete todo" + res.statusText);
        }
        }).then(() => fetchTodos());
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "all") return true;
    if (filter === "completed") return todo.completed;
    if (filter === "pending") return !todo.completed;
    return true;
  });

  return (
    <div className="flex-grow overflow-y-scroll ml-4 p-4 border-slate-300 border rounded-md">
      <div className="flex justify-center space-x-2 mb-4">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className="border-slate-300"
        >
          All
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
          className="border-slate-300"
        >
          Completed
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => setFilter("pending")}
          className="border-slate-300"
        >
          Pending
        </Button>
      </div>
        <Progress
            value={(todos.filter((todo) => todo.completed).length / todos.length) * 100}
            className="mb-4"
        />
      <div className="flex space-x-2 mb-4">
        <Input
          type="text"
          placeholder="Add new todo"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addTodo()}
          className="border-slate-300"
        />
        <Button onClick={addTodo}>Add Todo</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Status</TableHead>
            <TableHead>Task</TableHead>
            <TableHead className="w-[80px] text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTodos.map((todo) => (
            <TableRow key={todo.id}>
              <TableCell className="pt-0 pb-0 pl-4">
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo.id)}
                />
              </TableCell>
              <TableCell
                className={`${
                  todo.completed ? "text-gray-500 line-through p-0" : "p-0"
                }`}
              >
                {todo.text}
              </TableCell>
              <TableCell className="p-0 text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTodo(todo.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
