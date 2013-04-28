
var goxes = [];

function newgox(msg) {
	$("#goxul li:first").remove();
	var goxul = $("#goxul");
	var derp = $("<li>").html(msg).hide();
	goxul.append(derp);
	derp.fadeIn('slow');
};

function newtrans(msg) {
	$("#transul li:first").remove();
	var goxul = $("#transul");
	var derp = $("<li>").html(msg).hide();
	goxul.append(derp);
	derp.fadeIn('slow');
};


StatusBox = {
	reconnecting: function(){},
	connected: function(){}
}


// https://github.com/joewalnes/reconnecting-websocket/
function ReconnectingWebSocket(a){function f(g){c=new WebSocket(a);if(b.debug||ReconnectingWebSocket.debugAll){console.debug("ReconnectingWebSocket","attempt-connect",a)}var h=c;var i=setTimeout(function(){if(b.debug||ReconnectingWebSocket.debugAll){console.debug("ReconnectingWebSocket","connection-timeout",a)}e=true;h.close();e=false},b.timeoutInterval);c.onopen=function(c){clearTimeout(i);if(b.debug||ReconnectingWebSocket.debugAll){console.debug("ReconnectingWebSocket","onopen",a)}b.readyState=WebSocket.OPEN;g=false;b.onopen(c)};c.onclose=function(h){clearTimeout(i);c=null;if(d){b.readyState=WebSocket.CLOSED;b.onclose(h)}else{b.readyState=WebSocket.CONNECTING;if(!g&&!e){if(b.debug||ReconnectingWebSocket.debugAll){console.debug("ReconnectingWebSocket","onclose",a)}b.onclose(h)}setTimeout(function(){f(true)},b.reconnectInterval)}};c.onmessage=function(c){if(b.debug||ReconnectingWebSocket.debugAll){console.debug("ReconnectingWebSocket","onmessage",a,c.data)}b.onmessage(c)};c.onerror=function(c){if(b.debug||ReconnectingWebSocket.debugAll){console.debug("ReconnectingWebSocket","onerror",a,c)}b.onerror(c)}}this.debug=false;this.reconnectInterval=1e3;this.timeoutInterval=2e3;var b=this;var c;var d=false;var e=false;this.url=a;this.readyState=WebSocket.CONNECTING;this.URL=a;this.onopen=function(a){};this.onclose=function(a){};this.onmessage=function(a){};this.onerror=function(a){};f(a);this.send=function(d){if(c){if(b.debug||ReconnectingWebSocket.debugAll){console.debug("ReconnectingWebSocket","send",a,d)}return c.send(d)}else{throw"INVALID_STATE_ERR : Pausing to reconnect websocket"}};this.close=function(){if(c){d=true;c.close()}};this.refresh=function(){if(c){c.close()}}}ReconnectingWebSocket.debugAll=false

var satoshi = 100000000;

var DELAY_CAP = 1000;

var lastBlockHeight = 0;

function TransactionSocket() {

}

TransactionSocket.init = function() {
	// Terminate previous connection, if any
	if (this.connection)
		this.connection.close();

	if ('WebSocket' in window) {
		var connection = new ReconnectingWebSocket('ws://ws.blockchain.info:8335/inv');
		this.connection = connection;

		StatusBox.reconnecting("blockchain");

		connection.onopen = function() {
			console.log('Blockchain.info: Connection open!');
			StatusBox.connected("blockchain");
			var newTransactions = {
				"op" : "unconfirmed_sub"
			};
			var newBlocks = {
				"op" : "blocks_sub"
			};
			connection.send(JSON.stringify(newTransactions));
			connection.send(JSON.stringify(newBlocks));
			connection.send(JSON.stringify({
				"op" : "ping_tx"
			}));
			// Display the latest transaction so the user sees something.
		}

		connection.onclose = function() {
			console.log('Blockchain.info: Connection closed');
			if ($("#blockchainCheckBox").prop("checked"))
				StatusBox.reconnecting("blockchain");
			else
				StatusBox.closed("blockchain");
		}

		connection.onerror = function(error) {
			console.log('Blockchain.info: Connection Error: ' + error);
		}

		connection.onmessage = function(e) {
			var data = JSON.parse(e.data);

			// New Transaction
			if (data.op == "utx") {
				var transacted = 0;

				for (var i = 0; i < data.x.out.length; i++) {
					transacted += data.x.out[i].value;
				}

				var bitcoins = transacted / satoshi;
				bitcoins = Math.round(bitcoins * 1000) / 1000;
				var outputs = data.x.out;
				var printableOutputs = (outputs.length-1);
				if(printableOutputs == 0)
					printableOutputs = 1;

				newtrans(bitcoins + " BTC to " + printableOutputs + " addr" + (printableOutputs>1?"s":""));

				var donation = false;
				
				for (var i = 0; i < outputs.length; i++) {
					/*if ((outputs[i].addr) == DONATION_ADDRESS) {
						bitcoins = data.x.out[i].value / satoshi;
						new Transaction(bitcoins, true);
						return;
					}*/
				}

				setTimeout(function() {
					//new Transaction(bitcoins);
				}, Math.random() * DELAY_CAP);

			} else if (data.op == "block") {
				var blockHeight = data.x.height;
				var transactions = data.x.nTx;
				var volumeSent = data.x.estimatedBTCSent;
				var blockSize = data.x.size;
				// Filter out the orphaned blocks.
				if (blockHeight > lastBlockHeight) {
					lastBlockHeight = blockHeight;
					console.log("New Block");
					new Block(blockHeight, transactions, volumeSent, blockSize);
				}
			}

		}
	} else {
		//WebSockets are not supported.
		console.log("No websocket support.");
		StatusBox.nosupport("blockchain");
	}
}

TransactionSocket.close = function() {
	if (this.connection)
		this.connection.close();
	StatusBox.closed("blockchain");
}
function TradeSocket() {

}

TradeSocket.init = function() {
	// Terminate previous connection, if any
	if (this.connection)
		this.connection.close();

	if ('WebSocket' in window) {
		var connection = new ReconnectingWebSocket('ws://websocket.mtgox.com:80/mtgox');
		this.connection = connection;

		StatusBox.reconnecting("mtgox");

		connection.onopen = function() {
			console.log('Mt.Gox: Connection open!');
			StatusBox.connected("mtgox");

			var unsubDepth = {
				"op" : "unsubscribe",
				"channel" : "24e67e0d-1cad-4cc0-9e7a-f8523ef460fe"
			}

			connection.send(JSON.stringify(unsubDepth));
		}

		connection.onclose = function() {
			console.log('Mt.Gox: Connection closed');
			if ($("#mtgoxCheckBox").prop("checked"))
				StatusBox.reconnecting("mtgox");
			else
				StatusBox.closed("mtgox");
		}

		connection.onerror = function(error) {
			console.log('Mt.Gox: Connection Error: ' + error);
		}

		connection.onmessage = function(e) {
			var message = JSON.parse(e.data);
			//console.log(message);

			if (message.trade) {
				//console.log("Trade: " + message.trade.amount_int / satoshi + " BTC | " + (message.trade.price * message.trade.amount_int / satoshi) + " " + message.trade.price_currency);
				// 0.57 BTC | 42.75 USD

				var bitcoins = message.trade.amount_int / satoshi;
				var currency = (message.trade.price * message.trade.amount_int / satoshi);
				var currencyName = message.trade.price_currency;

				bitcoins = Math.round(bitcoins * 1000) / 1000;
				currency = Math.round(currency * 1000) / 1000;

				newgox((message.trade.trade_type === 'ask' ? "sell" : "buy") + " " + bitcoins + " BTC for " + currency + " " + currencyName);

				setTimeout(function() {
					//new Transaction(bitcoins, false, currency, currencyName);
				}, Math.random() * DELAY_CAP);
			}
		}
	} else {
		//WebSockets are not supported.
		console.log("No websocket support.");
		StatusBox.nosupport("mtgox");
	}
}

TradeSocket.close = function() {
	if (this.connection)
		this.connection.close();
	StatusBox.closed("mtgox");
}

TransactionSocket.init();
TradeSocket.init();