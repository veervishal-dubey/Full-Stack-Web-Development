const express=require('express');
const pool=require('./database');
require('dotenv').config();

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

app.get('/recomended/:volume',async function(req,res){
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



const PORT = process.env.PORT || 5000; //isse server actually start hoga. agar .env me port hai to udhar, ya to 5000 me host hoga.
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));





