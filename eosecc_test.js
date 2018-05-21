var eos = require("eosjs-ecc");
var cjson = require("canonicaljson");
var fs = require("fs");

eos.PrivateKey.randomKey()
	.then(privateKey => {

		let priv_key_wif = "5K7w2cEfUeVLjroqxddhzCs1zJfy9yM2KysVzMtjrcWucsGpy5G" //privateKey.toWif();
		let pub_key = eos.PublicKey.fromString("EOS7uTdRms6gxwGu5XqevSw6EDe4AzArAdzYWQt1Q6vF5D83oSrZi"); //eos.PrivateKey.fromWif(privateKey.toWif()).toPublic();

		console.log("privateKey", priv_key_wif);
		console.log("publicKey", pub_key.toString());

		let hash = eos.sign(cjson.stringify({"test":"some stuff"}), priv_key_wif)
		let verification = eos.verify(hash, cjson.stringify({"test":"some stuff"}), pub_key)

		console.log("hash", hash);
		console.log("verification", verification);

 	}
)
