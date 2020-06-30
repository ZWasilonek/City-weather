import {OpenWeatherMap} from './open-weather.js'

const $body = document.querySelector('body');
let $btnsClose = document.querySelectorAll('.btn-remove-module');
const btnShowForm = document.querySelector('#add-city');
const addForm = document.querySelector('.module__form');

let cityNameInput = document.querySelector('#search');

//MAIN WEATHER MODULE
const weatherModule = document.querySelector('.module__weather');
const $cityName = document.querySelector('.city__name');
const $pressure = document.querySelector('.pressure__value');
const $humidity = document.querySelector('.humidity__value');
const $windSpeed = document.querySelector('.wind-speed__value');
const $temperature = document.querySelector('.temperature__value');
const $weatherIcon = document.querySelector('.weather__icon').firstChild;

//FORECAST WEATHER MODULE SECTION
const $daysContent = document.querySelectorAll('.day-content');

let status = false;  
(async () => { 
    try {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position)=>{
                const lat  = position.coords.latitude;
                const long = position.coords.longitude;
                getWeekForecast(lat, long)
            });
        }
        status = true;
    } catch (error) {
        console.error(error);
    }
})();

(async () => {
    let isHidden = weatherModule.hasAttribute('hidden');
    if (isHidden) weatherModule.removeAttribute('hidden');
})(loadingPage());

function loadingPage() {
    setTimeout(() => {
        $body.classList.remove('loading');
    }, 700)
}

let weather = new OpenWeatherMap();

function getWeekForecast(lat, lon) {
    weather.getWeekForecastByGeoCoordinates(lat, lon, (weekWeather, err)=>{
        if(err.status !== '200'){
            console.error(err.status);
        }else{
            // setCurrentWeather(weekWeather);
            let arr = getDayWeatherArray(weekWeather);
            setWeatherModule(arr);
        }
    })
}

function setWeatherModule(weatherDaysArray) {
    setMainWeatherModule(weatherDaysArray[0]);
    let [ ,...restDays] = weatherDaysArray; 
    setForcastForNextDays(restDays);
}

function setMainWeatherModule(currentDayWeather) {
    $cityName.innerHTML = currentDayWeather.city;
    $pressure.innerHTML = currentDayWeather.pressure;
    $humidity.innerHTML = currentDayWeather.humidity;
    $windSpeed.innerHTML = currentDayWeather.windSpeed;
    $temperature.innerHTML = currentDayWeather.temp;
    $weatherIcon.src = currentDayWeather.icon;
}

function setForcastForNextDays(weatherDaysArray) {
    function setDOMItem(items) {
        for (let i=0; i<items.length; i++) {
            let item = items[i];
            item.querySelector('.day').innerHTML = weatherDaysArray[i].day;
            item.querySelector('img').src = weatherDaysArray[i].icon;
            item.querySelector('.temperature__value').innerHTML = weatherDaysArray[i].temp
        }
    }
    setDOMItem($daysContent);
}

function getDayWeatherArray(weatherForecastList) {
    let weatherDaysArray = new Array();

    const currentDate = setCurrentDate(weatherForecastList);
    const cityName = weatherForecastList.city.name;
    let currentWeather;

    let dayNumbers = 7;
    for (let i=0; i<dayNumbers; i++) {
        let nextDay;
        let currentDayNum;
        let currentDateObj;

        if(i===0){
            currentDayNum = currentDate.getDay();
            currentDateObj = currentDate;
            currentWeather = weatherForecastList.list[0]
        } else {
            /* Hour(15:00:00) is the forecast time the next day */
            nextDay = addDays(currentDate, i);
            currentWeather = getDayIndexByDateAndHour(nextDay, '15:00:00', weatherForecastList);
            currentDateObj = new Date(nextDay);
            currentDayNum = currentDateObj.getDay();
        }

        let {pressure} = currentWeather.main;
        let {humidity} = currentWeather.main;
        let {speed} = currentWeather.wind;
        let {temp} = currentWeather.main;
        let {id} = currentWeather.weather[0];
        let dayName = convertDayNumToDayName(currentDayNum);
        weatherDaysArray.push(new DayWeather(i,dayName,currentDateObj,cityName,pressure,humidity,speed,temp,id));
    }
    return weatherDaysArray;
}

class DayWeather {
    constructor(index, day, date, city, pressure, humidity, windSpeed, temp, iconId) {
        this.index = index;
        this.day = day;
        this.date = date;
        this.city = city;
        this.pressure = pressure;
        this.humidity = humidity;
        this.windSpeed = windSpeed;
        this.temp = Math.floor(temp);
        this.icon = this.setIcon(iconId);
    }
    setIcon(iconId) {
        let id = String(iconId);
        const dirIcon = 'images/icons';
        if (id.startsWith('2')) {
            return this.icon = `${dirIcon}/thunderstorm.svg`;
        } else if (id.startsWith('3') || id.startsWith('5')) {
            return this.icon = `${dirIcon}/rain.svg`;
        } else if (id.startsWith('6')) {
            return this.icon = `${dirIcon}/snow.svg`
        } else if (id.startsWith('7')) {
            return this.icon = `${dirIcon}/fog.svg`
        } else if (id === '800') {
            return this.icon = `${dirIcon}/clear-day.svg`
        } else if (id.startsWith('8')) {
            return this.icon = `${dirIcon}/cloudy.svg`
        }
    }
    // https://openweathermap.org/weather-conditions
}

function getDayIndexByDateAndHour(date, hour, weatherForecast) {
    let formattedDate = formattDateWithHour(date, hour);
    let currentWeather;
    let historyForecast = weatherForecast.list
    for (let i=1; i<historyForecast.length; i++) {
        currentWeather = historyForecast[i];
        let {dt_txt} = currentWeather;
        if(dt_txt === formattedDate) {
            currentWeather = weatherForecast.list[i];
            break;
        }
    }
    return currentWeather;
}

function convertDayNumToDayName(dayNum) {
    switch(dayNum) {
        case 0:
            return 'Niedziela';
        case 1: 
            return 'Poniedziałek';
        case 2: 
            return 'Wtorek';
        case 3:
            return 'Środa';
        case 4:
            return 'Czwartek';
        case 5:
            return 'Piątek';
        case 6:
            return 'Sobota';
    }
}

//TIME FUNCTIONS
function setCurrentDate(weatherForecast) {
    let currentWeather = weatherForecast.list[0];
    let {dt_txt} = currentWeather;
    const currentDate = new Date(dt_txt);
    return currentDate;
}

function addDays(date, days) {
    const copy = new Date(Number(date))
    copy.setDate(date.getDate() + days)
    return formatDate(copy);
}

function formatDate(date) {
    return date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

function formattDateWithHour(date, hour) {
    return date.replace(/\d{2}:\d{2}:\d{2}/, hour);
}


//SHOW ADDING FORM
btnShowForm.addEventListener('click', function() {
    showAddForm();
})

function showAddForm() {
    cityNameInput.style.background = 'white';
    cityNameInput.value = '';
    cityNameInput.placeholder = 'np. Wrocław';

    let isHidden = addForm.hasAttribute('hidden');
    if (isHidden) addForm.removeAttribute('hidden');
    else addForm.setAttribute('hidden', true);
}

//ADDING THE NEW MODULE
function getWeatherByCityName(cityName) {
    $body.className += 'loading';
    weather.getWeekForecastByCityName(cityName, (weatherForecastList, error)=> {
        if (error.status !== '200') {
            console.error(error.status);
            setNotFoundError();
        } else {
            // weatherModule.parentNode.appendChild(newModule);
            // $btnsClose = document.querySelectorAll('.btn-remove-module');
            // console.log('z metody',$btnsClose)
            let newModule = weatherModule.cloneNode(true);
            document.querySelector('#app').appendChild(newModule);
            let arr = getDayWeatherArray(weatherForecastList);
            setWeatherModule(arr);
            $body.classList.remove('loading');
            showAddForm();
        }
    })
    loadingPage()
};

const form = document.querySelector('.find-city');
form.addEventListener('submit', function() {
    event.preventDefault();
    let city = cityNameInput.value;
    if (validate(city)) {
        getWeatherByCityName(city);
    }
})

//VALIDATION ADD
function validate(cityValue) {
    let cityName = cityValue.trim();
    if (cityName === '' || cityName === null) {
        cityNameInput.style.background = '#ffe0b3';
        cityNameInput.value = '';
        cityNameInput.placeholder = 'pole nie może być puste';
        return false;
    }
    if (cityName.match(/^\d+$/)) {
        cityNameInput.style.background = '#ffe0b3';
        cityNameInput.value = '';
        cityNameInput.placeholder = 'nie ma takiego miasta';
        return false;
    }
    return true;
}

function setNotFoundError() {
    cityNameInput.style.background = '#ffe0b3';
    cityNameInput.value = '';
    cityNameInput.placeholder = 'nie ma takiego miasta';
}

// console.log($btnsClose)
//REMOVE MODULE
$btnsClose.forEach(btn => {
    btn.removeEventListener("click", (ev) => {
        ev.target.parentElement.parentElement.remove()
    })
})