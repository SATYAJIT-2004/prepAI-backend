let rooms = {};

function battleHandler(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // JOIN ROOM
    socket.on(
      "join-room",

      ({ roomCode, user }) => {
        socket.join(roomCode);

        console.log("Current rooms:", Object.keys(rooms));

        if (!rooms[roomCode]) {
          rooms[roomCode] = {
            players: [],

            questions: [],

            currentQuestionIndex: 0,

            timer: null,

            timeLeft: 10,

            started: false,

            submissions: {},
          };
        }

        // prevent duplicate join
        const exists = rooms[roomCode].players.find((p) => p.id === socket.id);

        if (!exists) {
          rooms[roomCode].players.push({
            id: socket.id,

            name: user.name,

            score: 0,

            correctAnswers: 0,

            attempted: 0,

            accuracy: 0,
          });
        }

        socket.emit("joined-success");

        io.to(roomCode).emit("update-leaderboard", rooms[roomCode].players);

        // =========================
        // SYNC LATE JOINED USERS
        // =========================

        const room = rooms[roomCode];

        if (room.started) {
          // disable start button for new user
          socket.emit("battle-started");

          // current running question
          const currentQ = room.questions[room.currentQuestionIndex];

          if (currentQ) {
            socket.emit("new-question", {
              question: currentQ.question,

              options: currentQ.options,

              index: room.currentQuestionIndex + 1,

              total: 10,
            });

            // sync timer
            socket.emit("timer", room.timeLeft);
          }
        }
      },
    );

    // SEND QUESTION
    const sendQuestion = (io, roomCode) => {
      const room = rooms[roomCode];

      const currentQ = room.questions[room.currentQuestionIndex];

      // safety check
      if (!currentQ) {
        room.started = false;
        clearInterval(room.timer);

        io.to(roomCode).emit("battle-ended", { leaderboard: room.players });

        return;
      }

      room.timeLeft = 10;

      room.submissions = {};

      io.to(roomCode).emit("new-question", {
        question: currentQ.question,

        options: currentQ.options,

        index: room.currentQuestionIndex + 1,

        total: 10,
      });

      // clear old timer
      if (room.timer) {
        clearInterval(room.timer);
      }

      room.timer = setInterval(() => {
        room.timeLeft--;

        io.to(roomCode).emit("timer", room.timeLeft);

        if (room.timeLeft <= 0) {
          clearInterval(room.timer);

          room.currentQuestionIndex++;

          if (room.currentQuestionIndex >= 10) {
            room.started = false;
            clearInterval(room.timer);

            io.to(roomCode).emit("battle-ended", {
             leaderboard:room.players,
            });
            return;
          }

          sendQuestion(io, roomCode);
        }
      }, 1000);
    };

    // START BATTLE
    socket.on(
      "start-battle",

      ({ roomCode }) => {
        const room = rooms[roomCode];

        if (!room) {
          console.log("❌ Room not found:", roomCode);

          return;
        }

        if (room.started) return;

        room.started = true;
        io.to(roomCode).emit("battle-started");

        const questions = require("../data/questions");

        // ALL QUESTIONS
        room.questions = questions;

        // start from first question
        room.currentQuestionIndex = 0;

        sendQuestion(io, roomCode);
      },
    );

    // SUBMIT ANSWER
    socket.on(
      "submit-answer",

      ({ roomCode, answer }) => {
        const room = rooms[roomCode];

        if (!room) return;

        const player = room.players.find((p) => p.id === socket.id);

        if (!player) return;

        // prevent duplicate answer
        if (room.submissions[socket.id]) return;

        room.submissions[socket.id] = true;

        const currentQ = room.questions[room.currentQuestionIndex];

        player.attempted++;

        const isCorrect = answer === currentQ.correctIndex;

        if (isCorrect) {
          player.correctAnswers++;

          const speedBonus = room.timeLeft * 5;

          player.score += 100 + speedBonus;
        }

        player.accuracy = Math.round(
          (player.correctAnswers / player.attempted) * 100,
        );

        // sort leaderboard
        room.players.sort((a, b) => b.score - a.score);

        io.to(roomCode).emit("update-leaderboard", room.players);

        io.to(socket.id).emit("answer-result", {
          correct: isCorrect,

          correctAnswer: currentQ.correctIndex,
        });
      },
    );

    // DISCONNECT
    socket.on(
      "disconnect",

      () => {
        for (let roomCode in rooms) {
          const room = rooms[roomCode];

          room.players = room.players.filter((p) => p.id !== socket.id);

          // delete empty room
          if (room.players.length === 0) {
            clearInterval(room.timer);

            delete rooms[roomCode];

            console.log("Room deleted:", roomCode);
          }

          io.to(roomCode).emit("update-leaderboard", room.players);
        }

        console.log("User disconnected:", socket.id);
      },
    );
  });
}

module.exports = battleHandler;
