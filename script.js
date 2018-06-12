// christopher pietsch
// cpietsch@gmail.com

var _setImmediate = setImmediate;
process.once('loaded', function() {
  global.setImmediate = _setImmediate;
});

const http = require('http')
const fs = require('fs')
const crypto = require('crypto')
const request = require('request')
var ipcRenderer = require('electron').ipcRenderer;
const {dialog} = require('electron').remote
const upath = require('path');
const { predict } = require('./tf/tf.js');

// const image = new Image()

document.addEventListener("DOMContentLoaded", function(event) {
   
    const d3 = window.d3 = require('d3')

    setTimeout( () => {
    	// scrollDown()
    	makeSelectable()
    	// predictAll()
    }, 2000)
});


document.addEventListener("scroll", debounce(400, makeSelectable))


ipcRenderer.on('download', function (event,label) {
	// ipcRenderer.sendToHost('progress', 'test')
    downloadContent(label);
});
ipcRenderer.on('scroll', function (event,store) {
    // scrollDown();
    predictAll();
});

function debounce(delay, callback) {
    var timeout = null;
    return function () {
        //
        // if a timeout has been registered before then
        // cancel it so that we can setup a fresh timeout
        //
        if (timeout) {
            clearTimeout(timeout);
        }
        var args = arguments;
        timeout = setTimeout(function () {
            callback.apply(null, args);
            timeout = null;
        }, delay);
    };
}

function scrollDown(){
	window.scrollTo(0,50000)
	makeSelectable();
	console.log('scrollDown')
}

const toDataURL = url => fetch(url)
  .then(response => response.blob())
  .then(blob => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  }))

async function downloadContent(label = ''){
	const folder = dialog.showOpenDialog({properties: ['openDirectory', 'createDirectory']})
	if(!folder) return
	const searchTerm = d3.select("#lst-ib").attr("value")
	console.log(searchTerm)
	const links = getLinks()
	console.log(links)

	if(searchTerm !== "" && links.length){
		ipcRenderer.sendToHost('progress', 'preparing')
		const path = folder + '/' + label + '-' + (+new Date()) + '_' + searchTerm.replace(/ /g, '-')
		fs.mkdirSync(path);
		const t = await downloadThumbs(links, path)
		const i = await downloadImages(links, path)
		const data = { label, searchTerm, path, links }
		fs.writeFileSync(path + '/data.json', JSON.stringify(data), 'utf8')
		console.log('done', data)
		ipcRenderer.sendToHost('progress', 'DONE')
	} else {
		ipcRenderer.sendToHost('progress', 'no images found')
	}
}

function timeout () {
    return new Promise(resolve => window.requestAnimationFrame(resolve))
}

const toDataBlob = url => fetch(url)
  .then( response => response.blob())
  .then(blob => {
      return window.URL.createObjectURL( blob )
  })

function loadSprite(src) {
	return new Promise(resolve => {
		var sprite = new Image();
		sprite.onload = () => { resolve(sprite) };
		sprite.src = src;
	})
}

async function predictAll() {
	const images = []
	d3.selectAll('#isr_mc .rg_l').each(function() {
		images.push(this)
	})
	// let i = 0
	for(let container of images){
	  // if(++i > 10) return
	  const selection = d3.select(container)
	  let img = selection.select('img').node()
	  if(img.src.substring(0,10) != "data:image"){
	  	const url = await toDataBlob(img.src)
	  	img = await loadSprite(url)
	  }
	  console.log(img)
	  const prediction = await predict(img)
	  // const data = selection.data()
	  selection
	  	.style('opacity', prediction ? 0.2 : 1)
	  	.datum({ deactive: prediction })
	  console.log(prediction)
	  await timeout()
	}
}

function makeSelectable(){
	console.log('makeSelectable')
	d3.selectAll('#isr_mc .rg_l')
	    .on("contextmenu", function (d, i) {
	        d3.event.preventDefault();
	        const elem = d3.select(this)
	        const deactive = d ? !d.deactive : true
	        const img = elem.select('img')
	        // const data = learnImage(img.node())
	        // ipcRenderer.sendToHost('learn', img.node())
	        // console.log(data)
	        d3.select(this)
	          .style('opacity', deactive ? 0.2 : 1)
	          .datum({ deactive }) 
	    })
}

function getLinks(){
	return d3.selectAll('#isr_mc .rg_l')
		.style('border', '2px solid')
		.each((d, i, elm) => {
			const self = d3.select(elm[i])
			const ref = self.attr('href')
			const deactive = d ? d.deactive : false
			const thumb = self.select('img').attr('data-src') || self.select('img').attr('src')
			const url = new URL('http://google.de' + ref)
			// const img = url.searchParams.get('imgurl')
			const link = url.searchParams.get('imgrefurl')
			const meta = JSON.parse(d3.select(elm[i].parentNode).select('.rg_meta').text())
			const img = meta.ou
			const title = meta.pt || ""
			console.log(img, meta)
			const id = crypto.createHash('md5').update(img || i).digest("hex")

			self.datum({
				id,
				title,
				link,
				img,
				thumb,
				meta,
				deactive
			})
		})
		.data()
		.filter(d => d.link && d.img && !d.deactive)
}

async function downloadThumbs(links, path, i=0) {
	const link = links[i]
	if(!link) return links
	const filename = link.id + '-thumb.png'
	const thumbfile = await saveThumb(filename, path, link.thumb)
	link.thumb = thumbfile
	return await downloadThumbs(links, path, ++i)
}

window.downloadContent = downloadContent

function saveThumb(filename, path, payload){
	// console.log(imgurl, payload, filename)
	return new Promise(resolve => {
		if (payload.substring(0,10) === "data:image") {
			const base64 = payload.replace(/^data:image\/(png|jpg|jpeg);base64,/, '')
			fs.writeFileSync(path + '/' + filename, base64, 'base64')
			resolve(filename)
		} else {
			toDataURL(payload).then(dataUrl => {
				// console.log(dataUrl.substring(0,22))
				fs.writeFileSync(path + '/' + filename, dataUrl.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''), 'base64')
				resolve(filename)
			})
		}
	})
}
window.saveThumb = saveThumb


async function downloadImages(links, path) {
	let i = 0
	for(const link of links){
		// if(i < 10)
		try {
			link.imgfile = await saveImage(link.id, path, link.img)
		} catch (e) {
			console.log('error', e)
			link.imgfile = ''
		}
		i++
		const msg = (i+1) + ' of ' + (links.length-1);
		console.log(msg)
		ipcRenderer.sendToHost('progress', msg)
	}
	return links
}

function saveImage(id, path, url){
	console.log(id, url)
	return new Promise((resolve, reject) => {
		// request.head(url, function(err, res, body){
		// 	const type = res.headers['content-type']
		//     console.log('content-type:', type);
		//     console.log('content-length:', res.headers['content-length']);
		//     const ts = type.split('/')
		//     const filename = id + '-image.' + ts.length ? ts[1] : 'png'
			const filename = id + '-image.png'
		    request({
		        url: url,
		        method: 'GET',
		        headers : {
		            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36'
		        }
		    })
		    .pipe(fs.createWriteStream(path + '/' + filename))
		    .on('close', () => resolve(filename))
		    .on('error', (err) => reject(err))
		// })
	})
	
}
window.saveThumb = saveThumb

// function saveBase64(payload, filename) {
// 	if (payload.substring(0,22) === "data:image/jpeg;base64") {
// 		const base64 = payload.replace(/^data:image\/jpeg;base64,/, "")
// 		fs.writeFileSync(filename, base64, 'base64')
// 		resolve(filename)
// 	} else {
// }

// toDataURL('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfPlGJz-ts2SxR4GfILVtNw0jj5pQQ9teen3LSi0st-vWCnNXa')
//   .then(dataUrl => {
//     console.log('RESULT:', dataUrl)
//   })