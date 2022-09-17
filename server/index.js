const express=require('express')
const path=require('path')

const app=express()

app.use(express.static(path.resolve(__dirname,"../client/build")))

app.get('/api/v1',(req,res)=>{
    res.status(200).json({'message':'Welcome to Feeds-appv1.0'})
})


app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname,"../client/build","index.html"))
})

app.listen(4000,(req,res)=>{
    console.log("The server started on port 4000")
})