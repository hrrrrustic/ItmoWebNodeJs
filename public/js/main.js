let config = new Configuration();
let cardContainer;
let helperTemplate;
let cardTemplate;
let mainCityTemplate;

function OnDuplicate(){
    alert("Такой город уже есть!")
}

function OnInvalid(){
    alert("Такого города нет!")
}

window.onload = function(){
    document.querySelector(".geo-button").addEventListener("click", RefreshGeo);
    document.querySelector(".add-button").addEventListener("click", async () => {
        let inputebox = document.querySelector(".new-city-input")
        let cityName = inputebox.value
        inputebox.value = ""
        let added = await AddToFavorites(cityName, OnDuplicate, OnInvalid)
        if(added){
            await FetchCityByName(cityName)
        }
    })

    document.querySelector(".new-city-add-area").addEventListener("submit", function(event) {
        event.preventDefault()
        document.querySelector(".add-button").click()
        document.querySelector(".new-city-input").value = ""
    })

    let removeButtons = document.querySelectorAll(".remove-button");
    removeButtons.forEach(function(elem){
        elem.addEventListener("click", RemoveCard)
    })

    cardContainer = document.querySelector(".city-cards-container")
    helperTemplate = document.querySelector("#helper-template")
    cardTemplate = document.querySelector("#city-card-template")
    mainCityTemplate = document.querySelector("#main-city-template")
    RefreshGeo()
    LoadFavorites()
}

async function AddToFavorites(cityName, duplicate, invalid){
    let url = config.BaseApiUrl + "favorites"
    let result = await fetch(url, {body: JSON.stringify({city: cityName}), headers: {'Content-Type' : 'application/json'}, method: 'POST'})
    if(result.status === 409){
        duplicate()
        return false
    }
    
    if(result.status === 400){
        invalid()
        return false
    }

    return true
}

async function LoadFavorites(){
    let savedCities = await fetch(config.BaseApiUrl + "favorites").then(x => x.json())
    if(savedCities){
        savedCities.forEach((item) => FetchCityByName(item.name))
    }
}

async function RemoveCard(item){
    let cityName;
    var card = item.currentTarget
    while(!card.classList.contains("city-card")){
        if(card.className == "city-card-header"){
            cityName = card.querySelector("h3").innerText
        }
        card = card.parentNode
    }
    let fetchBody = JSON.stringify({city: cityName})
    let response = await fetch(config.BaseApiUrl + "favorites", {method: 'DELETE', body: fetchBody, headers: {'Content-Type' : 'application/json'}})
    cardContainer.removeChild(card)
}

async function FetchCityByName(cityName){
    let loader = GetLoader(cityName)
    loader.querySelector('h3').textContent = cityName
    cardContainer.appendChild(loader)
    let apiUrl = config.BaseApiUrl + "weather?city=" + cityName
    let response = await fetch(apiUrl)
    if(response.status === 404){
        cardContainer.removeChild(loader)
        throw new Error("Invalid city")
    }
    let card;
    try{
        card = GetCityCardFromJson(await response.json())
    }
    catch{
        card = GetErrorCard(cityName)
    }

    card.querySelector(".remove-button").addEventListener("click", RemoveCard)
    loader.replaceWith(card)
}

function GetCityCardFromJson(jsonValue){
    let newCard = cardTemplate.content.cloneNode(true).querySelector(".city-card")
    newCard.querySelector("h3").textContent = jsonValue.name
    newCard.querySelector(".tempareture-font-color").textContent = jsonValue.temp
    let properties = newCard.querySelectorAll(".weather-property li");
    SetValues(properties, newCard.querySelector(".city-card-header img"), jsonValue)
    return newCard
}

function RefreshGeo(){
    navigator.geolocation.getCurrentPosition(
        function(geolocation){
            let lat = geolocation.coords.latitude
            let lon = geolocation.coords.longitude
            let url = config.BaseApiUrl + "weather/" + "?lat=" + lat + "&lon=" + lon
            console.log(url)
            RefreshMainCity(url)
        },
        function(geolocation){
            let url = config.BaseApiUrl + "?city=Moscow"
            RefreshMainCity(url)
        }
    )
}

async function RefreshMainCity(fetchurl){
    await fetch(fetchurl)
        .then(x => x.json())
        .then(x => {
            let loader = document.querySelector(".loader")
            if(loader){
                loader.replaceWith(GetMainCity(x))
            }
            else{
                document.querySelector(".current-city-card").replaceWith(GetMainCity(x))
            }
        })
        .catch(x =>{
            let error = GetMainCardError()
            let loader = document.querySelector(".loader")
            if(loader){
                loader.replaceWith(error)
            }
            else{
                document.querySelector(".current-city-card").replaceWith(error)
            }
        })
}

function SetValues(properties, icon, jsonValue){
    properties[0].querySelector(".property-value").textContent = jsonValue.wind + " m/s"
    properties[1].querySelector(".property-value").textContent = jsonValue.pressure + " hpa"
    properties[2].querySelector(".property-value").textContent = jsonValue.humidity + "%"
    properties[3].querySelector(".property-value").textContent = "[" + jsonValue.lon + ", " + jsonValue.lat + "]"
    icon.src = jsonValue.icon
}

function GetTemp(json){
    return Math.round(json.main.temp) - 273 + " ℃"
}

function GetLoader(cityName){
    return GetHelpCard(cityName, "Данные загружаются...")
}

function GetErrorCard(cityName){
    return GetHelpCard(cityName, "Произошла ошибка")
}

function GetHelpCard(cityName, text){
    let help = helperTemplate.content.cloneNode(true).querySelector(".city-card")
    help.querySelector('h3').textContent = cityName
    help.querySelector("p").textContent = text
    return help
}

function GetMainCardError(){
    let error = GetErrorCard()
    let button = error.querySelector("button")
    button.parentNode.removeChild(button)
    return error
}

function GetMainCity(jsonValue){
    let mainInfo = mainCityTemplate.content.cloneNode(true).querySelector(".current-city-card")
    mainInfo.querySelector("h2").textContent = jsonValue.name
    mainInfo.querySelector(".tempareture-font-color").textContent = jsonValue.temp
    SetValues(mainInfo.querySelectorAll(".current-weather-property li"), mainInfo.querySelector(".current-city-weather img"), jsonValue)
    return mainInfo
}