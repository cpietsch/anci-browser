let Promise = require('bluebird')
let fetch = require('node-fetch');

const apikey = 'AIzaSyC214Qoy9yIOf6ClpM7etNVMBrdKaasr3o'

const serialize = (obj) => (Object.entries(obj).map(i => [i[0], encodeURIComponent(i[1])].join('=')).join('&'))

function visionRequest (url) {

  const body = {
    requests:[
      {
        image: {
          source: {
            imageUri: url
          }
        },
        features:[
          {
            type:'WEB_DETECTION',
            maxResults:100
          }
        ]
      }
    ]
  }

  return fetch('https://vision.googleapis.com/v1/images:annotate?key=' + apikey,
    {
        method: 'POST',
        headers: myHeaders,
        mode: 'cors',
        cache: 'default',
        body: JSON.stringify(body)
    }
  )
  .then(res => res.json())
}


function ajaxFetch (params, items) {
  const url = 'https://content.googleapis.com/customsearch/v1?'

  return fetch(
    url + serialize(params),
    {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
        mode: 'cors',
        cache: 'default'
    }
  )
  .then(res => res.json())
}

exports.visionRequest = visionRequest

async function downloadItemImages (item) {
  const { thumburl, imageurl } = item
  const thumbfile = await downloadImage(thumburl)
  const imagefile = await downloadImage(imageurl)
  return { thumbfile, imagefile }
}

function downloadImage (url){
  return new Promise(resolve, reject){

    const type = basename(url).type
    const filePath = 'images/' + md5(url) + '.' + type
    const duplicate = fs.isFile(filePath)
    if(duplicate) resolve(path)
    // fs.saveFile...
    resolve(path)
  }
}
