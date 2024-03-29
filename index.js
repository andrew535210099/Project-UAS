const express = require("express");
var fs = require('fs');
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require('ejs');
const joi = require('joi');
const path = require('path'); 
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");
var imgModel = require('./models/models');
var videoModel = require('./models/models2');
const multer = require('multer');
var datetime = new Date();
const JWT_SECRET ="hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe";

app.use(bodyParser.urlencoded({extended: true}));

var day = ("0" + datetime.getDate()).slice(-2);
var month = ("0" + (datetime.getMonth() + 1)).slice(-2);
var year = datetime.getFullYear();

var hours = datetime.getHours();
var minutes = datetime.getMinutes();
var seconds = datetime.getSeconds();

var dateTime = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;

mongoose.connect("mongodb+srv://Andrew:Mynameacp@cluster0.sqblysk.mongodb.net/TugasProject", {useNewUrlParser: true}, {useUnifiedTopology: true});

// create a data schema
const notesSchema = new mongoose.Schema({
    username: {type: String, unique: true},
    email: {type: String, unique: true},
    password: String, 
},
{
    collection: "UserInfo",
}
)

const post = new mongoose.Schema({
    post: String,
    date: {
    type: Date,
    default: new Date()}
},
{
    collection1: "UserPost",
}
)

mongoose.model("UserInfo", notesSchema);
mongoose.model("UserPost", post);

const Note = mongoose.model("UserInfo");
const History = mongoose.model("UserPost");

const db = mongoose.connection;
db.once('open', () => {
    console.log('Connected to Mongoose server!');
    console.log('Server starts at ' , dateTime);
});

// app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')));

// app.get('/', (req, res) => {
//     res.send('Hello, world!');
//   });

// app.get("/", function(req, res) {
//     return res.render('pages/login');
// })


app.get('/', async (req, res) => {
    try {
      const filePath = path.join(__dirname, 'views', 'pages', 'login.ejs');
      const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
  

app.post("/", async function(req, res) {
    const { email, password } = req.body;
    const user = await Note.findOne({ email });
    if (!user) {
        res.redirect('/');
        return console.log('User not found');
    }
    if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ email: user.email }, JWT_SECRET);
        if (res.status(201)) {
            res.redirect('/index');
            console.log( user.email + 'login at' + dateTime)
            return console.log('Welcome back', email)
        } else {
            return res.json({ error: "error" });
        }
    }
    console.log('Invalid Password')
    res.redirect('/');
})

app.get("/forgotpass", function(req, res) {
    return res.render('pages/forgotpass');
})

app.post("/forgotpass", async (req, res) => {
    const { email } = req.body;
    try {
        const oldUser = await Note.findOne({ email });
        if (!oldUser) {
            res.redirect('/forgotpass');
            console.log(email +'not exists');
        }
    const secret = JWT_SECRET + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, password: oldUser.password }, secret, {
        expiresIn: "5m",
    });
    const link = `http://localhost:8000/forgotpass/${oldUser.password}/${token}`;
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            type: "OAuth2",
            user: "andrew.535210099@stu.untar.ac.id",
            serviceClient: nodeMailerClientId,
            privateKey: nodeMailerPrivateKey,
        },
    });
    var mailOptions = {
        from: "andrew.535210099@stu.untar.ac.id",
        to: "andrew.535210099@stu.untar.ac.id",
        subject: "Password Reset",
        text: link,
    };
    
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
    console.log(link);
    } catch (error) {}
});

app.get("/forgotpass/:password/:token", async (req, res) => {
    const { password, token } = req.params;
    console.log(req.params);
    const oldUser = await Note.findOne({ password });
    if (!oldUser) {
        return res.json({ status: "User Not Exists!!" });
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        res.render("index", { email: verify.email, status: "Not Verified" });
    } catch (error) {
        console.log(error);
        res.send("Not Verified");
    }
});

app.post("/forgotpass/:password/:token", async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;
    const oldUser = await Noye.findOne({ password });
    if (!oldUser) {
        return res.json({ status: "User Not Exists!!" });
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        const encryptedPassword = await bcrypt.hash(password, 10);
        await User.updateOne(
        {
            password: password,
        },
        {
            $set: {
            password: encryptedPassword,
        },
        }
        );
        res.render("index", { email: verify.email, status: "verified" });
    } catch (error) {
        console.log(error);
        res.json({ status: "Something Went Wrong" });
    }
});

app.get('/index', async (req, res) => {
    try {
      const filePath = path.join(__dirname, 'views', 'pages', 'index.ejs');
      const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

app.post("/index", async function(req, res) {
    const { title } = req.body;
    if(!title) {
        res.redirect('/index')
        return console.log('Status is missing')
    }
    else {
    try{
        await History.create({
        post: title
    });
    res.redirect('/index')
    console.log('Your status has been uploaded');
    }catch (error) {
        console.log(err);
} }
})


app.get('/explore', async (req, res) => {
    try {
      const filePath = path.join(__dirname, 'views', 'pages', 'explore.ejs');
      const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

app.get('/signup', async (req, res) => {
    try {
      const filePath = path.join(__dirname, 'views', 'pages', 'signup.ejs');
      const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

app.post("/signup", async function(req, res) {
    const { email, password, confirm_password, username } = req.body;
    const encryptedPassword = await bcrypt.hash(password, 10);
    if(username === "" && !username) {
        return console.log('Username has not been filled')
    }
    if(email === "" && !email) {
        return console.log('Email has not been filled')
    }
    if (password === "" && !password) {
        return console.log('Password has not been filled')
    } else if (confirm_password === "" && !confirm_password ){
        return console.log('Confirm Password has not been filled')
    }
    else {
    if(password == confirm_password){
    try {
        const oldUser = await Note.findOne({ email });
        const oldUsername = await Note.findOne({ username });
        if (oldUser) {
            res.redirect('/signup');
            return console.log('Sorry, this ' + req.body.email + ' has been exists');
        }
        if (oldUsername) {
            res.redirect('/signup');
            return console.log('Sorry, this ' + username + ' has been exists');
        }
        await Note.create({
            username,
            email,
            password: encryptedPassword,
    }
    );
    res.redirect('/')
    console.log('Email ' + email + ' has been successfully made ')
    console.log(username + ' has been successfully made');
} catch (error) {
    res.send({ status: "error" });
}
} 
else {
    console.log('Wrong password');
    res.redirect('/signup');
}}
})

app.get('/shop', async (req, res) => {
    try {
      const filePath = path.join(__dirname, 'views', 'pages', 'shop.ejs');
      const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });


app.get('/service', async (req, res) => {
    try {
      const filePath = path.join(__dirname, 'views', 'pages', 'service.ejs');
      const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

app.get("/history", function(req, res) {
    return res.render('pages/history');
})

app.get('/history', async (req, res) => {
    try {
      const filePath = path.join(__dirname, 'views', 'pages', 'history.ejs');
      const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });


app.get('/peter', async (req, res) => {
    try {
      const filePath = path.join(__dirname, 'views', 'pages', 'peter.ejs');
      const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

app.get('/andrew', async (req, res) => {
    try {
      const filePath = path.join(__dirname, 'views', 'pages', 'andrew.ejs');
      const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

app.get('/explore', async (req, res) => {
    try {
      const filePath = path.join(__dirname, 'views', 'pages', 'explore.ejs');
      const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

var storage1 = multer.diskStorage({ 
    destination: (req, file, cb) => { 
        cb(null, 'uploads') 
    }, 
    filename: (req, file, cb) => { 
        cb(null, file.fieldname) 
    } 
}); 

var storage2 = multer.diskStorage({ 
    destination: (req, file, cb) => { 
        cb(null, 'uploads') 
    }, 
    filename: (req, file, cb) => { 
        cb(null, file.fieldname) 
    } 
}); 

var upload = multer({ storage: storage1 });
var uploadvideo = multer({ storage: storage2 });

app.get('/upload', async (req, res) => { 
    imgModel.find({}, async (err, items) => { 
        if (err) { 
            console.log(err); 
            res.status(500).send('File cannot be uploaded', err); 
        } 
        else {
            const filePath = path.join(__dirname, 'views', 'pages', 'upload.ejs');
            const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
            res.send(html);
        } 
    }); 
});



app.post('/upload', upload.single('image'), (req, res, next) => {
    var obj = {
        name: req.body.name,
        desc: req.body.desc,
        img: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: 'image/png/video/mp4'
        }
    }
    imgModel.create(obj, (err, item) => {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect('/upload');
        }
    });
}); 

app.get('/andri', async (req, res) => {
    try {
      const filePath = path.join(__dirname, 'views', 'pages', 'andri.ejs');
      const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });


app.get('/ardan', async (req, res) => {
    try {
      const filePath = path.join(__dirname, 'views', 'pages', 'ardan.ejs');
      const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });


app.get('/profile1', async (req, res) => {
    try {
      const filePath = path.join(__dirname, 'views', 'pages', 'profile1.ejs');
      const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

app.get('/uploadvideo', (req, res) => { 
    videoModel.find({}, async (err, items) => { 
        if (err) { 
            console.log(err); 
            res.status(500).send('An error occurred', err); 
        } 
        else {
            const filePath = path.join(__dirname, 'views', 'pages', 'profile1.ejs');
         const html = await ejs.renderFile(filePath, { /* data to pass to the EJS template */ });
            res.send(html);
        } 
    }); 
});

app.post('/uploadvideo', uploadvideo.single('video'), (req, res, next) => {
    var obj = {
        name: req.body.name,
        desc: req.body.desc,
        img: {
            data: fs.readFileSync(path.join(__dirname + '/uploadvideo/' + req.file.filename)),
            contentType: 'mp4,video'
        }
    }
    videoModel.create(obj, (err, item) => {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect('/uploadvideo');
        }
    }); 
});