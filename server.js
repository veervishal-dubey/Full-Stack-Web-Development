const express=require('express');
const pool=require('./database');
const jwt=require('jsonwebtoken');


require('dotenv').config({path:"./.env"});
console.log("JWT_SECRET:", process.env.JWT_SECRET);
const app=express();

//creates the web server

app.use(express.json()); 

// isse server json data handle karta hai

app.get('/',function(req,res){
    res.send("Server backend is up and running.")
});
// this is the part of the code that actually does something. isme hum server ko keh rhe hai ki basically jab bhi tumhe koi bhi "/"" browser me dikhe, to ye wala function call kar do. 
// function(req,res) ek call back function hai to automatiaclly tab call hoti hai jab bhi ek request aati hai. req is request object, jisme user ka data hota hai, or res is response object jis ke help se we can design a response.

app.get('/users',async(req,res)=>{
    try
    {
        const [rows]=await pool.query("Select * from users;");//isme pool.query is using the pool object jo database.js me define kiya tha to get the result.
        res.json(rows);//result ko json form me convert kar rhe hai, taaki front end sahi se handle ho jaaye    
    }
    catch(err)
    {
        res.status(500).json({error: "Database Error"})//agar koi error aata hai to ye execute hoga.
    }
});
//ye ek basic sa route hai, jo bata rha hai ki if someone sends a get request to /users, run this piece of code. 
//access @ http://localhost:5000/users

app.get('/rainfall',async(req,res) => {
    try
    {
        const [rows]=await pool.query("select * from rainfall_data;");
        res.json(rows);
    }
    catch(err)
    {
        res.status(500).json({error: "Database error"});
    }
});
// access @ http://localhost:5000/rainfall

app.get('/calculate/:site_id',async function(req,res){
    const siteId=req.params.site_id;
    try
    {
        const [calcs]=await pool.query("call harvest_calculation(?);",[siteId]);
        res.json(calcs[0]);
    }
    catch(err)
    {
        res.status(500).json({error: "Database error"});
    }

});
// access @ http://localhost:5000/calculate/{any site id}

app.get('/recommended/:volume',async function(req,res){
    const volume=Number(req.params.volume);
    try
    {
        const [struct]=await pool.query("call recommended_structures(?);",[volume]);
        res.json(struct[0]);
    }
    catch(err)
    {
        res.status(500).json({error: "Database error"});
    }

});
// access at http://localhost:5000/recommended/{any number}

app.get('/summary/:user_Id',async function(req,res){
    const userId=req.params.user_Id;
    try{
        const[summary]=await pool.query("call generate_summary(?);",[userId]);
        res.json(summary[0]);
    }
    catch(err)
    {
        res.status(500).json({error: "Database error"});
    }
});
//access at http://localhost:5000/summary/{any user id}

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [auth] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (auth.length === 0) {
      return res.status(401).json({ error: "Invalid Credentials" });
    } else {
      const user_cred = auth[0];
      if (user_cred.password !== password) {
        return res.status(410).json({ error: "Wrong Password Entered." });
      } else {
        const token = jwt.sign(
          {
            user_id: user_cred.userid,
            email: user_cred.email,
          },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );
        res.json({ message: "Login Successful", token });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});
// this is accessed using postman

app.post("/register",async(req,res)=>{
    const {name,email,password}=req.body;

    try{
        const [ifexists]=await pool.query("select * from users where email = ?",[email]);
        if (ifexists.length>0)
        {
            return res.status(409).json({error:"User already exists"});
        }
        else{
            await pool.query("insert into users (name, email, password) values (?,?,?)",[name,email,password]);
            res.json({message:"User registered Successfully"});
        }
    }
    catch(err)
    {
        res.status(500).json({message:"database error while registering user."});
    }
});
// also accessed using postman


const PORT = process.env.PORT || 5000; //isse server actually start hoga. agar .env me port hai to udhar, ya to 5000 me host hoga.
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));





