// ==UserScript==
// @name Multiquote for the One True Forum
// @description Changes quote buttons behaviour to quote multiple messages
// @author Pikrass
// @version 1674
// @resource quote_waiting imgs/quote_waiting.png
// @resource quote_ok imgs/quote_ok.png
// @include http://forums.xkcd.com/viewtopic.php*
// @include http://fora.xkcd.com/viewtopic.php*
// @include http://forums.xkcd.com/posting.php*
// @include http://fora.xkcd.com/posting.php*
// ==/UserScript==

multiquote = {
	init: function() {
		this.quotes = JSON.parse(GM_getValue('quotes', '{}'));
	},

	convert: function() {
		this.init();

		var buttons = document.getElementsByClassName('quote-icon');
		var i;
		for(i=0 ; i<buttons.length ; i++) {
			var link = buttons[i].firstChild;
			link.quoteUrl = link.href;
			link.href = 'javascript:;';
			link.eventListener = this.quote.bind(this, link);
			link.addEventListener('click', link.eventListener, false);
		}
	},

	quote: function(link) {
		var postbody = this.findAncestorByClass(link, 'postbody');

		link.removeEventListener('click', link.eventListener);
		link.eventListener = this.hideReplyArea.bind(this, link, postbody);
		link.addEventListener('click', link.eventListener, false);

		var req = new XMLHttpRequest();
		req.addEventListener('load', this.addQuote.bind(this, req, link));
		req.open('get', link.quoteUrl, true);
		req.send();
		link.style.backgroundImage = 'url("'+GM_getResourceURL('quote_waiting')+'")';

		this.makeReplyArea(postbody);
	},

	addQuote: function(req, link) {
		var areaPos = req.responseText.indexOf('<textarea name="message" id="message"');
		var beg = req.responseText.indexOf('[quote', areaPos)
		var end = req.responseText.indexOf('</textarea>', beg);
		var str = req.responseText.substring(beg, end);

		var num = link.quoteUrl.match(/&p=(\d+)/)[1];

		if(typeof this.quotes[num] == 'undefined') {
			this.quotes[num] = {};
		}

		this.quotes[num].quote = str;

		GM_setValue('quotes', JSON.stringify(this.quotes));
		link.style.backgroundImage = 'url("'+GM_getResourceURL('quote_ok')+'")';
	},

	makeReplyArea: function(div) {
		var post = this.findAncestorByClass(div, 'post');
		var pId = post.id.substr(1);

		var container = document.createElement('div');

		var preDiv = document.createElement('div');
		preDiv.appendChild(document.createTextNode('Reply:'));
		preDiv.style.marginTop = '10px';
		preDiv.style.fontSize = '1.3em';

		var area = document.createElement('textarea');
		area.className = 'multiquote-reply';
		area.style.width = '100%';
		area.style.height = '100px';
		area.style.fontSize = '1.2em';

		var butDiv = document.createElement('div');
		butDiv.style.textAlign = 'right';
		var but = document.createElement('input');
		but.type = 'button';
		but.value = 'Save';
		but.style.fontWeight = 'bold';
		but.addEventListener('click', this.addReply.bind(this, area, pId, but));
		butDiv.appendChild(but);

		area.addEventListener('keypress', this.onAreaChange.bind(this, area, but));

		container.appendChild(preDiv);
		container.appendChild(area);
		container.appendChild(butDiv);

		div.appendChild(container);
	},

	showReplyArea: function(link, div) {
		div.lastChild.style.display = '';

		link.removeEventListener('click', link.eventListener);
		link.eventListener = this.hideReplyArea.bind(this, link, div);
		link.addEventListener('click', link.eventListener, false);
	},

	hideReplyArea: function(link, div) {
		div.lastChild.style.display = 'none';

		link.removeEventListener('click', link.eventListener);
		link.eventListener = this.showReplyArea.bind(this, link, div);
		link.addEventListener('click', link.eventListener, false);
	},

	onAreaChange: function(area, but) {
		but.value = 'Save';
		but.disabled = false;
	},

	addReply: function(area, num, but) {
		if(typeof this.quotes[num] == 'undefined') {
			this.quotes[num] = {}; // This is *absolutely* thread-safe :D
		}

		this.quotes[num].reply = area.value;
		GM_setValue('quotes', JSON.stringify(this.quotes));

		but.value = 'Saved';
		but.disabled = true;
	},

	dumpQuotes: function() {
		this.init();

		var tmpDiv = document.createElement('div');
		tmpDiv.innerHTML = this.aggregateQuotes();
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
		this.quotes = {};
		GM_deleteValue('quotes');
	},

	aggregateQuotes: function() {
		var s = '';
		var i;
		for(i in this.quotes) {
			if(s != '')
				s += "\n\n";

			s += this.quotes[i].quote;

			if(this.quotes[i].reply)
				s += "\n" + this.quotes[i].reply;
		}

		return s;
	},


	findAncestorByClass: function(elem, className) {
		if(new RegExp('\\b'+className+'\\b').test(elem.className))
			return elem;
		else {
			if(elem != document.body)
				return this.findAncestorByClass(elem.parentNode, className);
			return null;
		}
	}
};

if(location.href.indexOf('viewtopic') != -1)
	window.addEventListener('DOMContentLoaded', multiquote.convert.bind(multiquote));
if(location.href.indexOf('posting') != -1)
	window.addEventListener('DOMContentLoaded', multiquote.dumpQuotes.bind(multiquote));
