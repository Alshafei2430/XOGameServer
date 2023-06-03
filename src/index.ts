import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Server } from "socket.io";
import { createServer } from "http";
dotenv.config();

if (!process.env.PORT) {
  process.exit(1);
}

const PORT: number = parseInt(process.env.PORT as string, 10);

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
  },
});

let gameBoard: string[] = Array(9).fill("");
let currentPlayer = "X"; // Initialize with 'X' as the starting player

io.on("connection", (socket) => {
  console.log(`User with ID ${socket.id} connected`);

  socket.on("makeMove", (index: number) => {
    if (gameBoard[index] === "") {
      gameBoard[index] = currentPlayer;

      io.emit("moveMade", { index, player: currentPlayer });

      const winner = checkWinner();
      if (winner) {
        io.emit("gameOver", { result: `Winner is ${winner}` });
        resetBoard();
      } else {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
      }

      const draw = checkDraw();
      if (draw) {
        io.emit("gameOver", { result: `Draw` });
        resetBoard();
      }
    }
  });

  socket.on("resetBoard", () => {
    io.emit("boardReset");
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  socket.on("disconnect", () => {
    console.log(`User with ID ${socket.id} disconnected`);
  });
});

io.listen(PORT);

// Function to check for a winning combination
const checkWinner = () => {
  const winCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  for (const combination of winCombinations) {
    const [a, b, c] = combination;
    if (
      gameBoard[a] &&
      gameBoard[a] === gameBoard[b] &&
      gameBoard[a] === gameBoard[c]
    ) {
      return gameBoard[a];
    }
  }

  return null; // Return null if there's no winner
};
const checkDraw = () => {
  const leftSpots = gameBoard.filter((item) => item === "");
  return leftSpots.length === 0;
};

const resetBoard = () => {
  gameBoard = Array(9).fill(""); // Reset the game board
  currentPlayer = "X";
};
