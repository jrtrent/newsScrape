var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var request =require("request");


var axios = require("axios");
var cheerio = require("cheerio");


var db = require("./models");

var PORT = 3000;


var app = express();

app.use(logger("dev"));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));
mongoose.connect("mongodb://localhost/newsScrape");



app.get("/scrape", function (req, res) {
    request("https://www.npr.org/sections/news", function (error, response, html) {
        var $ = cheerio.load(html);
        var result =[];
        $("article.item.has-image").each(function (i, element) {
            var title = $(element).find("h2").text();
            var link = $(element).find("a").attr("href");
            var summary = $(element).find("p.teaser").text();

            result.push({
                title: title,
                link: link,
                summary: summary
                
            });
        });

        db.Article.create(result)
            .then(function (dbArticle) {
                console.log(dbArticle);
            })
            .catch(function (err) {
                return res.json(err);
            });
        console.log(result);
    });

    res.send("Scrape complete");


});
//Get all articles from the db
app.get("/articles", function (req, res) {

    db.Article.find({})
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

//Route to grabbing a Article and populate with its note
app.get("/articles/:id", function (req, res) {
    db.Article.findOne({ _id: req.params.id })
        .populate("#note")
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

//Route to save and update an Articles associated Note breakdown this object creation network tab 
app.post("/articles/:id", function (req, res) {

    db.Note.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});


app.listen(PORT, function () {
    console.log("App running on port " + PORT);
});
