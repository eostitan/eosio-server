var express = require("express");
var bodyParser = require('body-parser');
var path = require("path");
var fs = require("fs");
var eos = require("eosjs-ecc");
var cjson = require("canonicaljson");
var { exec } = require("child_process");

var serverConfig;
var localConfig;

if (fs.existsSync("./config/server.json")==true) 
	serverConfig = require("./config/server.json");
else 
	serverConfig = {};

if (fs.existsSync("./config/local.json")==true) 
	localConfig = require("./config/local.json");
else 
	localConfig = {};

if (!fs.existsSync("./config/networks.json")) fs.writeFileSync("./config/networks.json", JSON.stringify([]));

var config = require("./config/networks.json");

var masterBoot = require("./config/boot.json");

function server(){

	var app = express();

	app.use(bodyParser.json({ type: 'application/json' }))

	var port = 9273;

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

			delete newNetwork.accounts;

			//console.log("newNetwork", newNetwork);

		}
		else {
			delete newNetwork.genesis;
			delete newNetwork.accounts;
			delete newNetwork.peers;
			delete newNetwork.boot;
		}

		return newNetwork;

	}

	var authenticate = function(req){

		if (!req.body.signature) {console.log("Signature not provided."); return false};
		if (!req.body.network_name) {console.log("Network name not provided."); return false};

		let message = req.body;
		let signature = req.body.signature;

		delete message.signature;

		try{

			let verification = eos.verify(signature, cjson.stringify(message), serverConfig[req.body.network_name]);

			console.log("message:", message);
			console.log("signature:", signature);
			console.log("serverConfig[req.body.network_name]:", serverConfig[req.body.network_name]);
			console.log("verification:", verification);

			return verification;

		}
		catch (ex){
			console.log("authenticated failed", ex);
			return false;
		}

	}

	app.get('/networks/:network', function(req, res) {
			
		console.log("received request for :", req.params.network);

		let found = config.find(function(n){return n.name == req.params.network});

		if (found){

			return res.json({network:extendNetwork(found, true)});
		}
		else return res.json({error:"network not found"});

	});

	app.get('/listnetworks', function(req, res) {

		console.log("received request for list networks");

		return res.json({networks:config.map(function(n){return extendNetwork(n, false)})});

	});

	app.post("/addpeer", function(req, res){

		console.log("addpeer req.body", req.body);

		if (!authenticate(req)) return res.json({error: "unauthorized, must supply valid signature"});

		if (!req.body.peer) return res.json({error: "must supply post parameter peer"});
		if (!req.body.network_name) return res.json({error: "must supply post parameter network_name"});

		let network = config.find(function(n){return n.name == req.body.network_name});
		let peers_file = path.join(process.cwd(), "files", "peers", network.peers);
		let peers = JSON.parse(fs.readFileSync(peers_file, "utf8"));

		//console.log("peers", peers);

		if (peers.find(function(p){return p == req.body.peer})) return res.json({error: "peer already exists"});

		peers.push(req.body.peer);
		
		fs.writeFileSync(peers_file, JSON.stringify(peers, null, 2));

		return res.json({result: "success"});

	});

	app.post("/registerAccount", function(req, res){

		console.log("registerAccount req.body", req.body);

		//if (!authenticate(req)) return res.json({error: "unauthorized, must supply valid signature"});

		if (!req.body.account_name) return res.json({error: "must supply post parameter account_name"});
		if (!req.body.public_key) return res.json({error: "must supply post parameter public_key"});
		if (!req.body.network_name) return res.json({error: "must supply post parameter network_name"});

		let network = config.find(function(n){return n.name == req.body.network_name});
		let accounts_file = path.join(process.cwd(), "files", "accounts", network.accounts);
		let accounts = JSON.parse(fs.readFileSync(accounts_file, "utf8"));

		//console.log("peers", peers);

		if (accounts.find(function(p){return p == req.body.name})) return res.json({error: "account already exists"});

		let account = {
			name:req.body.account_name,
			key:req.body.public_key,
			created:false
		}

		accounts.push(account);
		
		fs.writeFileSync(accounts_file, JSON.stringify(accounts, null, 2));

		return res.json({result: "success"});

	});


	app.post("/removepeer", function(req, res){

		console.log("removepeer req.body", req.body);

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

		console.log("addnetwork req.body", req.body);

		//if (!authenticate(req)) return res.json({error: "unauthorized, must supply valid signature"});

		if (!req.body.network_name) return res.json({error: "must supply post parameter network_name"});
		if (!req.body.initial_key) return res.json({error: "must supply post parameter initial_key"});
		if (!req.body.tag) return res.json({error: "must supply post parameter tag"});
		if (!req.body.genesis) return res.json({error: "must supply post parameter genesis"});

		if (config.find(function(n){return n.name == req.body.network_name})) return res.json({error: "network already exists"});

		serverConfig[req.body.network_name] = req.body.initial_key;
		
		let peers_file = path.join(process.cwd(), "files", "peers", req.body.network_name + ".json");
		let genesis_file = path.join(process.cwd(), "files", "genesis", req.body.network_name + ".json");
		let boot_file = path.join(process.cwd(), "files", "boot", req.body.network_name + ".json");
		let accounts_file = path.join(process.cwd(), "files", "accounts", req.body.network_name + ".json");
		let config_file = path.join(process.cwd(), "config", "server.json");

		fs.writeFileSync(peers_file, JSON.stringify([], null, 2));
		fs.writeFileSync(genesis_file, JSON.stringify(req.body.genesis, null, 2)); //todo: desambiguate initial key
		fs.writeFileSync(accounts_file, JSON.stringify([], null, 2)); //todo: desambiguate initial key
		fs.writeFileSync(boot_file, JSON.stringify(getBoot(req.body.tag), null, 2));
		fs.writeFileSync(config_file, JSON.stringify(serverConfig, null, 2));

		var configEntry = {
			"name":req.body.network_name,
			"genesis":req.body.network_name + ".json",
			"accounts":req.body.network_name + ".json",
			"peers":req.body.network_name + ".json",
			"boot":req.body.network_name + ".json",
			"tag": req.body.tag
		}

		config.push(configEntry);

		fs.writeFileSync(path.join(process.cwd(), "config", "networks.json"), JSON.stringify(config, null, 2 ));

		return res.json({result: "success"});

	});

	app.post("/removenetwork", function(req, res){

		console.log("removenetwork req.body", req.body);

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

		console.log("verify req.body", req.body);

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

		setInterval(addRegistrations, 60000);

	});

	function addRegistrations(){
		console.log("Checking for registrations...")
		if (localConfig.networkName && localConfig.passphrase){
			console.log("running script")
			exec("node registerAccount.js " + networkName + " " + passphrase);
		}
	}

}

server();
