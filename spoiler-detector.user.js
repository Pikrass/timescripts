// ==UserScript==
// @name Time spoiler detector
// @description Hides away spoilers for blitzers
// @author Pikrass
// @version 1094
// @include http://forums.xkcd.com/viewtopic.php*
// @include http://fora.xkcd.com/viewtopic.php*
// @include http://forums.xkcd.com/posting.php*
// @include http://fora.xkcd.com/posting.php*
// ==/UserScript==

spoilerDetector = {
	detect: function() {
		var imgs = document.getElementsByTagName('img');
		var i;
		for(i=0 ; i<imgs.length ; i++) {
			if(imgs[i].src == 'http://imgs.xkcd.com/comics/time.png') {
				this.protect(imgs[i]);
			}
		}
	},

	protect: function(img) {
		var spoilDiv = document.createElement('div');
		spoilDiv.style.margin = '20px';
		spoilDiv.style.marginTop = '5px';
		var spoilTitle = document.createElement('div');
		var spoilLabel = document.createElement('span');
		spoilLabel.style.color = 'red';
		spoilLabel.style.fontWeight = 'bold';
		spoilLabel.appendChild(document.createTextNode('CURRENT NEWPIX SPOILER: '));
		var spoilButton = document.createElement('input');
		spoilButton.type = 'button';
		spoilButton.style.width = '45px';
		spoilButton.style.fontSize = '10px';
		spoilButton.value = 'Show';
		spoilButton.addEventListener('click', this.toggle.bind(this, spoilDiv));
		var spoilContent = document.createElement('div');
		spoilContent.style.display = 'none';

		spoilDiv.appendChild(spoilTitle);
		spoilDiv.appendChild(spoilContent);
		spoilDiv.contentDiv = spoilContent;
		spoilDiv.button = spoilButton;

		spoilTitle.appendChild(spoilLabel);
		spoilTitle.appendChild(spoilButton);

		img.parentNode.replaceChild(spoilDiv, img);
		spoilContent.appendChild(img);
	},

	toggle: function(div) {
		if(div.contentDiv.style.display == 'none') {
			div.contentDiv.style.display = '';
			div.button.value = 'Hide';
		}
		else {
			div.contentDiv.style.display = 'none';
			div.button.value = 'Show';
		}
	}
};

window.addEventListener('DOMContentLoaded', spoilerDetector.detect.bind(spoilerDetector));
