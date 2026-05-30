require("dotenv").config();
const app = require("./src/app");
const connectToDB = require("./src/config/database");
const http = require("http");
const {Server} = require("socket.io");
require("dotenv").config();
const battleHandler = require("./socket/battleHandler")


connectToDB();


const server = http.createServer(app)
const io = new Server(server,{
    cors:{origin:"*"}
});

//Socket logic attached
battleHandler(io);


server.listen(3000, () => {
  console.log("Server is running on PORT 3000");
});
