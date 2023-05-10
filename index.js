const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const salt = bcrypt.genSaltSync(10);
const jwt = require("jsonwebtoken");
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const cookieParser = require('cookie-parser');
const fs = require('fs');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(__dirname + '/uploads'));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'wave'
});

db.connect((err)=>{
    if(err){
        console.log("Database connection failed.."+err);
    }
    else{
        console.log("Database connected successfully.......");
    }
});

// app.post("/register", uploadMiddleware.single('profile_image_address'), (req, res) => {
//     const k = "SELECT * FROM users WHERE username=?";
//     db.query(k, [req.body.username], (err, result) => {
//         if (err) {
//             return res.send(err);
//         }
//         if (result.length > 0) {
//             return res.status(409).send("Username already registered");
//         }
//         const q = "INSERT INTO users(`first_name`,`last_name`,`email`,`username`,`password_hash`,`date_of_birth`,`gender`,`city`,`profile_image_address`,`mobile`) VALUES(?)";
//         bcrypt.hash(req.body.password_hash, salt, (err, hash) => {
//             if (err) {
//                 return res.send(err);
//             }
//             if (!req.file) {
//                 return res.status(400).send("No image uploaded");
//             }
//             const originalname = req.file.originalname;
//             const parts = originalname.split('.');
//             const ext = parts[parts.length - 1];
//             const profile_image_address = req.file.filename + '.' + ext;
//             const values = [
//                 req.body.first_name,
//                 req.body.last_name,
//                 req.body.email,
//                 req.body.username,
//                 hash,
//                 req.body.date_of_birth,
//                 req.body.gender,
//                 req.body.city,
//                 profile_image_address,
//                 req.body.mobile
//             ];
//             db.query(q, [values], (err, data) => {
//                 if (err) {
//                     return res.send(err);
//                 }
//                 console.log("Image uploaded to: " + req.file.path);
//                 return res.json(data);
//             });
//         });
//     });
// });

app.post("/register",(req,res)=>{
    const q = "SELECT COUNT(*) AS count FROM users2 WHERE username = ?";
    db.query(q, [req.body.username], (err, result) => {
        if (err) {
            return res.send(err);
        }
        if (result[0].count > 0) {
            return res.status(409).send("Username already registered");
        }
        const q = "INSERT INTO users2(`first_name`,`last_name`,`email`,`username`,`mobile`,`password_hash`,`date_of_birth`,`gender`,`city`) values(?)";
        const values = [        
            req.body.first_name,
            req.body.last_name,        
            req.body.email,        
            req.body.username,        
            req.body.mobile,        
            req.body.password_hash,        
            req.body.date_of_birth,        
            req.body.gender,        
            req.body.city    
        ];
        db.query(q,[values],(err,data)=>{
            if(err) return res.send(err);
            return res.json(data);
        });
    });
});
app.post("/login",(req,res)=>{
    const q = "select * from users2 where username = ? && password_hash = ?";
    const values = [
        req.body.username,
        req.body.password
    ];
    db.query(q,values,(err,data)=>{
        if(err) return res.send(err);
        if(data.length > 0){
            res.send(data);
        }else{
            res.send("credentials does not match");
        }
    });
});
app.get('/userprofile/:id',(req,res)=>{
    const q = "select * from users where user_id ="+req.params.id+";";
    db.query(q,(err,data)=>{
        if(err) return res.send(err);
        return res.json(data);
    });
});
app.listen(8080, () => {
    console.log("Connected to backend listen:8080");
});

