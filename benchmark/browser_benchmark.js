var ltx = require("ltx");
var strophe = require('Strophe.js');
var util = require('util');
var requestAnimationFrame = require('request-animation-frame').requestAnimationFrame;

function now() {
    return new Date().getTime();
}

function Test() {
    this.timings = {};
}
Test.prototype = {
    record: function(name, fun) {
	var t1 = now();
	var res = fun();
	var t2 = now();

	if (!this.timings.hasOwnProperty(name))
	    this.timings[name] = { i: 0, t: 0 };
	this.timings[name].i++;
	this.timings[name].t += t2 - t1;
    },

    report: function() {
	var s = [];
	var html = "<div style='float: left; min-width: 25em'><h2>" + this.name + "</h2><dl>";
	for(var k in this.timings) {
	    var t = this.timings[k].t / this.timings[k].i;
	    html += "<dt>" + k + "</dt><dd class='" + k + "'>" + t + " ms </dd>";
	}
	html += "</dl></div>\n";
	return html;
    }
};

function LtxTest(saxParser) {
    Test.call(this);
    this.saxParser = saxParser;
    this.name = "LTX/" + saxParser.name;
}
util.inherits(LtxTest, Test);

LtxTest.prototype.parse = function(s) {
    return ltx.parse(s, this.saxParser);
};

LtxTest.prototype.serialize = function(el) {
    return el.toString();
};

LtxTest.prototype.traverse = function(node) {
    while(node.children && node.children[0])
	node = node.children[0];
};

function StropheTest() {
    Test.call(this);
    this.name = "Strophe.js";
}
util.inherits(StropheTest, Test);

StropheTest.prototype.parse = function(s) {
    return Strophe.xmlHtmlNode(s).firstChild;
};

StropheTest.prototype.serialize = Strophe.serialize;

StropheTest.prototype.traverse = function(node) {
    while(node.firstChild)
	node = node.firstChild;
};

var tests = [new StropheTest()].concat(ltx.availableSaxParsers.map(function(saxParser) {
    return new LtxTest(saxParser);
}));
var messages = [
    "<message/>",
    "<message foo='bar'/>",
    "<message foo='bar'><foo/><bar>fnord<baz/>fnord</bar></message>"
];
messages[3] = "<message>";
for(var i = 0; i < 10; i++) {
    messages[3] += "fnord fnord fnord<foo bar='baz'>";
}
for(var i = 0; i < 10; i++) {
    messages[3] += "</foo>fnordfnordfnordfnord<quux foo='bar'/>";
}
messages[3] += "</message>";

var iteration = 0;
function runTests() {
    iteration++;
    tests.forEach(function(test) {
	for(var j = 0; j < messages.length; j++) {
	    var parsed, serialized;
	    test.record('parse' + j, function() {
		parsed = test.parse(messages[j]);
	    });
	    test.record('serialize' + j, function() {
		serialized = test.serialize(parsed);
	    });
	    test.record('traverse' + j, function() {
		test.traverse(parsed);
	    });
	}
    });

    document.body.innerHTML = "<style>.parse0, .parse1, .parse2, .parse3 { color: red; } .serialize1, .serialize2, .serialize3, .serialize4 { color: blue; }</style>\n" +
	"<h1>Iteration " + iteration + "<h1>\n";
    tests.forEach(function(test) {
	document.body.innerHTML += test.report() + "<br>";
    });

    requestAnimationFrame(runTests);
}

setTimeout(function() {
    runTests();
}, 1000);
