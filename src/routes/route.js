const express = require('express');
const router = express.Router();
const urlController=require("../controller/urlController")






router.post("/urlShortner",urlController.createurl)
router.get("/:urlCode",urlController.geturl)










module.exports = router;