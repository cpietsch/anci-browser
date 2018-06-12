const d3 = window.d3 = require('d3')
const dev = true;

const webview = document.querySelector('webview')
webview.addEventListener('dom-ready', () => {
	webview.openDevTools()
	console.log(webview)
})

webview.addEventListener('ipc-message', function (event,label) {
	console.log('progress', event)
	if(event.channel === 'progress'){
		d3.select('#progress').text(event.args[0])
	}
	if(event.channel === 'learn'){
		console.log(event.args[0])
	}
});

d3.select('#download').on('click', () => {
	const label = d3.select('#label').node().value
	webview.getWebContents().send('download', label, this);
})
d3.select('#scroll').on('click', () => {
	webview.getWebContents().send('scroll');
})