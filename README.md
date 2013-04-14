# Lorentz.js

**Watches for client side file changes and reloads the browser.**

```
    npm install lorentz
```

Server side.

```
	var lorentz = require('lorentz')
	lorentz.liveReload(__dirname, port) // defaults to 8081
```

Client-side.

```javascript
	<script src="http://localhost:8081/lorentz.js"></script>
```

Specify the files you want to watch in a .lorentzwatch file.

```
	public/
	app.js
	index.html
```
