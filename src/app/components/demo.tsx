import React from 'react'
import MainCard from './mainCard';

let jsonData: any;
let idLocation: Array<string>;
let idCategoryPav: Array<string>;
let idCategoryDC: Array<string>;
let idDay: Array<string>;
idLocation = [ // location
  "61df4a34d5507a00103ee41e", // pav 0 
  "628672b52903a50010fa751e"  // dc 1 
];
idCategoryPav = [ // category
  '61bd80d68b34640010e194b8', // Breakfast 0
  '61bd80d05f2f930010bb6a81', // Lunch 1
  '61bd80cc5f2f930010bb6a80'  // Dinner 2
];
idCategoryDC = [ // category
  '64b6fe23e615eb39f2b65a5e', // Lunch 0
  '64b6fe4de615eb39f2b65e9f', // Dinner 1 
  '63320eb6007b6b0010480cad'  // Late Night 2 
];
idDay = [ // also known as menu group
  '61bd808b5f2f930010bb6a7a', // sun 0
  '61bd80908b34640010e194b3', // mon 1
  '61bd80ab5f2f930010bb6a7d', // tues 2
  '61bd80b08b34640010e194b4', // wed 3
  '61bd80b55f2f930010bb6a7e', // thur 4
  '61bd80ba5f2f930010bb6a7f', // fri 5
  '61bd80bf8b34640010e194b6'  // sat 6
];
function pavMenuGroupTime() {
  let m :string;
  let w = new Date();
  w.setHours(0,0,0,0);
  let i = Math.floor(w.getTime() / 1000) // current day
  //i+=25200;//7am
  //i+=37800; // The Pavilion will close (10:30). The Dining Center will open (10:30);
  //i+=39600; // 11am
  //i+=54000; //3pm
  //i+=57600 // 4pm
  //i+=75600 //9pm

  let dateTime = new Date();
  const utcOffset = -7;
  dateTime = new Date(dateTime.getTime() + utcOffset * 60 * 60 * 1000);
  let day = dateTime.getUTCDay();  // UTC day
  let hour = dateTime.getUTCHours();  // UTC hour
  let minute = dateTime.getUTCMinutes(); 

  if(day >= 1 && day <= 5){ // on weekdays
    if (hour < 7){
      i+=25200;
      m = (`Pavilion will open <t:${i}:R>`);
    }
    else if ((hour < 10) || (hour <= 10 && minute < 30)){
      i+=37800;
      m = (`Pavilion will close <t:${i}:R>`);
    }
    else if (hour < 11){
      i+=39600;
      m = (`Pavilion will open <t:${i}:R>`);
    }
    else if (hour < 15){
      i+=54000;
      m = (`Pavilion will close <t:${i}:R>`);
    }
    else if (hour < 16){
      i+=57600;
      m = (`Pavilion will open <t:${i}:R>`);
    }
    else if (hour < 21){
      i+=75600;
      m = (`Pavilion will close <t:${i}:R>`);
    }
    else {
      m = (`Pavilion is closed`);
    }
  }
  else {
    if (hour < 9){
      i+=32400;
      m = (`Pavilion will open <t:${i}:R>`);
    }
    else if (hour <= 10 && minute < 30){
      i+=37800;
      m = (`Pavilion will close <t:${i}:R>`);
    }
    else if (hour < 11){
      i+=39600;
      m = (`Pavilion will open <t:${i}:R>`);
    }
    else if (hour < 15){
      i+=54000;
      m = (`Pavilion will close <t:${i}:R>`);
    }
    else if (hour < 16){
      i+=57600;
      m = (`Pavilion will open <t:${i}:R>`);
    }
    else if (hour < 21){
      i+=75600;
      m = (`Pavilion will close <t:${i}:R>`);
    }
    else {
      m = (`Pavilion is closed`);
    }
  }
  return m;
}
function dcMenuGroupTime() {
  let m : string;
  let w = new Date();
  w.setHours(0,0,0,0);
  let i = Math.floor(w.getTime() / 1000) // current day at time 0
  let dateTime = new Date();
  const utcOffset = -7;
  dateTime = new Date(dateTime.getTime() + utcOffset * 60 * 60 * 1000);
  let day = dateTime.getUTCDay();  // UTC day
  let hour = dateTime.getUTCHours();  // UTC hour
  let minute = dateTime.getUTCMinutes(); 
  // 10:30 to 2pm, 3pm to 8pm, 9pm to 12am
  if(day >= 1 && day <= 5){
    if ((hour < 10) || (hour <= 10 && minute < 30)){
      i+=37800;
      m = (`Dining Center will open <t:${i}:R>`);
    }
    else if (hour < 14){
      i+=50400;
      m = (`Dining Center will close <t:${i}:R>`);
    }
    else if (hour < 15){
      i+=54000;
      m = (`Dining Center will open <t:${i}:R>`);
    }
    else if (hour < 20){
      i+=72000;
      m = (`Dining Center will close <t:${i}:R>`);
    }
    else if (hour < 21){
      i+=75600;
      m = (`Dining Center will open <t:${i}:R>`);
    }
    else if (hour < 24){
      i+=86400;
      m = (`Dining Center will close <t:${i}:R>`);
    }
    else{
      m = (`Dining Center is closed`);
    }
  }
  else{
    m = "Dining Center is closed on weekends";
  }
  return m;
}
function formatTimePAV(dateTime = new Date()){
  let m = [0,0]; // day, category
  const utcOffset = -7;
  dateTime = new Date(dateTime.getTime() + utcOffset * 60 * 60 * 1000);
  let day = dateTime.getUTCDay();  // UTC day
  let hour = dateTime.getUTCHours();  // UTC hour
  let minute = dateTime.getUTCMinutes(); 
  if(day >= 1 && day <= 5){ // on weekdays
    if ((hour < 21) && (hour >= 16)){ // Dinner before 9pm and  after 4pm
      m = [day,2]
    }
    else if ((hour < 15) && (hour >= 11)){ // Lunch before 3pm and after 11am
      m = [day,1]
    }
    else if ((hour <= 10 && minute < 30) && (hour >= 7)){ // Breakfast before 10:30am and after 7am
      m = [day,0]
    }
    else{ // closed
      m = [0,0,0]
    }
  }
  else{//weekends
    if ((hour < 21) && (hour >= 16)){ // Dinner before 9pm and  after 4pm
      m = [day,2]
    }
    else if ((hour < 15) && (hour >= 11)){ // Lunch before 3pm and after 11am
      m = [day,1]
    }
    else if ((hour < 10 && minute < 30) && (hour >= 9)){ // Breakfast before 10:30am and after 9am
      m = [day,0]
    }
    else{ // closed\
      //console.log("pav is closed rn")
      m = [0,0,0]
    }
  }
  return m;
}
function formatTimeDC(dateTime = new Date()){
  let m = [0,0]; // day, category
  const utcOffset = -7;
  dateTime = new Date(dateTime.getTime() + utcOffset * 60 * 60 * 1000);
  let day = dateTime.getUTCDay();  // UTC day
  let hour = dateTime.getUTCHours();  // UTC hour
  let minute = dateTime.getUTCMinutes(); 
  if(day >= 1 && day <= 5){ // on weekdays
    if ((hour <= 23) && (hour >= 21)){ // late night before 0am and  after 9pm
      m = [day,2]
    }
    else if ((hour < 20) && (hour >= 15)){ // dinner before 8pm and after 3pm
      m = [day,1]
    }
    else if ((hour < 14) && ((hour >= 10)||(hour >= 10 && minute >= 30))){ // Lunch after 10:30am and before 2pm
      m = [day,0]
    }
  }
  else{//closed
    m = [0,0]
  }
  return m;
}
function fetchMenu(locationNum: number = 0, dayNum: number = 0, categoryNum: number = 0) {
  let day = idDay[dayNum];
  let location = idLocation[locationNum];
  let category = (locationNum == 0) ? idCategoryPav[categoryNum] : idCategoryDC[categoryNum];
  return fetch(`https://widget.api.eagle.bigzpoon.com/menuitems?categoryId=${category}&isPreview=false&locationId=${location}&menuGroupId=${day}&userPreferences=%7B%22allergies%22:%5B%5D,%22lifestyleChoices%22:%5B%5D,%22medicalGoals%22:%5B%7B%22id%22:%225e74c7e19888990010db39e3%22,%22value%22:%220%22%7D,%7B%22id%22:%225e74c8019888990010db39e5%22,%22value%22:%220%22%7D,%7B%22id%22:%225e74c82c9888990010db39e8%22,%22value%22:%220%22%7D,%7B%22id%22:%225e74c8399888990010db39e9%22,%22value%22:%220%22%7D,%7B%22id%22:%225e74c8599888990010db39ea%22,%22value%22:%220%22%7D,%7B%22id%22:%225e74c86a9888990010db39eb%22,%22value%22:%220%22%7D,%7B%22id%22:%225e74c8759888990010db39ec%22,%22value%22:%220%22%7D,%7B%22id%22:%225e74c87f9888990010db39ed%22,%22value%22:%220%22%7D%5D,%22preferenceApplyStatus%22:false,%22crossContactStatus%22:true%7D`, {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      "device-id": "ebde8ccc-da91-4169-a49e-632d9aaa8b39",
      "location-id": "61df4a34d5507a00103ee41e",
      "pragma": "no-cache",
      "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Linux\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "x-comp-id": "61bd7ecd8c760e0011ac0fac",
      "Referer": "https://uc-merced-the-pavilion.widget.eagle.bigzpoon.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": null,
    "method": "GET"
  })
  .then(response => response.json())
  .then(data => {
    return data;  // Return the data directly
  })
  .catch(error => {
    console.error('Error fetching menu:', error);
    throw error;  // Re-throw the error so it can be handled in the calling function
  });
}

const Demo = async () => {
  // let menuParams = formatTimePAV(new Date("October 17, 2024 13:13:00"));
  let menuParams = formatTimePAV(new Date("October 17, 2024 13:13:00"));
  const pavData = await fetchMenu(0, menuParams[0], menuParams[1]);
  const pavMenuItems = pavData.data.menuItems.map((item: any) => ({
    name: item.name,
    description: item.description
  }));
  menuParams = formatTimeDC(new Date("October 17, 2024 13:13:00"));
  const dcData = await fetchMenu(1, menuParams[0], menuParams[1]);
  const dcMenuItems = dcData.data.menuItems.map((item: any) => ({
    name: item.name,
    description: item.description
  }));

  return (
    <div>
      <h1 className="pl-2">ucmmm</h1>
      <div className="flex snap-mandatory snap-x overflow-x-auto gap-5 pl-2 pr-2">
        <MainCard location="Pav" items={pavMenuItems}/>
        <MainCard location="DC" items={dcMenuItems}/>
        <MainCard location="Food Trucks (WIP)" items={dcMenuItems}/>
      </div>
    </div>
  )
}

export default Demo