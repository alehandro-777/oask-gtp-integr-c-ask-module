
const c_ask_test_config = require('./config')
const config = require('config');
const web_api = require('./web-api')

const update_timeout_ms = config.get('update_timeout_ms')

const cfg_lines = c_ask_test_config.ReadConfig()
const init_history_hh_count = config.get('web_api.init_history_hh_count')
const req_data_to = new Date();
const req_data_from = new Date();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

//set req period
req_data_from.setTime(req_data_from.getTime() - (init_history_hh_count*60*60*1000));


const StartDataSending = () => {

  ProcessVirtualLines(cfg_lines, req_data_from, req_data_to);
      
      timer = setTimeout(() => StartDataSending(), update_timeout_ms)
};

StartDataSending();


async function ProcessVirtualLines(lines_cfg, start, end) {
  for (let i = 0; i < lines_cfg.length; i++) {
    const line = lines_cfg[i];
    let post_queries = await QueryAskData_and_AggregateCalc(line, start, end)
    UpdateValuesInOAskGtp(post_queries)
  }
}

async function QueryAskData_and_AggregateCalc(line_cfg, start, end) {
  let promises =[];
  let ask_arrays_values=[];

  for (let i = 0; i < line_cfg.lines.length; i++) {
    const ask_line = line_cfg.lines[i];
    let promise = web_api.getCentrAskHourData(ask_line.line_id, start, end);
    promises.push(promise);
  }
  ask_arrays_values = await Promise.all(promises);

  let res = ProcessApiResponses(ask_arrays_values, line_cfg);

  return res;
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
      let response = await web_api.getOaskGtpCurrPointValue(point_id, c_time)
      if (response.data.str_value == str_value) {
        //values eq -> don't need to update
        console.log(query, "old==new -> don't need to update")
        continue;
      }
    } 
    catch (error) {
      //it's ok there is no hour value
      console.log(query, error.response.status)
    }
    try {
      let res = await web_api.PostToOaskGtp(query);  
    } 
    catch (error) {
      console.log(query, error.response.status, "OASK API ERROR")
    }
    //console.log( query, res )
  }
}

function ProcessApiResponses(response, line_cfg) {
  let result =[];
  let all_values_array =[];
  //concat arrays e big

  for (let i = 0; i < response.length; i++) {
    const element = response[i];
    for (let j = 0; j < element.data.length; j++) {
      const obj = element.data[j];
      all_values_array.push(obj)
    }      
  }
   
  //sort by date string 
  all_values_array.sort( (a,b) => {
    if ( a.date < b.date ){
      return -1;
    }
    if ( a.date > b.date ){
      return 1;
    }
    return 0;
  })

  let current_time;
  let acc = {};

  for (let i = 0; i < all_values_array.length; i++) {   
     const ask_value = all_values_array[i];
    if (ask_value.date != current_time) {
      //save result
      if(current_time) result.push(acc);
      //start new hour calculation
      acc = {};
      current_time = ask_value.date;
      acc["3"] = ask_value.date;
      acc[line_cfg.point_id] = 0;
    }
    acc[line_cfg.point_id] += ask_value.volume / 1000;
    //console.log(ask_value.volume)    
  }
  //push last object
  if(current_time) result.push(acc);
 // console.log(result)
  return result;
}