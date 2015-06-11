# Documentation

## How to embed the widget to the site
TBD

## How to embed the script on the goodharborfinancial.com
* it requires that scw.github.io repo must be opened.
* Open in the chrome link http://www.goodharborfinancial.com/strategies/strategy.pl?S=Tactical%20Core
* Hit cmd+alt+i
* Copy code:
<pre><code>var scw = document.createElement('script'); scw.type = 'text/javascript'; scw.async = true;scw.src = 'http://semeyon.github.io/scw.github.io/scemb.js';var s = document.getElementsByTagName('body')[0]; s.appendChild(scw);</code></pre>

* Paste it to the opened console and hit enter.
