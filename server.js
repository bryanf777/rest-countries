const express = require("express")
const app = express()

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"))

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html")
})

app.get("/api/v1/countries/search", (request, response) => {
  let queryString = request.query
  
  // If no query parameter, return error.
  if (!queryString.hasOwnProperty("query")) {
    response.set('Content-Type', 'application/json')
    return response.status(422).send({"status":422, "errorCode":100, "message":"No query parameter."})
  }
  
  // If no query value given, return error.
  if (queryString.hasOwnProperty("query") && queryString.query.length === 0) {
    response.set('Content-Type', 'application/json')
    return response.status(422).send({"status":422, "errorCode":101, "message":"Empty query string given."})
  }
  
  let queryValue = queryString.query
  
  // Regular expression for two and three character country codes.
  let iso3166CodeRegularExpression = /^[A-Za-z]{2,3}$/

  // If query string is two or three alpha characters, do country code lookup.
  let isCountryCodeCall = iso3166CodeRegularExpression.exec(queryValue)
  
  // Do search.
  const searchByCodeEndpoint = "/rest/v2/alpha/"
  const searchByNameEndpoint = "/rest/v2/name/"
  makeCountryApiCall(isCountryCodeCall ? searchByCodeEndpoint : searchByNameEndpoint, encodeURIComponent(queryValue))
    .then((result) => {
      return response.json(result)
    })
    .catch((error) => {
      return response.status(500).send({"status":500, "errorCode":102, "message":error})
    })

})


function makeCountryApiCall(apiCall, queryString) {

  return new Promise((resolve, reject) => {

    const http = require("https")
  
    // See https://restcountries.eu/#filter-response for details.
    let fieldNamesToGet = "fields=name;alpha2Code;alpha3Code;flag;region;subregion;population;languages"

    let options = {
      host: "restcountries.eu",
      path: `${apiCall}${queryString}?${fieldNamesToGet}`
    }
  
    let req = http.get(options, function(res) {
      
      // Buffer the body entirely for processing as a whole.
      let bodyChunks = []
      res.on("data", function(chunk) {
        bodyChunks.push(chunk)
      }).on("end", function() {
        let body = JSON.parse(Buffer.concat(bodyChunks))

        // If API call is not successful, return result now.
        if (res.statusCode != 200) {
          resolve(body)
        }

        // Put together JSON return result.
        if (Array.isArray(body)) {
          // More than one result, so sort in decending order by population.
          body.sort((a,b) => {
            return b.population - a.population
          })  
        } else {
          // Make single object into array for consistency.
          body = [body] 
        }
        resolve(body)
      })
    }).on("error", function(e) {
      console.log(`Error: ${e.message}`)
      reject(e.message)
    })
    
  })
}


// Listen for requests.
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port)
})
