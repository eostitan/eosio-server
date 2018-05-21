var express = require("express");
var bodyParser = require('body-parser');
var config = require("./config/networks.json");

var app = express();

app.use(bodyParser.json({ type: 'application/json' }))

var port = 3000;

app.get('/:network', function(req, res) {

	//if (!req.body || !req.body.network_name) return res.json({error: "must supply post parameter network_name"});
	
	let found = config.find(function(n){return n.name == req.params.network});

	if (found){

		let network = JSON.parse(JSON.stringify(found));

		let genesis_file = "./files/" + network.genesis;

		network.genesis_content = require(genesis_file);

		res.json({network:network});

	}
	else return res.json({error:"network not found"});

});

app.listen(port, function(){
	console.log("Server started on port", port);
});