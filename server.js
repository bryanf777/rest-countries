const express = require("express")
const app = express()

const COUNTRY_CODE_CALL = 1
const COUNTRY_NAME_CALL = 2

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"))

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html")
})

app.get("/searchcountries", async (request, response) => {
  let queryString = request.query
  // console.log(request.query)
  // console.log("queryString:", queryString)
  
  // If no search string, return error.
  if (!queryString.hasOwnProperty("search")) {
    response.set('Content-Type', 'application/json')
    return response.status(422).send({"status":422, "errorCode":100, "message":"No search parameter."})
  }
  
  // If no search string in search parameter, return error.
  if (queryString.hasOwnProperty("search") && queryString.search.length === 0) {
    response.set('Content-Type', 'application/json')
    return response.status(422).send({"status":422, "errorCode":101, "message":"Empty search string given."})
  }
  
  let querySearchValue = queryString.search
  
  // Regular expression for two and three character country codes.
  let iso3166CodeRegularExpression = /^[A-Za-z]{2,3}$/
  let isCountryCodeCall = iso3166CodeRegularExpression.exec(querySearchValue)
  
  makeCountryApiCall(isCountryCodeCall ? "https://restcountries.eu/rest/v2/alpha/" : "https://restcountries.eu/rest/v2/name/", encodeURIComponent(querySearchValue))
    .then((result) => {
      return response.json(result)
    })
    .catch((error) => {
      return response.status(500).send({"status":500, "errorCode":102, "message":error})
    })
  
})


function makeCountryApiCall(apiCall, searchString) {

  return new Promise((resolve, reject) => {

    const http = require("https")
  
    // Field names to get.
    let fieldNamesToGet = 'fields=name;alpha2Code;alpha3Code;flag;region;subregion;population;languages'

    let options = {
      host: 'restcountries.eu',
      path: `${apiCall}${searchString}?${fieldNamesToGet}`
    }
  
    let req = http.get(options, function(res) {
      // Buffer the body entirely for processing as a whole.
      let bodyChunks = []
      res.on('data', function(chunk) {
        bodyChunks.push(chunk)
      }).on('end', function() {
        let body = JSON.parse(Buffer.concat(bodyChunks))
        if (Array.isArray(body)) {
          body.sort((a,b) => {
            return b.population - a.population;
          })      
        }
        resolve(body)
      })
    })

    req.on('error', function(e) {
      console.log('ERROR: ' + e.message)
      reject(e.message)
    })
  })

}


// Listen for requests.
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port)
})
