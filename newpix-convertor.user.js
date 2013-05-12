// ==UserScript==
// @name Newpix convertor
// @description Converts phpBB dates into the One Time Unit: the newpix.
// @author Pikrass
// @author Smithers
// @version 1220
// @include http://forums.xkcd.com/viewtopic.php*
// @include http://fora.xkcd.com/viewtopic.php*
// @include http://forums.xkcd.com/posting.php*
// @include http://fora.xkcd.com/posting.php*
// ==/UserScript==

newpixConvertor = {
	// Change this according to your preference
	decimals: 2,

	convert: function() {
		var i, j;

		// Convert original post times.
		var authors = document.getElementsByClassName('author');
		for (i = 0; i < authors.length; i++) {
			authors[i].lastChild.data = ' » ' + this.hereticToReal(authors[i].lastChild.data.substr(3));
		}

		// Convert "last edited" times.
		var edits = document.getElementsByClassName('notice');
		for (i = 0; i < edits.length; i++) {
			var str = edits[i].lastChild.data;
			var comma = str.indexOf(',');
			edits[i].lastChild.data = ' at ' + this.hereticToReal(str.substr(4, comma-4)) + str.substr(comma);
		}

		// Convert joined dates.
		var profiles = document.getElementsByClassName('postprofile');
		for (i = 0; i < profiles.length; i++) {
			for (j = 0; j < profiles[i].childNodes.length; j++) {
				var node = profiles[i].childNodes[j];
				if (node.localName == 'dd' && node.firstChild.outerHTML == '<strong>Joined:</strong>') {
					node.lastChild.data = ' ' + this.hereticToReal(node.lastChild.data.substr(1));
					break;
				}
			}
		}
	},

	hereticToReal: function(hereticString) {
		var hereticDate = new Date(hereticString);
		var off = this.getUtcOffset();
		hereticDate.setHours(hereticDate.getHours() - off.np);
		hereticDate.setMinutes(hereticDate.getMinutes() - off.fnp);

		var realDate = this.dateToNewpix(hereticDate);

		if (realDate >= 0)
			return 'newpix ' + this.npToString(realDate);
		else
			return 'newpix ' + this.npToString(-realDate) + ' B.T.';
	},

	dateToNewpix: function(date) {
		var oneTrueBeginningOfTime = new Date('Mon Mar 25, 2013 4:00 am UTC');
		var np = (date - oneTrueBeginningOfTime) / 1800000;

		// Old newpix -> new newpix
		if(np >= 240) {
			np = 240 + (np - 240)/2;
		}

		if(np >= 0)
			return np + 1;
		else
			return np - 1;
	},

	npToString: function(np) {
		var str = np.toString();

		var dot = str.indexOf('.');
		var dec;
		if(dot == -1) {
			str += '.';
			dec = 0;
		}
		else {
			dec = str.length - dot - 1;
		}

		while(dec < this.decimals) {
			str += '0';
			dec++;
		}
		str = str.substr(0, str.length - (dec - this.decimals));

		return str;
	},

	getUtcOffset: function() {
		var offset = {np: 0, fnp: 0};
		var rights = document.getElementsByClassName('rightside');
		var text = rights[rights.length-1].innerHTML;

		var reg = /UTC (-|\+) (\d+)(?::(\d{2}))? hour/;
		var m = text.match(reg);
		if(m != null) {
			offset.np = (m[1] == '+' ? parseInt(m[2]) : -parseInt(m[2]));
			if(m[3] != undefined)
				offset.fnp = (m[1] == '+' ? parseInt(m[3]) : -parseInt(m[3]));
		}

		if(text.indexOf('DST') != -1)
			offset.np++;

		return offset;
	}
};

if(location.search.indexOf('f=7') != -1 && location.search.indexOf('t=101043') != -1)
	window.addEventListener('DOMContentLoaded', newpixConvertor.convert.bind(newpixConvertor));
