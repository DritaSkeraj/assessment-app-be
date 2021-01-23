const express = require("express")
const cors = require("cors")
const listEndpoints = require("express-list-endpoints")
const examsRouter = require("./services/exams")
const {
    badRequestHandler,
    notFoundHandler,
    genericErrorHandler,
  } = require("./errorHandlers")

const server = express();

const port = process.env.PORT || 3030

server.use(express.json());

const whiteList = 'http://127.0.0.1:3000/exams'

const corsOptions = {
  origin: function (origin, callback) {
    if (whiteList.indexOf(origin) !== -1) {
      // allowed
      callback(null, true)
    } else {
      // Not allowed
      callback(new Error("NOT ALLOWED - CORS ISSUES"))
    }
  },
}
server.use(cors()) // CROSS ORIGIN RESOURCE SHARING


server.use("/exams", examsRouter);

server.use(badRequestHandler)
server.use(notFoundHandler)
server.use(genericErrorHandler)

console.log(listEndpoints(server));

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
})


