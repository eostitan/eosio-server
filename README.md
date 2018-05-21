# eosio-server


*eosio-server* is a standalone server that provides information about a number of testnets and that can be configured remotely by an instance of [eosio-client](https://github.com/CryptoMechanics/eosio-client).

It maintains a list of networks with genesis configuration, version and a list of peers to be used for bootstrapping the blockchain. Over time, eosio-server will also be expanded to operate a faucet and automatically send tokens to connecting nodes, as well as indexed information on the blockchain, automated registration as apointed block producers candidates, etc.

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