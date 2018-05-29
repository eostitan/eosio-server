var fs = require("fs");
var path = require("path");
var async = require("async");
const { spawn } = require('child_process');
const { exec } = require('child_process');

var walletKey;

function registerAccount(acct, cb){

	let key = acct.key;
	let name = acct.name;

	let args = [];

	//cleos system newaccount eosio --transfer accountnum11 EOS8mUftJXepGzdQ2TaCduNuSPAfXJHf22uex4u41ab1EVv9EAhWt --stake-net "100000.0000 SYS" --stake-cpu "100000.0000 SYS"

  args.push("system");
  args.push("newaccount");
  args.push("eosio");
  args.push("--transfer");
  args.push(name);
  args.push(key);
  args.push("--stake-net");
  args.push('1000.0000 SYS');
  args.push("--stake-cpu");
  args.push('1000.0000 SYS');

  console.log("Running : cleos " + args.join(" "));

	//exec('cleos wallet unlock --password ' + walletKey, (e, stdout, stderr)=> {cb();});

	var p = spawn("cleos", args);

	p.stdout.setEncoding('utf8');
	p.stdout.on('data', (chunk) => {
		console.log(chunk)
	});

	p.stderr.setEncoding('utf8');
	p.stderr.on('data', (chunk) => {
		console.log(chunk)
	});

	p.on('close', (code) => {

		console.log("push_action close CODE:", code);


		return cb();

	});

	//return cb();

}

if (process.argv.length>=4){

	//console.log("Registering accounts for network:", process.argv);

	let accounts_file = path.join(process.cwd(), "files", "accounts", process.argv[2] + ".json");
	let accounts = JSON.parse(fs.readFileSync(accounts_file, "utf8"));
	let emptyAccounts = JSON.stringify([], null, 2);
	let processed_file	= path.join(process.cwd(), "files", "accounts", process.argv[2] + ".json.processed");

	walletKey = process.argv[3];


	exec('cleos wallet unlock --password ' + walletKey, (e, stdout, stderr)=> {
		if (!stderr || stderr.includes("Wallet is already unlocked")){
					
			let processed = [];

			if (fs.existsSync(processed_file)) processed = JSON.parse(fs.readFileSync(processed_file, "utf8"));

			let newProcessed = processed.concat(accounts);

			fs.writeFileSync(processed_file, JSON.stringify(newProcessed, null, 2));
			fs.writeFileSync(accounts_file, emptyAccounts);

		/*	let unreg_accts = accounts.filter(function(a){return a.created == false});

			console.log("unregisterd accounts:", JSON.stringify(unreg_accts, null, 2));
		*/

			async.eachSeries(accounts, registerAccount, function(err,res){
				//console.log("Completed registration.");
			});

		}
		else {
			console.log("Cannot open wallet: ", stderr);
		}
	});

}
else console.log("Usage:", "node registerAccounts.js <my network> <wallet password>");