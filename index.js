let express = require("express")
let pg = require("pg");
let fetch = require("node-fetch")
let bodyParser = require("body-parser")
const { GetUrlWithCityName, GetUrlWithCoordinates } = require("./public/js/UrlHelper");
let app = express()
app.use(express.static('public'))
let port = 5000;
let pool = new pg.Pool({
    user: "postgres",
    host: "localhost",
    database: "weather",
    password: "lolilop67",
    port: 5432
})
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
function ParseDataToOwnJson(apiJson)
{
    return {
        name: apiJson.name,
        wind : apiJson.wind.speed,
        temp : 5,
        pressure : apiJson.main.pressure,
        humidity : apiJson.main.humidity,
        lat : apiJson.coord.lat,
        lon : apiJson.coord.lon,
        icon: 'https://api.openweathermap.org/img/w/' + apiJson.weather[0].icon + '.png'
    }
}

async function GetData(url){
    url = encodeURI(url)
    return await fetch(url)
}
async function FetchFromApi(url, response){
    let answer = await GetData(url)
    if(answer.status === 404){
        response.status(404).send("invalid input")
    }

    if(answer.status.ok === false){
        response.status(answer.status).send("error")
    }
    let json = await answer.json()
    response.status(200).json(ParseDataToOwnJson(json))
}

app.get('/', function(req, res){
    res.redirect("/index.html")
})

app.get('/weather', async function(req, res){
    let cityName = req.query.city
    if(cityName){
        await FetchFromApi(GetUrlWithCityName(cityName), res)
    }
    else{
        let lat = req.query.lat
        let lon = req.query.lon
        await FetchFromApi(GetUrlWithCoordinates(lat, lon), res)
    }
})

app.get('/favorites', function(req, res){
    pool.query('SELECT name FROM favorite_city', (error, result) =>{
        res.status(200).json(result.rows)
    })
})

app.post('/favorites', async function(req, res){
    let cityName = req.body.city.toLowerCase()
    let notExist = (await GetData(GetUrlWithCityName(cityName))).status === 404
    if(notExist === true){
        res.status(400).send("Invalid city")
        return
    }

    pool.query('INSERT INTO favorite_city (name) VALUES ($1)', [cityName], (error, result) => {
        if(error){
            res.status(409).json({error: "Duplicate city"})
            return
        }
        res.status(200).json(result.rows)
    })
})

app.delete("/favorites", function(req, res) {
    let cityName = req.body.city.toLowerCase()
    pool.query('DELETE FROM favorite_city WHERE name = $1', [cityName], (error, result) => {
        if(error){
            console.log(error)
        }
        res.status(200).json(result.rows)
    })
})

app.listen(port, () => console.log(`Started at ${port}`))