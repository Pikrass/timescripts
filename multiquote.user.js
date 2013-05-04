// ==UserScript==
// @name Multiquote for the One True Forum
// @description Changes quote buttons behaviour to quote multiple messages
// @author Pikrass
// @version 1094
// @resource quote_waiting imgs/quote_waiting.png
// @resource quote_ok imgs/quote_ok.png
// @include http://forums.xkcd.com/viewtopic.php*
// @include http://fora.xkcd.com/viewtopic.php*
// @include http://forums.xkcd.com/posting.php*
// @include http://fora.xkcd.com/posting.php*
// ==/UserScript==

multiquote = {
	convert: function() {
		var buttons = document.getElementsByClassName('quote-icon');
		var i;
		for(i=0 ; i<buttons.length ; i++) {
			var link = buttons[i].firstChild;
			link.quoteUrl = link.href;
			link.href = 'javascript:;';
			link.addEventListener('click', this.quote.bind(this, link), false);
		}
	},

	quote: function(link) {
		var req = new XMLHttpRequest();
		req.addEventListener('load', this.addQuote.bind(this, req, link));
		req.open('get', link.quoteUrl, true);
		req.send();
		link.style.backgroundImage = 'url("'+GM_getResourceURL('quote_waiting')+'")';
	},

	addQuote: function(req, link) {
		var areaPos = req.responseText.indexOf('<textarea name="message" id="message"');
		var beg = req.responseText.indexOf('[quote', areaPos)
		var end = req.responseText.indexOf('</textarea>', beg);
		var str = req.responseText.substring(beg, end);

		var quote = GM_getValue('quoteText');
		if(quote == undefined)
			quote = str;
		else
			quote += "\n\n\n"+str;

		GM_setValue('quoteText', quote);
		link.style.backgroundImage = 'url("'+GM_getResourceURL('quote_ok')+'")';
	},

	dumpQuotes: function() {
		var tmpDiv = document.createElement('div');
		tmpDiv.innerHTML = GM_getValue('quoteText', '');
		var str = tmpDiv.firstChild.data;

		var area = document.getElementById('message');
		area.value += str;

		var postButton = document.getElementsByName('post')[0];
		var previewButton = document.getElementsByName('preview')[0];
		var saveButton = document.getElementsByName('save')[0];
		postButton.addEventListener('click', this.flush.bind(this));
		previewButton.addEventListener('click', this.flush.bind(this));
		saveButton.addEventListener('click', this.flush.bind(this));
	},

	flush: function() {
		GM_deleteValue('quoteText');
	}
};

if(location.href.indexOf('viewtopic') != -1)
	window.addEventListener('DOMContentLoaded', multiquote.convert.bind(multiquote));
if(location.href.indexOf('posting') != -1)
	window.addEventListener('DOMContentLoaded', multiquote.dumpQuotes.bind(multiquote));
