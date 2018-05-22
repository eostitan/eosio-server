var express = require("express");
var bodyParser = require('body-parser');
var path = require("path");
var fs = require("fs");
var eos = require("eosjs-ecc");
var cjson = require("canonicaljson");

var serverConfig;

if (fs.existsSync("./config/server.json")) serverConfig = require("./config/server.json");
if (!fs.existsSync("./config/networks.json")) fs.writeFileSync("./config/networks.json", JSON.stringify([]));

var config = require("./config/networks.json");
var masterBoot = require("./config/boot.json");

function server(){

	var app = express();

	app.use(bodyParser.json({ type: 'application/json' }))

	var port = 3000;

	var getBoot = function(tag){

		let boot = masterBoot.find(function(b){return b.tag == tag});

		if (boot){
			return boot;
		}
		else return {};

	}

	var extendNetwork = function(network, addContent){

		let newNetwork = JSON.parse(JSON.stringify(network));

		if (addContent == true){

			let genesis_file = path.join(process.cwd(), "files", "genesis", network.genesis);
			let peers_file = path.join(process.cwd(), "files", "peers", network.peers);
			let boot_file = path.join(process.cwd(), "files", "boot", network.boot);

			newNetwork.genesis = JSON.parse(fs.readFileSync(genesis_file, "utf8"));
			newNetwork.peers = JSON.parse(fs.readFileSync(peers_file, "utf8"));
			newNetwork.boot = JSON.parse(fs.readFileSync(boot_file, "utf8"));

			console.log("newNetwork", newNetwork);

		}
		else {
			delete newNetwork.genesis;
			delete newNetwork.peers;
			delete newNetwork.boot;
		}

		return newNetwork;

	}

	var authenticate = function(req){

		if (!req.body.signature) {console.log("Signature not provided."); return false};

		let message = req.body;
		let signature = req.body.signature;

		delete message.signature;

		try{

			let verification = eos.verify(signature, cjson.stringify(message), serverConfig.public_key);

			console.log("message:", message);
			console.log("signature:", signature);
			console.log("serverConfig.public_key:", serverConfig.public_key);
			console.log("verification:", verification);

			return verification;

		}
		catch (ex){
			return false;
		}

	}

	app.get('/networks/:network', function(req, res) {

		let found = config.find(function(n){return n.name == req.params.network});

		if (found){
			
			console.log("NETWORK:", found);

			return res.json({network:extendNetwork(found, true)});
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
		let peers_file = path.join(process.cwd(), "files", "peers", network.peers);
		let peers = JSON.parse(fs.readFileSync(peers_file, "utf8"));

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
		let peers_file = path.join(process.cwd(), "files", "peers", network.peers);
		let peers = JSON.parse(fs.readFileSync(peers_file, "utf8"));

		if (!peers.find(function(p){return p == req.body.peer})) return res.json({error: "peer not found"});

		console.log("PEERS BEFORE:", peers);

		let newPeers = peers.filter(function(p){return p != req.body.peer});
		
		console.log("PEERS AFTER:", newPeers);

		fs.writeFileSync(peers_file, JSON.stringify(newPeers, null, 2));

		return res.json({result: "success"});

	});

	app.post("/addnetwork", function(req, res){

		if (!authenticate(req)) return res.json({error: "unauthorized, must supply valid signature"});

		if (!req.body.network_name) return res.json({error: "must supply post parameter network_name"});
		if (!req.body.tag) return res.json({error: "must supply post parameter tag"});
		if (!req.body.genesis) return res.json({error: "must supply post parameter genesis"});

		if (config.find(function(n){return n.name == req.body.network_name})) return res.json({error: "network already exists"});

		let peers_file = path.join(process.cwd(), "files", "peers", req.body.network_name + ".json");
		let genesis_file = path.join(process.cwd(), "files", "genesis", req.body.network_name + ".json");
		let boot_file = path.join(process.cwd(), "files", "boot", req.body.network_name + ".json");

		fs.writeFileSync(peers_file, JSON.stringify([], null, 2));
		fs.writeFileSync(genesis_file, JSON.stringify(req.body.genesis, null, 2));
		fs.writeFileSync(boot_file, JSON.stringify(getBoot(req.body.tag), null, 2));

		var configEntry = {
			"name":req.body.network_name,
			"genesis":req.body.network_name + ".json",
			"peers":req.body.network_name + ".json",
			"boot":req.body.network_name + ".json",
			"tag": req.body.tag
		}

		config.push(configEntry);

		fs.writeFileSync(path.join(process.cwd(), "config", "networks.json"), JSON.stringify(config, null, 2 ));

		return res.json({result: "success"});

	});

	app.post("/removenetwork", function(req, res){

		if (!authenticate(req)) return res.json({error: "unauthorized, must supply valid signature"});

		if (!req.body.network_name) return res.json({error: "must supply post parameter network_name"});

		let found = config.find(function(n){return n.name == req.body.network_name});

		console.log("Found", found);

		if (!found) return res.json({error: "network not found"});

		config = config.filter(function(n){return n.name != req.body.network_name});

		fs.writeFileSync(path.join(process.cwd(), "config", "networks.json"), JSON.stringify(config, null, 2 ));
		fs.unlinkSync(path.join(process.cwd(), "files", "genesis", found.genesis));
		fs.unlinkSync(path.join(process.cwd(), "files", "peers", found.peers));
		fs.unlinkSync(path.join(process.cwd(), "files", "boot", found.boot));


		return res.json({result: "success"});

	});

	app.post("/verify", function(req, res){

		if (!req.body.public_key) return res.json({error: "must supply post parameter public_key"});
		if (!req.body.message) return res.json({error: "must supply post parameter message"});
		if (!req.body.signature) return res.json({error: "must supply post parameter signature"});

		let verification = eos.verify(req.body.signature, cjson.stringify(req.body.message), eos.PublicKey.fromString(req.body.public_key));

		console.log("req.body.public_key", req.body.public_key);
		console.log("req.body.message", req.body.message);
		console.log("req.body.signature", req.body.signature);
		console.log("verification", verification);

		if (verification) return res.json({result: "success"});
		else return res.json({error: "invalid signature"});

	});

	app.listen(port, function(){
		console.log("Server started on port", port);
	});

}

if (serverConfig) server();
else console.log("No server configuration. Please create /config/server.json to enable");
