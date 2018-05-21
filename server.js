var express = require("express");
var bodyParser = require('body-parser');
var path = require("path");
var fs = require("fs");
var eos = require("eosjs-ecc");
var cjson = require("canonicaljson");

var currentDir = process.cwd();

var config = require("./config/networks.json");

var serverConfig;

if (fs.existsSync("./config/server.json")) serverConfig = require("./config/server.json");

function server(){

	var app = express();

	app.use(bodyParser.json({ type: 'application/json' }))

	var port = 3000;

	function extendNetwork(network, addContent = true){

		let newNetwork = JSON.parse(JSON.stringify(network));

		if (addContent){

			let genesis_file = path.join(currentDir, "files", "genesis", network.genesis);
			let peers_file = path.join(currentDir, "files", "peers", network.peers);

			newNetwork.genesis = require(genesis_file);
			newNetwork.peers = require(peers_file);

		}
		else {
			delete newNetwork.genesis;
			delete newNetwork.peers;
		}

		return newNetwork;	
	}

	function authenticate(req){

		if (!req.body.signature) {console.log("Signature not provided."); return false};

		let message = req.body;
		let signature = req.body.signature;

		delete message.signature;

		let verification = eos.verify(signature, cjson.stringify(message), serverConfig.public_key);

		console.log("message:", message);
		console.log("signature:", signature);
		console.log("serverConfig.public_key:", serverConfig.public_key);
		console.log("verification:", verification);

		return verification;

	}

	app.get('/networks/:network', function(req, res) {

		let found = config.find(function(n){return n.name == req.params.network});

		if (found){
			return res.json({network:extendNetwork(found)});
		}
		else return res.json({error:"network not found"});

	});

	app.get('/listnetworks', function(req, res) {

		return res.json({networks:config.map(function(n){return extendNetwork(n, false)})});

	});

	app.post("/addpeer", function(req, res){

		if (!authenticate(req)) return res.json({error: "unauthorized, must supply valid signature"});

		if (!req.body.peer) return res.json({error: "must supply post parameter peer"});
		if (!req.body.network_name) return res.json({error: "must supply post parameter network_name"});

		let network = config.find(function(n){return n.name == req.body.network_name});
		let peers_file = path.join(currentDir, "files", "peers", network.peers);
		let peers = require(peers_file) || [];

		console.log("peers", peers);

		if (peers.find(function(p){return p == req.body.peer})) return res.json({error: "peer already exists"});

		peers.push(req.body.peer);
		
		fs.writeFileSync(peers_file, JSON.stringify(peers, null, 2));

		return res.json({result: "success"});

	});

	app.post("/removepeer", function(req, res){

		if (!authenticate(req)) return res.json({error: "unauthorized, must supply valid signature"});

		if (!req.body.peer) return res.json({error: "must supply post parameter peer"});
		if (!req.body.network_name) return res.json({error: "must supply post parameter network_name"});

		let network = config.find(function(n){return n.name == req.body.network_name});
		let peers_file = path.join(currentDir, "files", "peers", network.peers);
		let peers = require(peers_file) || [];

		if (!peers.find(function(p){return p == req.body.peer})) return res.json({error: "peer not found"});

		peers = peers.filter(function(p){return p != req.body.peer});
		
		fs.writeFileSync(peers_file, JSON.stringify(peers, null, 2));

		return res.json({result: "success"});

	});

	app.post("/addnetwork", function(req, res){

		if (!authenticate(req)) return res.json({error: "unauthorized, must supply valid signature"});

		if (!req.body.network_name) return res.json({error: "must supply post parameter network_name"});
		if (!req.body.tag) return res.json({error: "must supply post parameter tag"});
		if (!req.body.genesis) return res.json({error: "must supply post parameter genesis"});

		if (config.find(function(n){return n.name == req.body.network_name})) return res.json({error: "network already exists"});

		let peers_file = path.join(currentDir, "files", "peers", req.body.network_name + ".json");
		let genesis_file = path.join(currentDir, "files", "genesis", req.body.network_name + ".json");

		fs.writeFileSync(peers_file, JSON.stringify([], null, 2));
		fs.writeFileSync(genesis_file, JSON.stringify(req.body.genesis, null, 2));

		var configEntry = {
			"name":req.body.network_name,
			"genesis":req.body.network_name + ".json",
			"peers":req.body.network_name + ".json",
			"tag": req.body.tag
		}

		config.push(configEntry);

		fs.writeFileSync(path.join(process.cwd(), "config", "networks.json"), JSON.stringify(config, null, 2 ));

		return res.json({result: "success"});

	});

	app.post("/removenetwork", function(req, res){

		if (!authenticate(req)) return res.json({error: "unauthorized, must supply valid signature"});

		if (!req.body.network_name) return res.json({error: "must supply post parameter network_name"});

		if (!config.find(function(n){return n.name == req.body.network_name})) return res.json({error: "network not found"});

		config = config.filter(function(n){return n.name != req.body.network_name});

		fs.writeFileSync(path.join(process.cwd(), "config", "networks.json"), JSON.stringify(config, null, 2 ));

		return res.json({result: "success"});

	});

	app.post("/verify", function(req, res){

		if (!req.body.public_key) return res.json({error: "must supply post parameter public_key"});
		if (!req.body.message) return res.json({error: "must supply post parameter message"});
		if (!req.body.signature) return res.json({error: "must supply post parameter signature"});

		let verification = eos.verify(req.body.signature, cjson.stringify(req.body.message), eos.PublicKey.fromString(req.body.public_key));

		if (verification) return res.json({result: "success"});
		else return res.json({error: "signature doesn't match"});

	});

	app.listen(port, function(){
		console.log("Server started on port", port);
	});

}

if (serverConfig) server();
else console.log("No server configuration. Please create /config/server.json to enable");
