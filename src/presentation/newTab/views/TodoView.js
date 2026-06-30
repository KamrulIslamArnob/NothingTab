import { el } from "../../shared/dom.js";
import { icon } from "../../shared/icons.js";

export class TodoView {
  constructor({ useCases, toast }) {
    this.useCases = useCases;
    this.toast = toast;
  }

  render(state) {
    this.root = el("div", { className: "nothing-widget todo-widget" });
    this.update(this.root, state);
    return this.root;
  }

  update(root, { tasks }) {
    const sorted = [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (a.order ?? 0) - (b.order ?? 0);
    });

    const addBtn = el("button", { type: "button", className: "nw-add-btn", title: "Add task" }, icon("plus"));
    const inputRow = el("div", { className: "todo-input-row hidden" });
    const titleInput = el("input", {
      type: "text",
      className: "todo-input-field",
      placeholder: "New task...",
      maxLength: 200,
    });
    inputRow.appendChild(titleInput);

    addBtn.addEventListener("click", () => {
      inputRow.classList.toggle("hidden");
      if (!inputRow.classList.contains("hidden")) titleInput.focus();
    });

    const addTask = async () => {
      const value = titleInput.value.trim();
      if (!value) return;
      try {
        await this.useCases.createTask.execute({ title: value });
        titleInput.value = "";
        inputRow.classList.add("hidden");
        this.update(root, { tasks: await this.useCases.listTasks.execute() });
      } catch (err) {
        this.toast.show(err.message || "Could not add task", { error: true });
      }
    };

    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addTask();
      if (e.key === "Escape") inputRow.classList.add("hidden");
    });

    const header = el("div", { className: "nw-header" },
      el("span", { className: "nw-title" },
        "TODAY'S FOCUS ",
        el("span", { className: "badge-dot todo-badge-dot" })
      ),
      addBtn
    );

    const list = el("div", { className: "todo-list-container" });
    if (sorted.length === 0) {
      list.appendChild(el("div", { className: "todo-empty-state" }, "You have no tasks for today."));
    } else {
      sorted.forEach(task => list.appendChild(this.renderItem(task, root)));
    }

    root.replaceChildren(header, inputRow, list);
  }

  renderItem(task, root) {
    const item = el("div", { className: `todo-item-row ${task.completed ? "is-done" : ""}` });
    const titleEl = el("span", { className: "todo-text" }, task.title);
    const circle = el("span", { className: "todo-circle-icon todo-toggle" }, task.completed ? icon("check") : icon("circle"));

    circle.addEventListener("click", async () => {
      try {
        await this.useCases.updateTask.execute({ id: task.id.value, completed: !task.completed });
        this.update(root, { tasks: await this.useCases.listTasks.execute() });
      } catch (err) {
        this.toast.show(err.message || "Could not update task", { error: true });
      }
    });

    item.addEventListener("contextmenu", async (e) => {
      e.preventDefault();
      try {
        await this.useCases.deleteTask.execute(task.id.value);
        this.update(root, { tasks: await this.useCases.listTasks.execute() });
      } catch (err) {
        this.toast.show("Could not delete task", { error: true });
      }
    });

    item.append(titleEl, circle);
    return item;
  }
}
