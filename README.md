# Documentation

## How to embed the widget to the site
TBD

## How to embeding the script on the goodharborfinancial.com
* it requires that scw.github.io repo must be opened.
* Open in the chrome link http://www.goodharborfinancial.com/strategies/strategy.pl?S=Tactical%20Core
* Hit cmd+alt+i
* Copy code:
<pre><code>var scw = document.createElement('script'); scw.type = 'text/javascript'; scw.async = true;scw.src = 'http://semeyon.github.io/scw.github.io/scemb.js';var s = document.getElementsByTagName('body')[0]; s.appendChild(scw);</code></pre>

* Paste it to the opened console and hit enter.
* The code below should be placed there frontend developer want to render widget.
<pre><code><widget id="test-widget" style="display:block;width:1124px;height:780px;background:url(build/713.GIF) no-repeat center"></widget></code></pre>
* The code below should be placed before closing "</body>" tag:
<pre><code>&lt;script type=&quot;text/javascript&quot;&gt;
    var _scw = _scw || {};
    _scw.id        = '#test-widget';
    _scw.widget_id = 'b601906f-607e-4748-b15e-88dcc9f256d2';
    _scw.icons_prifex = '';

    (function() {
      var scw = document.createElement('script'); scw.type = 'text/javascript'; scw.async = true;
      scw.src = 'http://scw.github.io/scw.github.io/build/strat-check-interactive-widget.min.js';
      var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(scw, s);
    })();
  &lt;/script&gt;</code></pre>
* Options:
  * _scw.id - id element there widget will be rendered
  * _scw.widget_id - id of the data on the server, endpoint: http://api.stratcheck.io/v1/widget/<widget_id>
  * _scw.icons_prifex - adress prefix for the graph assets
