require("dotenv").config();
const app = require("./src/app");
const connectToDB = require("./src/config/database");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const battleHandler = require("./socket/battleHandler");

connectToDB();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ["http://localhost:5173", process.env.CLIENT_URL],
    credentials:true,
    methods:["GET","POST"],
   },
});

//Socket logic attached
battleHandler(io);

server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
