import express from 'express'

const app = express()

app.use(express.json())
app.post("/listen-webhook", (req, res)=>{
    console.log("webhook hit")
    console.log("Received body:", req.body)
    res.send("webhook hit")
    // res.send("webhook hit")
})

app.listen(3000, ()=>{
    console.log("Server running on port 3000")
})