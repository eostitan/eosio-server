var express = require("express");
var bodyParser = require('body-parser');
var config = require("./config/networks.json");

var app = express();

app.use(bodyParser.json({ type: 'application/json' }))

var port = 3000;

app.post('/', function(req, res) {

	console.log("req", req.body);

	if (!req.body || !req.body.network_name) return res.json({error: "must supply post parameter network_name"});
	
	var network = config.find(function(n){return n.name = req.body.network_name});

	if (network){

		var genesis_file = "./files/" + network.genesis;

		console.log("genesis_file", genesis_file);

		network.genesis_content = require(genesis_file);

		console.log("network.genesis_content", network.genesis_content);
		
		res.json({network:network});

	}
	else return res.json({error:"network not found"});

});

app.listen(port, function(){
	console.log("Server started on port", port);
});