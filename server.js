const express = require("express");
var fs = require('fs');
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require('ejs');
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
    console.log('Server start at ' , dateTime);
});

app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: true}))

app.listen(8000, function() {
    console.log("Server is running on port 8000");
})

app.get("/", function(req, res) {
    return res.render('pages/login');
})

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
            console.log( user + 'login at' + dateTime)
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


app.get("/index", function(req, res) {
    return res.render('pages/index');
})

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
    res.send({ status: "error" });
} }
})

app.get("/explore", function(req, res) {
    return res.render('pages/explore');
})

app.get("/signup", function(req, res) {
    return res.render('pages/signup');
})

app.post("/signup", async function(req, res) {
    const { email, password, confirm_password } = req.body;
    const encryptedPassword = await bcrypt.hash(password, 10);
    if(password == confirm_password){
    try {
        const oldUser = await Note.findOne({ email });
        if (oldUser) {
            res.redirect('/signup');
            return console.log('Sorry, this ' + req.body.email + ' has been exists');
        }
        await Note.create({
        email,
        password: encryptedPassword,
    }
    );
    res.redirect('/')
    console.log('Email ' + email + ' has been successfully made')
} catch (error) {
    res.send({ status: "error" });
}
} else {
    console.log('Wrong password');
    res.redirect('/signup');
}
})

app.get("/shop", function(req, res) {
    return res.render('pages/shop');
})

app.get("/service", function(req, res) {
    return res.render('pages/service');
})

app.get("/history", function(req, res) {
    return res.render('pages/history');
})

app.get("/peter", function(req, res) {
    return res.render('pages/peter');
})

app.get("/andrew", function(req, res) {
    return res.render('pages/andrew');
})

app.get("/explore", function(req, res) {
    return res.render('pages/explore');
})

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

app.get('/upload', (req, res) => { 
    imgModel.find({}, (err, items) => { 
        if (err) { 
            console.log(err); 
            res.status(500).send('An error occurred', err); 
        } 
        else {
            res.render('pages/upload', { items: items }); 
        } 
    }); 
});

app.post('/upload', upload.single('image'), (req, res, next) => {
    var obj = {
        name: req.body.name,
        desc: req.body.desc,
        img: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: 'image/png'
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

app.get("/andri", function(req, res) {
    return res.render('pages/profileandri');
})


app.get("/ardan", function(req, res) {
    return res.render('pages/profileardan');
})

app.get("/profile1", function(req, res) {
    return res.render('pages/profile1');
})

app.get('/uploadvideo', (req, res) => { 
    videoModel.find({}, (err, items) => { 
        if (err) { 
            console.log(err); 
            res.status(500).send('An error occurred', err); 
        } 
        else {
            res.render('pages/uploadvideo', { items: items }); 
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