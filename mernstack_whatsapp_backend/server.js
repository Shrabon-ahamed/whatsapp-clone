const express = require ("express");
const mongoose = require("mongoose");
const Messages = require('./dbMessage');
const cors = require("cors");
const Pusher = require("pusher");
const PORT = process.env.PORT || 9000;
const app = express();

const dbUrl = 'mongodb+srv://user:WKdFcH6k5RUPHS7T@cluster0.gnt25.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

const pusher = new Pusher({
    appId: "1229029",
    key: "b445b5129214b360efbb",
    secret: "dd840217879157a4ca8c",
    cluster: "ap3",
    useTLS: true
});


app.use(express.json());
app.use(cors())
// app.use((req, res, next)=>{
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Headers", "*");
//     next()
// })

mongoose.connect(dbUrl, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection;

db.once("open", ()=>{
    console.log("DB Connected");
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change)=>{
        console.log("done", change)
        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                message : messageDetails.message,
                name : messageDetails.name,
                timestamp : messageDetails.timestamp,
                received : messageDetails.received
            })
        }else{
            console.log("Error triggering push")
        }
    })
})

app.get("/", (req, res)=> {
    res.send("hello")
})

app.get("/messages/sync", (req, res)=>{
    Messages.find((err, data)=>{
        if(err){
            res.status(500).send(err)
        }
        else{
            res.status(200).send(data)
        }
    })
})

app.post("/messages/new", (req, res)=>{
    const dbMessage = req.body;
    Messages.create(dbMessage, (err, data)=>{
        if(err){
            res.status(500).send(err)
        }
        else{
            res.status(201).send(`new message created: \n ${data}`)
        }
    })
})

app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`))