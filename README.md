# eosio-server


*eosio-server* is a standalone server that provides information about a number of testnets and that can be configured remotely by an instance of [eosio-client](https://github.com/CryptoMechanics/eosio-client).

It maintains a list of networks with their respective genesis configuration, version and a list of peers to be used for sharing blockchain data. Over time, eosio-server will also be expanded to operate a faucet and automatically send tokens to connecting nodes, as well as indexed information on the blockchain, automated registration as apointed block producers candidates, etc.

It is meant to interface with eosio-script in facilitating easy deployment of eos networks.

*eosio-server* provides a number of public and private functions. Public functions do not require any signature and are thus available to everyone. Private function calls are however used to configure the server, and require a signature by the private key associated to the public key held by the server to affect configuration.

Public REST API methods:



Private REST API methods:


Signing Private REST API methods calls (nodejs example):

```
var eos = require("eosjs-ecc");
var cjson = require("canonicaljson");

var myObject = {
	"some":"values"
}

var signature = eos.sign(cjson.stringify(myObject), "5HtJigwy65vb2kAMrjGFt8zG3PNrfKEHmVXr9HbatJyfabAkPKv");


```

## eosio-server configuration:

```
git clone https://github.com/CryptoMechanics/eosio-server
cd eosio-server
```

At this point, a server.json file should be created in /config and configured with a public key obtained by running node genkey.js client on an instance of [eosio-client](https://github.com/CryptoMechanics/eosio-client).

Content of server.json file:

```
{
	"public_key":"EOS6kwbXRKm7sSCEgBSELKcvdzsvyFJ16ombFLEZZEZLXo1hZFiBu"
}
```

## To start server:

```
node server.js

```

## boot sequence operations

As part of a network description file, the boot object defines the eosio boot sequence in order to launch the network. All actions are sorted by ascending index first, and then the eosconfig script will execute all commands sequentially.


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
			},
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
cleos create account eosio eosio.token EOSAAAAAA...

cleos create key
cleos wallet import 5BBBBBBB...
cleos create account eosio eosio.msig EOSBBBBBB...

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
