const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const rp = require('request-promise');
require("dotenv/config");


//Set Express app to use EJS as the view engine
app.set('view engine', 'ejs');


app.use(express.static("public")); 
app.use(bodyParser.urlencoded({extended: true}));

const PORT = process.env.PORT;
app.listen(PORT, ()=>{
    console.log(`the server is running on port ${PORT}`);
});

function DailyWeather (day, date, icon, description, temperature, tempSymbol, feel_like, humidity, wind_speed) {
  this.day = day;
  this.date = date;
  this.icon = icon;
  this.description = description;
  this.temperature = temperature;
  this.tempSymbol = tempSymbol;
  this.feel_like = feel_like;
  this.humidity = humidity;
  this.wind_speed = wind_speed;
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const today = new Date();
const day = today.getDay();

app.get("/", (req,res)=>{
    res.sendFile(__dirname +"/views/index.html");
});



app.post("/", async (req, res) => {
  const API_KEY = process.env.API_KEY;
  const q = req.body.cityName;
  const city = q.charAt(0).toUpperCase() + q.slice(1);
  const timeSegment = req.body.options;
  const units = req.body.units;
  const tempSymbol = units === "imperial" ? 8457 : 8451;
  const forecastData = [];
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${API_KEY}&units=${units}`;
    const url2 = `https://api.openweathermap.org/data/2.5/forecast?q=${q}&appid=${API_KEY}&units=${units}`;
    // Make the first HTTP request
    const response1 = await rp(url);
    const currentDayWeather = JSON.parse(response1);
    const currentDate = today.toISOString().split('T')[0];
    const imageURL = "http://openweathermap.org/img/wn/"+ currentDayWeather.weather[0].icon +"@4x.png"
    forecastData.push(new DailyWeather(days[day], currentDate, imageURL, currentDayWeather.weather[0].description, currentDayWeather.main.temp, tempSymbol, currentDayWeather.main.feels_like, currentDayWeather.main.humidity, currentDayWeather.wind.speed));  
    // Make the second HTTP request
    const response2 = await rp(url2);
    const weekList = JSON.parse(response2).list;
    var diffDay = day;
    for (let i = 1; i < 5; i++) {
      const tempDay = new Date(today);
      tempDay.setDate(today.getDate() + i);
      var weekDay = tempDay.toISOString().split('T')[0];
      comparDt = weekDay + " " +timeSegment;
      const dayData = weekList.find(element => element.dt_txt === comparDt);
      diffDay += 1;
      if(diffDay === 7){
        diffDay = 0;
      }
      const imageURL = "http://openweathermap.org/img/wn/"+ dayData.weather[0].icon +"@4x.png";
      forecastData.push(new DailyWeather(days[diffDay], weekDay, imageURL, dayData.weather[0].description, dayData.main.temp, tempSymbol,    dayData.main.feels_like, dayData.main.humidity,dayData.wind.speed));  
    }
    res.render("forecast", {city: city, time: timeSegment, unit: units, list: forecastData});
  } catch (error) {
    console.error(error.message);
    res.render("error", {city: city});
  }
});