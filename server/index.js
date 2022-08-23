const express = require ("express");
const cors = require ("cors");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const messageRoute = require("./routes/messagesRoutes");
const socket = require("socket.io");
const app = express();
const fileupload = require("express-fileupload")

app.use(fileupload());
app.use(express.static("files"));

require('dotenv').config();

app.get('/cors', (req, res) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.send({ "msg": "This has CORS enabled 🎈" })
})

app.use(cors());
app.use(express.json());

app.use("/api/auth", userRoutes);
app.use("/api/messages", messageRoute)

app.post("/image", (req, res) => {
    const newpath = __dirname + "/files/";
    const file = req.files.file;
    const filename = file.name;

    file.mv(`${newpath}${filename}`, (err) => {
        if (err) {
            res.status(500).send({ message: "File upload failed", code: 200 });
        }
        res.status(200).send({ message: "File Uploaded", code: 200 });
    });
});


mongoose.connect(process.env.MONGO_URL,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
    console.log("DB Connection Succesfull")
})
    .catch((err) => {
    console.log(err.message)
})

const server = app.listen(process.env.PORT,()=>{
    console.log(`Server Started on Port ${process.env.PORT}`)
});

const io = socket(server, {
    cors: {
        origin:"http://localhost:3000",
        credentials: true,
    },
});
global.onlineUsers = new Map();

const users = {};
io.on("connection", (socket) => {
    global.chatSocket = socket;
    socket.on("add-user", (userId) => {
        console.log(userId, '########');
        onlineUsers.set(userId,socket.client.id);
    });
    // socket.on('login', function(data){
    //     console.log('a user ' + data.userId + ' connected');
    //     // saving userId to object with socket ID
    //     users[socket.id] = data.userId;
    // });
    socket.on('disconnect', function(){
        console.log(socket.client.id, "is disconnected");
        // remove saved socket from users object
        delete onlineUsers[socket.client.id];
    });

    socket.on("send-msg", (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket){
            socket.to(sendUserSocket).emit("msg-receive" , data.message);
        }
    });
});
