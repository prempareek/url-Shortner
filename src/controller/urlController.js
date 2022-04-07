const validUrl = require('valid-url');
const shortid = require('shortid')
const urlModel = require('../models/urlModel')
const redis = require('redis');
const {promisify } = require("util");


//redis

const redisClient = redis.createClient({
    host: 'redis-15187.c264.ap-south-1-1.ec2.cloud.redislabs.com',
    port: 15187,
    password: 'GHyHMkrqxr5kGwPvjjcnXHfVnfu0se7Q'
})
redisClient.on("connect", async function () {
    console.log("Cache is Ready");
});


//redes for set and get
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);



//validation functions
const isValid = function (value) {
    if (typeof (value) === 'undefined' || typeof (value) === 'null') { return false }
    //if undefined or null occur rather than what we are expecting than this particular feild will be false.
    if (value.trim().length == 0) { return false }
    //if user give spaces not any string eg:- "  " =>here this value is empty, only space is there so after trim if it becomes empty than false will be given. 
    if (typeof (value) === 'string' && value.trim().length > 0) { return true }
    //to check only string is comming and after trim value should be their than only it will be true.
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}


const createurl = async function (req, res) {

    try {
        if (isValidRequestBody(req.query)) {
            res.status(400).send({ status: false, message: 'Invalid request . Please Dont write in query' })
            return
        }
        if (!isValidRequestBody(req.body)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide URL details' })
            return
        }
        if (!isValid(req.body.longUrl)) {
            return res.status(400).send({ status: false, message: ' Please provide LONG URL' })
        }

        const longUrl = req.body.longUrl.trim()

        if (!(validUrl.isUri(longUrl))) {
            return res.status(400).send({ status: false, msg: "longurl is not valid" })
        }

        const baseUrl = 'http://localhost:3000' //base Url

        //---GENERATE URLCODE
        let urlCode = shortid.generate().match(/[a-z\A-Z]/g).join("") //---this will give only Alphabet

        urlCode = urlCode.toLowerCase()  //lowercase 

        //---FETCH THE DATA IN REDIS

        let checkforUrl = await GET_ASYNC(`${longUrl}`)

        if (checkforUrl) {
            return res.status(200).send({ status: true, "data": JSON.parse(checkforUrl) })//---if already exist
        }

        //if data not found in caches find in MongoDb

        let url = await urlModel.findOne({ longUrl })

        if (url) {
            return res.status(200).send({ status: true, "data": url }) //---if already exist
        }
        //---GENERATE DATA BY LONG URL
        const shortUrl = baseUrl + '/' + urlCode
        const urlData = { urlCode, longUrl, shortUrl }//new url 

        const newurl = await urlModel.create(urlData);

        //only selected  in response    
        let longurl = newurl.longUrl
        let shorturl = newurl.shortUrl
        let urlcode = newurl.urlCode
        let data = ({ longurl, shorturl, urlcode })

        //---SET GENERATE DATA IN CACHE
        await SET_ASYNC(`${longUrl}`, JSON.stringify(newurl))

        return res.status(201).send({ status: true, msg: `URL created successfully`, data: data });


    } catch (err) {
        res.status(500).send({ msg: err.message })
    }
}

const geturl = async function (req, res) {
    try {
        const urlCode = req.params.urlCode.trim()
        if (!isValid(urlCode)) {
            res.status(400).send({ status: false, message: 'Please provide valid urlCode' })
        }

        let checkforUrl = await GET_ASYNC(`${urlCode}`)    //check in cache
        if (checkforUrl) {
            return res.redirect(302, JSON.parse(checkforUrl))
        }


        const url = await urlModel.findOne({ urlCode: urlCode })   //check in Db

        if (!url) {
            return res.status(404).send({ status: false, message: 'No URL Found' })
        }

        return res.status(302).redirect(url.longUrl)

    } catch (err) {

        res.status(500).send({ msg: err.message })
    }
}


















module.exports.createurl = createurl
module.exports.geturl = geturl