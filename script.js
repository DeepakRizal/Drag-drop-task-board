const newListInput = document.querySelector("#new-list-name");
const addListButton = document.querySelector("#add-list-btn");
const listContainer = document.querySelector("#lists-container");

let boardData = JSON.parse(localStorage.getItem("boardData")) || [];

const ICONS = {
  edit: "✏️",
  delete: "🗑️",
  add: "+",
};

function addListHandler() {
  const listName = newListInput.value.trim();
  if (listName === "") {
    return alert("Please input the list name before proceding");
  }

  boardData.push({
    listName,
    tasks: [],
  });
  renderBoard();
  newListInput.value = "";
}

let draggedTask = null;

function dragStartHandler(e) {
  const textContent = e.target.querySelector(".task-text").textContent;

  draggedTask = {
    listIndex: e.target.getAttribute("data-list-index"),
    taskIndex: e.target.getAttribute("data-task-index"),
    content: textContent,
  };
}

function createIconButton(icon) {
  const button = document.createElement("button");
  button.textContent = icon;
  button.style.cursor = "pointer";
  return button;
}

function createContainerElement(className) {
  const container = document.createElement("div");
  container.classList.add(className);
  return container;
}

function createTextElement(text, className, element) {
  const textElement = document.createElement(element);
  textElement.classList.add(className);
  textElement.textContent = text;
  return textElement;
}

function renderTaskList(task, taskIndex, listIndex, taskContainer) {
  const taskEl = document.createElement("div");
  taskEl.classList.add("task");

  //make the taskEl draggable
  taskEl.setAttribute("draggable", true);
  taskEl.setAttribute("data-task-index", taskIndex);
  taskEl.setAttribute("data-list-index", listIndex);

  const textEl = createTextElement(task, "task-text", "p");

  const taskActionContainer = createContainerElement("task-action-container");

  const taskEditButton = createIconButton(ICONS.edit);

  taskEditButton.addEventListener("click", enterTaskEditMode);

  const deleteButton = createIconButton(ICONS.delete);

  taskActionContainer.appendChild(taskEditButton);
  taskActionContainer.appendChild(deleteButton);

  deleteButton.addEventListener("click", handleDelete);

  taskEl.appendChild(textEl);
  taskEl.appendChild(taskActionContainer);

  taskEl.addEventListener("dragstart", dragStartHandler);
  taskContainer.appendChild(taskEl);
}

function renderListHeading(listName) {
  const headingContainer = createContainerElement("heading-container");

  const listHeading = createTextElement(listName, "list-heading", "h3");

  const listActionContainer = createContainerElement("list-action-container");

  const deleteListButton = createIconButton(ICONS.delete);
  const editListButton = createIconButton(ICONS.edit);

  listActionContainer.appendChild(editListButton);
  listActionContainer.appendChild(deleteListButton);

  deleteListButton.addEventListener("click", handleListDelete);
  editListButton.addEventListener("click", enterListEditMode);

  headingContainer.appendChild(listHeading);
  headingContainer.appendChild(listActionContainer);

  return headingContainer;
}

function renderTaskContainer(list, listIndex) {
  const taskContainer = createContainerElement("task-container");

  list.tasks.forEach((task, taskIndex) => {
    renderTaskList(task, taskIndex, listIndex, taskContainer);
  });

  return taskContainer;
}

function renderAddTaskSection(listIndex) {
  const addTask = createContainerElement("add-task");

  const taskInput = document.createElement("input");
  taskInput.placeholder = "Input your task....";

  const taskAddButton = createIconButton(ICONS.add);

  taskAddButton.addEventListener("click", () => {
    const value = taskInput.value.trim();

    if (!value) {
      return alert("Please enter the task!");
    }
    boardData[listIndex].tasks.push(value);

    taskInput.value = "";
    saveAndRender();
  });

  addTask.appendChild(taskInput);
  addTask.appendChild(taskAddButton);
  return addTask;
}

function renderList(list, listIndex) {
  const listEl = createContainerElement("list");
  listEl.setAttribute("data-list-index", listIndex);

  const listHeading = renderListHeading(list.listName);

  const tasks = renderTaskContainer(list, listIndex);

  const addTaskSection = renderAddTaskSection(listIndex);

  listEl.addEventListener("dragover", (e) => e.preventDefault());
  listEl.addEventListener("drop", handleDrop);

  listEl.appendChild(listHeading);
  listEl.appendChild(tasks);
  listEl.appendChild(addTaskSection);

  listContainer.appendChild(listEl);

  return listEl;
}

function renderBoard() {
  listContainer.innerHTML = "";
  boardData.forEach((list, listIndex) => {
    renderList(list, listIndex);
  });
}

function handleDelete(e) {
  const taskElement = e.target.closest(".task");
  const taskIndex = taskElement.getAttribute("data-task-index");
  const listIndex = taskElement.getAttribute("data-list-index");

  let filteredData = boardData[listIndex].tasks.filter(
    (task, index) => index !== Number(taskIndex)
  );
  boardData[listIndex].tasks = filteredData;
  saveAndRender();
}

function handleListDelete(e) {
  const listElement = e.target.closest(".list");
  const listIndex = Number(listElement.getAttribute("data-list-index"));
  boardData = boardData.filter((data, index) => index !== listIndex);
  saveAndRender();
}

function createEditInput() {
  const input = document.createElement("input");
  input.classList.add("edit-input");
  input.type = "text";
  return input;
}

function createSaveButton() {
  const button = document.createElement("button");
  button.classList.add("save");
  button.textContent = "Save";

  return button;
}

function enterListEditMode(e) {
  const listElement = e.target.closest(".list");
  console.log(listElement);

  const editInput = createEditInput();

  const listHeading = listElement.querySelector(".list-heading");
  const textContent = listHeading.textContent;
  editInput.value = textContent;
  listHeading.remove();

  const saveButton = createSaveButton();

  saveButton.addEventListener("click", (e) => {
    saveEditTitle(e, editInput.value);
  });

  const headingContainer = listElement.querySelector(".heading-container");
  console.log(headingContainer);
  const listActionContainer = listElement.querySelector(
    ".list-action-container"
  );
  listActionContainer.innerHTML = "";
  listActionContainer.appendChild(saveButton);

  headingContainer.insertBefore(editInput, listActionContainer);
}

function enterTaskEditMode(e) {
  const taskElement = e.target.closest(".task");

  const editInput = createEditInput();

  const taskText = taskElement.querySelector(".task-text");
  const textContent = taskText.textContent;
  editInput.value = textContent;
  taskText.remove();

  const saveButton = createSaveButton();

  saveButton.addEventListener("click", (e) => {
    saveEditTask(e, editInput.value);
  });

  const taskActionContainer = taskElement.querySelector(
    ".task-action-container"
  );
  taskActionContainer.innerHTML = "";
  taskActionContainer.appendChild(saveButton);

  taskElement.insertBefore(editInput, taskActionContainer);
}

function saveEditTitle(event, value) {
  const listElement = event.target.closest(".list");
  const listElementIndex = Number(listElement.getAttribute("data-list-index"));

  boardData = boardData.map((data, index) =>
    index === listElementIndex ? { ...data, listName: value } : data
  );

  saveAndRender();
}

function saveEditTask(event, value) {
  const taskElement = event.target.closest(".task");
  const listElementIndex = Number(taskElement.getAttribute("data-list-index"));
  const taskElementIndex = Number(taskElement.getAttribute("data-task-index"));

  boardData[listElementIndex].tasks.splice(taskElementIndex, 1, value);

  console.log(boardData);

  saveAndRender();
}

function handleDrop(e) {
  e.preventDefault();
  const dropListIndex = e.currentTarget.getAttribute("data-list-index");

  if (dropListIndex === draggedTask.listIndex) {
    return;
  }

  boardData[draggedTask.listIndex].tasks.splice(draggedTask.taskIndex, 1);
  boardData[dropListIndex].tasks.push(draggedTask.content);
  saveAndRender();
}

function saveAndRender() {
  localStorage.setItem("boardData", JSON.stringify(boardData));
  renderBoard();
}

addListButton.addEventListener("click", addListHandler);

saveAndRender();
