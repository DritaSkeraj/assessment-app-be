const express = require("express")
const listEndpoints = require("express-list-endpoints")
const examsRouter = require("./services/exams")
const {
    badRequestHandler,
    notFoundHandler,
    genericErrorHandler,
  } = require("./errorHandlers")

const server = express();

const port = process.env.PORT || 3000

server.use(express.json());
server.use("/exams", examsRouter);

server.use(badRequestHandler)
server.use(notFoundHandler)
server.use(genericErrorHandler)

console.log(listEndpoints(server));

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
})


