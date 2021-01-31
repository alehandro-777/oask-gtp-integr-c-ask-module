process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const config = require('config');
const web_api = require('./web-api')
const moment = require("moment")

const start_time = "2021-01-01T00:00:00"
const end_time =   "2021-01-21T00:00:00"

const req_data_to = moment(end_time);
const req_data_from = moment(start_time);

RequestManyDays(req_data_from, req_data_to)

const StartDataSending = () => {
     console.log("wait 60 sec")
    timer = setTimeout(() => StartDataSending(), 120*1000)
};

StartDataSending();

async function RequestManyDays(start_date, end_date) {
    let index = start_date.clone();
    while (index < end_date) {
      let queries = getTestData(index.format('YYYY-MM-DDTHH:mm'));
      console.log(queries)
      let r = await UpdateValuesInOAskGtp([ queries ])
      index.add(1, 'h')
    }
}

function getTestData(time) {
    let result = {};
    result["3"] = time;

    //generate random 0 - 100
    for (let i = 101; i < 181; i++) {
        let value = Math.random() * 100;
        result[i] = value.toFixed(1);
    }
    //generate const 0-2
    for (let i = 181; i < 209; i++) {
        let value = Math.random() * 2;
        result[i] = Math.round(value);
    }
    //console.log( result )
    return result;
}

async function UpdateValuesInOAskGtp(queries) {
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];

    let point_id;
    let c_time;
    let str_value;

    //find param id
    for (var prop in query) {
      if (prop=="3") {
        c_time = query[prop];
      } else {
        point_id = prop;
        str_value = query[prop];
      }            
    }    

    try {
      let response = await web_api.PostToOaskGtp(query);
      //console.log(query, response.status)  
    } 
    catch (error) {
      console.log(query, error.response.status, "OASK API ERROR")
    }
    //console.log( query, res )
  }
}

