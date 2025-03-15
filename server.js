import express from "express";
import http from "http";
import { Server } from "socket.io";
import mysql from "mysql2/promise";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Removed invalid import statement
    },
});

app.use(cors());
app.use(express.json());

let db;

// Initialize Database Connection
const connectDB = async () => {
    try {
        db = await mysql.createConnection({
            host: "srv1859.hstgr.io",
            user: "u471919822_cuadritoadmin",
            password: "Cuadrito_123",
            database: "u471919822_cuadrito",
        });
        console.log("Connected to MySQL database");
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("sendMessage", async ({ sender_id, message, receiver_id }) => {
        if (!receiver_id || !message.trim()) {
            console.log("Invalid message or receiver");
            return;
        }

        try {
            const [result] = await db.execute(
                "INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (?, ?, ?, NOW())",
                [sender_id, receiver_id, message]
            );

            console.log("Message stored in DB:", result);
            io.emit("newMessage", { sender_id, receiver_id, message });
        } catch (err) {
            console.error("DB Error:", err);
        }
    });
});

app.get("/messages/:sender_id/:receiver_id", async (req, res) => {
    const { sender_id, receiver_id } = req.params;

    try {
        const [messages] = await db.execute(
            `SELECT * FROM messages 
             WHERE (sender_id = ? AND receiver_id = ?) 
             OR (sender_id = ? AND receiver_id = ?) 
             ORDER BY created_at ASC`,
            [sender_id, receiver_id, receiver_id, sender_id]
        );

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: "Database error" });
    }
});

// Start the server after connecting to the database
const startServer = async () => {
    await connectDB();
    server.listen(3000, () => {
        console.log("Server running on port 3000");
    });
};

startServer();
