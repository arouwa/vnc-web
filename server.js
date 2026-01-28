const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const rooms = {}; // { code: hostSocketId }

io.on("connection", (socket) => {

  // Ekran paylaşmak isteyen
  socket.on("create-room", () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    rooms[code] = socket.id;
    socket.emit("room-created", code);
  });

  // İzlemek isteyen
  socket.on("join-room", (code) => {
    const hostId = rooms[code];
    if (hostId) {
      socket.emit("room-joined", hostId);
    } else {
      socket.emit("invalid-code");
    }
  });

  // WebRTC signaling
  socket.on("offer", ({ to, offer }) => {
    if (to) io.to(to).emit("offer", { from: socket.id, offer });
    else socket.broadcast.emit("offer", { from: socket.id, offer }); // host broadcast
  });

  socket.on("answer", ({ to, answer }) => {
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    if (to) io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    else socket.broadcast.emit("ice-candidate", { from: socket.id, candidate });
  });

  socket.on("disconnect", () => {
    for (let code in rooms) {
      if (rooms[code] === socket.id) delete rooms[code];
    }
  });
});

http.listen(3000, () => console.log("Server running on http://localhost:3000"));
