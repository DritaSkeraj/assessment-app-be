const express = require("express");
const listEndpoints = require("express-list-endpoints");
const examsRouter = require("./services/products");
const {
    badRequestHandeler,
    notFoundHandeler,
    genericErrorHandler
} = require("./errorHandlers");

const server = express();

const port = process.env.PORT || 3000

server.use(express.json());
server.use("/products", productsRouter);

server.use(badRequestHandeler);
server.use(notFoundHandeler);
server.use(genericErrorHandler);

console.log(listEndpoints(server));

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})