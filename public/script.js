// client-side js, loaded by index.html

const urlSearchApi = "https://special-colossal-muscari.glitch.me/api/v1/countries/search"

$("#country-form").submit((e) => {
  e.preventDefault()

  // Get value to search.
  const queryText = $("form").find('input[name="country"]').val()
  let searchQuery = `query=${queryText}`
  
  const exactMatchSelected = $('#exact-match').prop('checked')
  if (exactMatchSelected) {
    searchQuery = `${searchQuery}&exactmatch`
  }

  // Call search API.
  $.get(
    urlSearchApi,
    searchQuery,
    function (result) {

      // Check for errors.
      if (result.status) {
        // Call succeeded but did not return countries. Existence of status attribute indicates issue.
        displayError(result.message ? result.message : JSON.stringify(result))
        return
      } else {
        $("#error-panel").hide()
      }
      let countries = result
      if (countries.length === 0) {
        displayError("No countries returned")
        return
      }

      // Populate and display template with country values.
      let templateCountries = $("#template-countries").html()
      let compiledTemplateCountries = Handlebars.compile(templateCountries)
      $("#countries-panel").html(compiledTemplateCountries({ array: countries }))

      // Calculate regional count information.
      let regionMap = new Map()
      let subregionMap = new Map()
      countries.forEach(element => {
        incrementMapCount(regionMap, element.region)
        incrementMapCount(subregionMap, element.subregion)          
      })

      // Populate and display template with regional count information.
      let templateRegions = $("#template-regions").html()
      let compiledTemplateRegions = Handlebars.compile(templateRegions)
      // Workaround: Handlebars has limitations with Map — convert to Array.
      let regionArray = Array.from(regionMap, ([name, value]) => ({name, value}))
      let subregionArray = Array.from(subregionMap, ([name, value]) => ({name, value}))
      $("#stat-panel").html(compiledTemplateRegions({ country_count: countries.length , regions: regionArray, subregions: subregionArray }))

      $("#countries-panel").show()
      $("#stat-panel").show()

      // Increment value of given Map key by one.
      function incrementMapCount(map, key) {
        if (map.has(key)) {
          map.set(key, map.get(key) + 1)
        } else {
          map.set(key, 1)
        }
      }
      
      function displayError(message) {
        $("#error-message").text(`Error: ${message}`)
        $("#countries-panel").hide()
        $("#stat-panel").hide()
        $("#error-panel").show()       
      }
    }
  )
})
