import express from "express";

const app = express();

// Routes

// HTTP request
app.get('/',(req,res,next)=>{
  res.json({
    message: "Welcome to elib apis"
  })
})

export default app;
