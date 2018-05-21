var eos = require("eosjs-ecc");
var fs = require("fs");

eos.PrivateKey.randomKey()
	.then(privateKey => {

		if (process.argv.length > 2 && process.argv[2] == "client"){

			var privateKey = privateKey.toWif();
			var publicKey = eos.PrivateKey.fromWif(privateKey).toPublic().toString();

			console.log("privateKey (use on client to make authorized api calls to server)");
			console.log("  ", privateKey);
			console.log("  ");
			console.log("publicKey (use on server to accept authorized api calls to server)");
			console.log("  ", eos.PrivateKey.fromWif(privateKey).toPublic().toString());
			console.log("  ");

			fs.writeFileSync("./config/client.json", JSON.stringify({"private_key": privateKey}, null, 2));

			console.log("Client application configured with private key.");

		}
		else {
			console.log("privateKey", privateKey.toWif());
			console.log("publicKey", eos.PrivateKey.fromWif(privateKey.toWif()).toPublic().toString());
		}

 	}
)
