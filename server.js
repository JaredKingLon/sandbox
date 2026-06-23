const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const players = {};

const playerColours = [
    0xff0000,
    0x0000ff
];

io.on("connection", (socket) => {

    console.log("A player connected:", socket.id);

    if (Object.keys(players).length >= 2) {
        socket.emit("gameFull");
        socket.disconnect();
        return;
    }

    const playerNumber = Object.keys(players).length;

    players[socket.id] = {
        x: playerNumber === 0 ? 150 : 650,
        y: 250,
        colour: playerColours[playerNumber]
    };

    socket.emit("currentPlayers", players);

    socket.broadcast.emit("newPlayer", {
        id: socket.id,
        player: players[socket.id]
    });

    socket.on("playerMovement", (movementData) => {

        const player = players[socket.id];

        if (!player) {
            return;
        }

        player.x = movementData.x;
        player.y = movementData.y;

        socket.broadcast.emit("playerMoved", {
            id: socket.id,
            x: player.x,
            y: player.y
        });
    });

    socket.on("disconnect", () => {

        console.log("A player disconnected:", socket.id);

        delete players[socket.id];

        io.emit("playerDisconnected", socket.id);
    });
});

const PORT = process.env.PORT || 8765;

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Stop the other process or run with PORT=<newPort>.`);
        process.exit(1);
    }

    if (error.code === "EACCES") {
        console.error(`Permission denied for port ${PORT}. Use a port above 1024 or run with elevated privileges.`);
        process.exit(1);
    }

    throw error;
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
