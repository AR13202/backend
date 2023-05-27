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
const path = require('path');
const app = express();
app.use(cors({credentials:true,origin:3000}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
const secret_key = 'alfjaoiie19834ljwdq32';
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

app.post("/register", uploadMiddleware.single('imageFile'), (req, res) => {
    const k = "SELECT COUNT(*) AS count FROM users WHERE username = ?";
    db.query(k, [req.body.username], async (err, result) => {
        if (err) {
            return res.send(err);
        }
        if (result[0].count > 0) {
            return res.status(409).send("Username already registered");
        }
        if (!req.file.mimetype.startsWith('image')) {
            return res.status(422).send("Invalid image format. Only image files are allowed.");
        }
        const {originalname,path} = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        const newPath = path+'.'+ext;
        fs.renameSync(path, newPath);
        const password_hash = await bcrypt.hash(req.body.password_hash, salt);
        console.log(newPath);
        const q = "INSERT INTO users(`first_name`,`last_name`,`email`,`username`,`password_hash`,`date_of_birth`,`gender`,`city`,`profile_image_address`,`mobile`) VALUES(?)";
        const values = [
            req.body.first_name,
            req.body.last_name,
            req.body.email,
            req.body.username,
            password_hash,
            req.body.date_of_birth,
            req.body.gender,
            req.body.city,
            newPath,
            req.body.mobile
        ];
        db.query(q, [values], (err, data) => {
            if (err) {
                return res.send(err);
            }
            // console.log("Image uploaded to: " + req.file.path);
            return res.json(data);
        });
    });
});
app.post('/login', (req,res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            res.status(500).send('Internal server error');
            return;
        }
        if (results.length === 0) {
            res.status(400).json('User not found');
            return;
        }
        const user = results[0];
        bcrypt.compare(password, user.password_hash, (err, result) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                res.status(500).send('Internal server error');
                return;
            }
            if (result) {
                const token = jwt.sign({ id:user.id }, secret_key, {expiresIn: '1h'});
                res.cookie('token', token, { maxAge: 6000000, httpOnly: true });
                //console.log(res.cookie);
                res.json(token);
            } else {
                res.status(400).json('Wrong password');
            }
        });
    });
});
app.put('/updateprofile/:id',uploadMiddleware.single('imageFile'),(req,res)=>{
    const {originalname,path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path+'.'+ext;
    fs.renameSync(path, newPath);
    const id = req.params.id;
    const q = "UPDATE users SET `first_name`= ?,`last_name` = ?,`email` = ?, `date_of_birth` = ?,`city`= ?, `profile_image_address`= ? , `mobile`= ? WHERE id ="+id+";";
    const values = [
        req.body.first_name,
        req.body.last_name,
        req.body.email,
        req.body.date_of_birth,
        req.body.city,
        newPath,
        req.body.mobile
    ];
    db.query(q, [...values], (err, data) => {
        if (err) {
            return res.send(err);
        }
        // console.log("Image uploaded to: " + req.file.path);
        return res.json(data);
    });
});
app.get('/dashboard', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const decodedToken = jwt.verify(token, secret_key);
            const id = decodedToken.id;
            const q = 'select * from users where id = ?;';
            db.query(q,id,(err,data)=>{
                if(err) return err;
                return res.json(data);
            })
        } catch (error) {
            res.status(403).json({ message: 'Invalid or expired token' });
        }
    } else {
        res.status(401).json({ message: 'Missing authorization header' });
    }
});

app.get('/todos/:id',(req,res)=>{
    const q = 'select * from todos where user_id = ? ;';
    const id = req.params.id;
    db.query(q,id,(err,data)=>{
        if(err) return err;
        return res.json(data);
    });
});
app.post('/todos',(req,res)=>{
    const q = 'insert into todos(todo, user_id) values (?);';
    const values = [
        req.body.todo,
        req.body.id
    ];
    db.query(q,[values],(err,data)=>{
        if(err) return err;
        return res.json(data);
    });
});
app.delete('/todos/:id',(req,res)=>{
    const q = 'delete from todos where todo_id=?;';
    const id = req.params.id;
    db.query(q,id,(err,data)=>{
        if(err) return err;
        return res.json(data);
    });
});
app.get('/events/:id',(req,res)=>{
    const q = 'select * from events where user_id = ?;';
    const id = req.params.id;
    db.query(q,id,(err,data)=>{
        if(err) return err;
        return res.json(data);
    });
});
app.post('/events',(req,res)=>{
    const q = 'insert into events(event_head,event_desc,event_date,user_id) values(?);';
    const values = [
        req.body.event_head,
        req.body.event_desc,
        req.body.event_date,
        req.body.id
    ];
    db.query(q,[values],(err,data)=>{
        if(err) return err;
        return res.json(data);
    })
});
app.delete('/events/:id',(req,res)=>{
    const q = 'delete from events where id = ?;';
    const id = req.params.id;
    db.query(q,id,(err,data)=>{
        if(err) return err;
        return res.json(data);
    });
});
app.get('/upcomingevents/:id',(req,res)=>{
    const q = 'SELECT * FROM events WHERE event_date >= CURDATE() && user_id = '+req.params.id+' ORDER BY event_date ASC LIMIT 3;';
    db.query(q,(err,data)=>{
        if(err) return err;
        return res.json(data);
    });
});
app.get('/todaytodos/:id',(req,res)=>{
    const q = 'SELECT * FROM todos WHERE user_id = '+req.params.id+' ORDER BY todo_id ASC LIMIT 4;';
    db.query(q,(err,data)=>{
        if(err) return err;
        return res.json(data);
    });
});
app.post('/meetings',(req,res)=>{
    const q = 'INSERT INTO meetings (user_id,name) VALUES (?);';
    const values = [
        req.body.id, 
        req.body.name
    ];
    db.query(q,[values],(err,data)=>{
        if(err) return err;
        return res.json(data);
    })
});
app.get('/meetings/:id',(req,res)=>{
    const q = 'SELECT * FROM meetings WHERE user_id = (?) ORDER BY meeting_time DESC LIMIT 3;';
    const id = req.params.id;
    db.query(q,id,(err,data)=>{
        if(err) return err;
        return res.json(data);
    });
});
app.listen(8080, () => {
    console.log("Connected to backend listen:8080");
});

