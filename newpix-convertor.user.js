// ==UserScript==
// @name Newpix convertor
// @description Converts phpBB dates into the One Time Unit: the newpix.
// @author Pikrass
// @include http://forums.xkcd.com/viewtopic.php*
// @include http://fora.xkcd.com/viewtopic.php*
// ==/UserScript==

var newpixConvertor = {
	// Change this according to your preference
	decimals: 2,

	convert: function() {
		var authors = document.getElementsByClassName('author');
		var i;
		var t = newpixConvertor;

		for(i=0 ; i < authors.length ; i++) {
			var hereticDate = new Date(authors[i].lastChild.data.substr(3));
			var off = t.getUtcOffset();
			hereticDate.setHours(hereticDate.getHours() - off.np);
			hereticDate.setMinutes(hereticDate.getMinutes() - off.fnp);

			var realDate = t.dateToNewpix(hereticDate);

			if(realDate > 0)
				authors[i].lastChild.data = ' » newpix '+t.npToString(realDate);
			else
				authors[i].lastChild.data = ' » newpix '+t.npToString(-realDate)+' B.T.';
		}
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
			return -np;
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

		while(dec < newpixConvertor.decimals) {
			str += '0';
			dec++;
		}
		str = str.substr(0, str.length - (dec - newpixConvertor.decimals));

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
	window.addEventListener('DOMContentLoaded', newpixConvertor.convert);
