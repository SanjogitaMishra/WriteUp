const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const app = express();
const port = 8000;
const publicpath = path.join(__dirname, "../public");
const { check, validationResult } = require('express-validator');
require("./conn.js");

app.set('view engine', 'hbs');
mongoose.set('useFindAndModify', false);
//public static path
app.use(express.static(publicpath));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//deining schema of the database
const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        unique: true,
        required: 'This field is required.'
    },
    category: {
        type: String,
        required: 'This field is required.'
    },
    content: {
        type: String,
        required: 'This field is required.'
    }
})

//collection creation
const Blogs = new mongoose.model("Blogs", blogSchema);

//method to handle the exceptions in the form
function handleValidationError(err, body) {
    for (field in err.errors) {
        switch (err.errors[field].path) {
            case 'title':
                body['titleError'] = err.errors[field].message;
                break;
            case 'category':
                body['categoryError'] = err.errors[field].message;
                break;
            case 'content':
                body['contentError'] = err.errors[field].message;
                break;
            default:
                break;
        }
    }
}

//function to retrive data from database
async function getData(req, res) {
    const read = await Blogs.find({}, function (err, doc) {
        res.render('index.hbs', {
            bloglist: doc
        });
    });
}

//routing
app.get("/index", (req, res) => {
    getData(req, res);
});

app.get("/create", (req, res) => {
    res.render('create.hbs');
});

//create new blog in database
app.post("/create", async (req, res) => {
    if (req.body._id == '') {
        try {
            const blogadd = new Blogs({
                title: req.body.title,
                category: req.body.category,
                content: req.body.content
            })
            const result = await blogadd.save((err, doc) => {
                if (!err) {
                    res.status(201).redirect("/index");
                }
                else if(err){
                    res.render("create",err);
                    
                }
                else {
                    //for validations in the form
                    if (err.name === 'ValidationError') {
                        handleValidationError(err, req.body);
                        res.render("create", {
                            blogs: req.body
                        });
                    }
                    else
                        console.log('Error during record insertion : ' + err);
                }
            });

        } catch (error) {
            res.status(400).send(error);
        }
    }
    else {
        editData(req, res);
    }

});

//method to return the details of a particular blog
app.get('/:id', (req, res) => {
    Blogs.findById(req.params.id, (err, doc) => {
        res.render("details", {
            blogs: doc
        });
    });
});

app.get('/edit/:id', (req, res) => {
    Blogs.findById(req.params.id, (err, doc) => {
        res.render("create", {
            blogs: doc
        });
    });
});

//method to update a blog
async function editData(req, res) {
    const update = await Blogs.findOneAndUpdate({ _id: req.body._id }, req.body, { new: true }, (err, doc) => {
        res.redirect("/index");
    });
}

//method to delete a blog
app.get('/delete/:id', (req, res) => {
    Blogs.findByIdAndRemove(req.params.id, (err, doc) => {
        res.redirect('/index');
    });
});

app.get('*', (req, res) => {
    Blogs.findByIdAndRemove(req.params.id, (err, doc) => {
        res.redirect('/index');
    });
});
/*
//for 404 error page
app.get("*", (req, res) => {
    res.render('404error.hbs', {
        errorMsg: 'OOps! Page Not Found'
    });
});
*/


app.listen(port, () => {
    console.log(`listening to port number ${port}`);
});