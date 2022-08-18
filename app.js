const format = require("date-fns/format");
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : '${e.message}'`);
    process.exit(1);
  }
};
initializeDbAndServer();

const havingStatusAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};
const havingStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const havingPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const havingCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const havingCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const havingCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const changingNames = (item) => {
  return {
    id: item.id,
    todo: item.todo,
    priority: item.priority,
    status: item.status,
    category: item.category,
    dueDate: item.due_date,
  };
};

//Get Todos
app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority, category } = request.query;
  let queryResults = "";
  let final = "";
  const requestQuery = request.query;
  switch (true) {
    case havingStatusAndPriorityProperties(request.query):
      queryResults = `
        SELECT *
        FROM todo
        WHERE todo LIKE '%${search_q}%' AND status='${status}' AND priority='${priority}'`;
      break;
    case havingStatus(request.query):
      queryResults = `
        SELECT *
        FROM todo
        WHERE todo like '%${search_q}%' AND status='${status}'`;
      break;
    case havingPriority(request.query):
      queryResults = `
        SELECT *
        FROM todo
        WHERE todo like '%${search_q}%' AND priority='${priority}'`;
      break;
    case havingCategoryAndStatus(request.query):
      queryResults = `
        SELECT *
        FROM todo
        WHERE todo like '%${search_q}%' AND category='${category}' AND status='${status}'`;
      break;
    case havingCategory(request.query):
      queryResults = `
        SELECT *
        FROM todo 
        WHERE todo LIKE '%${search_q}%' AND category='${category}'`;
      break;
    case havingCategoryAndPriority(request.query):
      queryResults = `
        SELECT *
        FROM todo 
        WHERE todo LIKE '%${search_q}%' AND category='${category}' AND priority='${priority}'`;
      break;
    default:
      queryResults = `
      SELECT *
      FROM todo
      WHERE todo LIKE '%${search_q}%'`;
  }
  final = await db.all(queryResults);
  response.send(final.map((eachItem) => changingNames(eachItem)));
});
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const singleQuery = `
    SELECT *
    FROM todo 
    WHERE id=${todoId}`;
  const singleResponse = await db.get(singleQuery);
  response.send(changingNames(singleResponse));
});
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateQuery = `
  SELECT *
  FROM todo
  WHERE due_date='${date}'`;
  const dateResponse = await db.all(dateQuery);
  response.send(dateResponse.map((everyItem) => changingNames(everyItem)));
});
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postQuery = `
    INSERT INTO todo(id,todo,priority,status,category,due_date)
    VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}')`;
  const postResponse = await db.run(postQuery);
  response.send("Todo Successfully Added");
});
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let message = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      message = "Status";
      break;
    case requestBody.priority !== undefined:
      message = "Priority";
      break;
    case requestBody.todo !== undefined:
      message = "Todo";
      break;
    case requestBody.category !== undefined:
      message = "Category";
      break;
    case requestBody.dueDate !== undefined:
      message = "Due Date";
      break;
  }
  const pastQuery = `
  SELECT *
  FROM todo 
  WHERE id=${todoId}`;
  const pastResponse = await db.get(pastQuery);
  const {
    todo = pastResponse.todo,
    priority = pastResponse.priority,
    status = pastResponse.status,
    category = pastResponse.category,
    dueDate = pastResponse.due_date,
  } = request.body;
  const updateQuery = `
  UPDATE todo
  SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
  WHERE id=${todoId}`;
  const updateResponse = await db.run(updateQuery);
  response.send(`${message} Updated`);
});
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo
    WHERE id=${todoId}`;
  const deleteResponse = await db.run(deleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
