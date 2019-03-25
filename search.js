const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs')
const request = require('request');
const dataBase = require('./db');
const mongoose = require('mongoose');
const GoogleImages = require('google-images');
const Jimp = require('jimp');
const Schema = mongoose.Schema;

mongoose.connect(dataBase.path);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/downloaded_images'));
app.use(bodyParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var arr_source = [];
var searchKeyword;
var flag;
var searchkeywordFlag = "";
var searchData = {};
var searchSchema = new Schema({
    searchKeyword: {type: String, unique: true}
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/search.html');
});

app.post('/showHistory', (req, res) => {
    var hisKeyword = req.body.hisKeyword;
    var historyGreyScaleImg = [];
    var counter = 0;
    for (var i = 0; i < 10; i++) {
        counter++;
        historyGreyScaleImg.push("/grey_" + hisKeyword + counter + ".jpeg")
    }
    res.render('showHistory', {source: historyGreyScaleImg});
});

app.post('/search', (req, res) => {
    searchKeyword = req.body.search;
    const client = new GoogleImages('CSE ID', 'API KEY');
    var dataTable = mongoose.model('searchdatas', searchSchema);
    module.exports = dataTable;
    async function four() {
        await dataTable.findOne({searchKeyword: searchKeyword}, function (err, data) {
            if (err) {
                console.log(err);
                return
            }
            flag = data;
            if (flag !== null) {
                searchkeywordFlag = flag.searchKeyword;
            }
        });

        history_arr = [];
        if (searchkeywordFlag == searchKeyword) {
            three();
        } else {
            one().then(() => two());
        }

    }
    var f = four();
    async function three() {
        var dataTableAll = mongoose.model('searchdatas', searchSchema);
        await dataTableAll.find(function (err, data) {
            if (err) {
                console.log(err);
                return
            }
            historyData = data;
        });
        res.render('history', {historyKeyword: historyData});
    }

    async function one() {
        await client.search(searchKeyword, {fileType: 'jpeg'})
            .then(images => {
                // img = images
                var len = images.length;
                var jsonObj = JSON.parse(JSON.stringify(images));
                var counter = 0;
                for (var i = 0; i < images.length; i++) {
                    var image = images[i];
                    counter++;
                    var img_type = image.type;
                    img_type = img_type.substring(6);
                    var img_file_path = searchKeyword + counter + '.' + img_type;
                    arr_source.push(image.url);
                }
            });
    }

    function two() {
        new Promise(resolve => {
            res.render('search', {source: arr_source});
            //download_arr_source = arr_source;
            arr_source = [];
            resolve();
        });
    }
});


app.post('/saveImage', (req, res) => {
    var counter = 0;
    var download_arr_source = [];
    var download = function (uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            Jimp.read(uri)
                .then(image => {
                    // Do stuff with the image.
                    image.resize(250, 250) // resize
                        .quality(50) // set JPEG quality
                        .greyscale() // set greyscale
                        .write('./downloaded_images/' + 'grey_' + filename); // save
                })
                .catch(err => {
                    // Handle an exception.
                    console.log(err);
                });
            request(uri).pipe(fs.createWriteStream("./downloaded_images/" + filename)).on('close', callback);
        });
    };

    download_arr_source = req.body.imgSrc;
    for (var i = 0; i < download_arr_source.length; i++) {
        var image = download_arr_source[i];
        counter++;
        download(download_arr_source[i], searchKeyword + counter + '.jpeg', function () {
            download_arr_source.pop();
        });
    }
    searchData = {"searchKeyword": searchKeyword};
    var data = mongoose.model('searchData', searchSchema);
    data.insertMany(searchData);
    res.end('Images downloaded Successfully Enjoy!');
});

app.listen(8090);