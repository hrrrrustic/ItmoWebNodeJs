let appId = "9657e46201003683ec17fe3273facbce"
let baseApiUrl = "https://api.openweathermap.org/data/2.5/weather"
function GetUrlWithCityName(name)
{
    return baseApiUrl + AppendAppId(`?q=${name}`) + "&lang=ru"
}

function GetUrlWithCoordinates(lat, lon)
{
    return baseApiUrl + AppendAppId(`?lon=${lon}&lat=${lat}`) + "&lang=ru"
}

function AppendAppId(url)
{
    return url + `&appId=${appId}`
}

module.exports = {
    GetUrlWithCityName: GetUrlWithCityName,
    GetUrlWithCoordinates: GetUrlWithCoordinates
}