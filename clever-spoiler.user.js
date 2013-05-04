// ==UserScript==
// @name Clever spoiler
// @description Enhances phpBB's spoiler tags on the OTF
// @author Pikrass
// @version 1097
// @include http://forums.xkcd.com/viewtopic.php*
// @include http://fora.xkcd.com/viewtopic.php*
// @include http://forums.xkcd.com/posting.php*
// @include http://fora.xkcd.com/posting.php*
// ==/UserScript==

var cleverSpoiler = {
	addHideButton: function() {
		var divHide = document.createElement('div');
		var hide = document.createElement('input');
		hide.type = 'button';
		hide.value = 'Hide';
		hide.style.width = '45px';
		hide.style.fontSize = '10px';
		divHide.appendChild(hide);

		var spoilers = document.getElementsByClassName('quotecontent');
		var i;
		for(i=0 ; i < spoilers.length ; i++) {
			var newButton = divHide.cloneNode(true);
			newButton.firstChild.addEventListener('click', this.hideSpoiler, false);
			spoilers[i].firstChild.appendChild(newButton);
		}
	},

	hideSpoiler: function() {
		this.parentNode.parentNode.style.display = 'none';
	}
};

window.addEventListener('DOMContentLoaded', cleverSpoiler.addHideButton.bind(cleverSpoiler));
