# eosio-server


*eosio-server* is a standalone server that provides information about a number of testnets and that can be configured remotely by calling its API methods.

It maintains a list of networks with their respective genesis configuration, version and a list of peers to be used for sharing blockchain data. Over time, eosio-server will also be expanded to operate a faucet and automatically send tokens to connecting nodes, as well as indexed information on the blockchain, automated registration as apointed block producers candidates, etc.

It is meant to interface with eosio-script in facilitating easy deployment of eos networks.

*eosio-server* provides a number of public and private functions. Public functions do not require any signature and are thus available to everyone. Private function calls are however used to configure the server, and require a signature by the private key associated to the public key held by the server to affect configuration.

## eosio-server configuration:

```
git clone https://github.com/CryptoMechanics/eosio-server
cd eosio-server
```

## To start server:

```
node server.js

```

## Signing Private REST API methods calls (nodejs example):

	```
	var eos = require("eosjs-ecc");//signiture
	var cjson = require("canonicaljson");// deterministic stringify if json 
	var request = require("request");

	let addPeerData = {
		"network_name": "my_testnet",
		"peer": "node1.eostitan.com:9876"
	}

	var signature = eos.sign(cjson.stringify(addPeerData), "5HtJigwy65vb2kAMrjGFt8zG3PNrfKEHmVXr9HbatJyfabAkPKv");

	addPeerData.signature = signature;

	request({url: 'http://discovery.eostitan.com:9273/addpeer', method: 'POST', json:addPeerData}, function(err, res, body){
		//callback

	});

	```



## EOSIO-Server Private REST API methods:

###	post /removenetwork 

	This method is used to remove a network for which you own the initial key

	let removeNetworkData = {
		"network_name": "my_testnet"
	}

	var signature = eos.sign(cjson.stringify(removeNetworkData),"5HtJigwy65vb2kAMrjGFt8zG3PNrfKEHmVXr9HbatJyfabAkPKv");
		
	request({url: 'http://discovery.eostitan.com:9273/removenetwork', method: 'POST', json:removeNetworkData}, function(err, res, body){

		//callback

	});

###	post /removepeer 
	This method is used to remove a peer from the discovery file of a network for which you own the initial key

	let removePeerData = {

		"network_name": "my_testnet",
		"peer": "node1.eostitan.com:9876"

	}

	var signature = eos.sign(cjson.stringify(removePeerData), "5HtJigwy65vb2kAMrjGFt8zG3PNrfKEHmVXr9HbatJyfabAkPKv");
	
	request({url: 'http://discovery.eostitan.com:9273/removepeer', method: 'POST', json:removePeerData}, function(err, res, body){

		//callback

	});

###	post /addpeer 

	This method is used to add a peer to a network for which you own the initial key

	let addPeerData = {

	"network_name": "my_testnet",
	"peer": "node1.eostitan.com:9876"

	}

	var signature = eos.sign(cjson.stringify(addPeerData), "5HtJigwy65vb2kAMrjGFt8zG3PNrfKEHmVXr9HbatJyfabAkPKv");
	
	request({url: 'http://discovery.eostitan.com:9273/addpeer', method: 'POST', json:addPeerData}, function(err, res, body){

		//callback

	});

## EOSIO-Server Public REST API methods:

###	get /networks/:network

	This method is used to get information of a single network , you should provide the name of the network at the end of the url as below:

		http://localhost:9273/networks/:network=NETWORKNAME

###	get /listnetworks 

	This method is used to get the summary of all public networks
		
		http://localhost:9273/listnetworks


###	post /addnetwork

	Add a new network to the discovery server
	
	let addNetworkData = {
		"network_name":"my_testnet",
		"initial_key:"initial_key",
		"tag":"tag",
		"genesis":"genesis"
	}
		
	request({url: 'http://discovery.eostitan.com:9273/addnetwork', method: 'POST', json:addNetworkData}, function(err, res, body){

		//callback

	});
	
	


###	post /verify 

	Verify authenticity of a message based on public key and signature

		let verifyMessageData = {
			"public_key":"my_testnet",
			"message:"initial_key",
			"signature":"tag",
		}
			
		request({url: 'http://discovery.eostitan.com:9273/verify', method: 'POST', json:verifyMessageData}, function(err, res, body){

			//callback

		});
	

###	post /registerAccount

	you should provide the account_name , public_key of the account and network_name that you intend to register the acount as data inputs in th json object:
	
	let registerAccountData ={

		"account_name":"account_name",
		"public_key":"public_key",
		"network_name":"network_name"

	}

	request({url: 'http://discovery.eostitan.com:9273/registerAccount', method: 'POST', json:registerAccountData}, function(err, res, body){

		//callback

	});


## TODO (not implemented yet):

###	post /registerAsPeer
	Register yourself as a peer to be listed in the discovery file of a network


## Boot sequence operations

As part of a network description file, the boot object defines the eosio boot sequence to be executed in order to launch the network. All actions are sorted by ascending index first, and then the eosconfig script will execute all commands sequentially.


commands:

### nodeos
Runs nodeos with specified arguments.

#### parameters
*arguments* 
List of arguments to pass to nodeos

Example:
```
{
	"index": 0,
	"command": "nodeos",
	"account": "eosio",
	"arguments": "-e -p"
}
```

Equivalent to : 
```
nodeos -e -p eosio
```

### generate_contract_keys
Create keys, import them and create accounts for initial smart contracts.

#### parameters
*account* 
Creator account (ie: eosio)

*keys* 
Array of contracts to be created

Example:
```
{
	"index": 1,
	"command": "generate_contract_keys",
	"account": "eosio",
	"keys": [
		{"name":"eosio.token"},
		{"name":"eosio.msig"}
	]
}
```

Equivalent to : 
```
cleos create key
cleos wallet import 5AAAAAA...
cleos create account eosio eosio.token EOSAAAAAA... EOSAAAAAA...

cleos create key
cleos wallet import 5BBBBBBB...
cleos create account eosio eosio.msig EOSBBBBBB... EOSBBBBBB...

```

### set_contract
Pushes a smart contract on the blockchain

#### parameters
*name* 
Name of the contract (should match account created previously)

*path* 
Name of the folder containing the .ABI and .WAST contract, assuming contracts are in ~/releases/eos/build/contracts

Example:
```
{
	"index": 2,
	"command": "set_contract",
	"name": "eosio.token",
	"path": "eosio.token"
}
```

Equivalent to : 
```
cleos set contract eosio.token ~/releases/eos/build/contracts/eosio.token
```

### push_action
Pushes a single action on the blockchain

#### parameters
*signature* 
Signature that should be used with the permission -p flag

*contract* 
Contract to interact with

*action* 
Method to call on the contract

*params* 
Array of parameters that should be passed to the contract function

Example:
```
{
	"index": 5,
	"command": "push_action",
	"signature": "eosio",
	"contract": "eosio.token",
	"action": "issue",
	"params": [
		"eosio",
		"1000000000.0000 SYS", 
		"memo"
	]
}
```


Equivalent to : 
```
cleos push action eosio.token issue '[ "eosio", "1000000000.0000 SYS", "memo" ]' -p eosio
```
