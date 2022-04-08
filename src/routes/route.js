const express = require('express');
const router = express.Router();
const urlController=require("../controller/urlController")






router.post("/url/Shorten",urlController.createurl)
router.get("/:urlCode",urlController.geturl)










module.exports = router;
