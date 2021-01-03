const test_data = require('./2')
const c_ask_test_config = require('./config')
const config = require('config');
const web_api = require('./web-api')

const update_timeout_ms = config.get('update_timeout_ms')

const cfg_lines = c_ask_test_config.ReadConfig()
const init_history_hh_count = config.get('web_api.init_history_hh_count')
const req_data_to = new Date();
const req_data_from = new Date();

//set req period
req_data_from.setTime(req_data_from.getTime() - (init_history_hh_count*60*60*1000));


const StartUpdate = () => {

  ProcessSummLines(cfg_lines, req_data_from, req_data_to);
      
      timer = setTimeout(() => StartUpdate(), update_timeout_ms)
};

StartUpdate();


function ProcessSummLines(lines_cfg, start, end) {
  for (let i = 0; i < lines_cfg.length; i++) {
    const line = lines_cfg[i];
    let post_queries = QueryAskData_SummCalc(line, start, end)
    UpdateValuesInOAskGtp(post_queries)
  }
}

function QueryAskData_SummCalc(line_cfg, start, end) {
  let promises =[];
  let ask_arrays_values=[];

  for (let i = 0; i < line_cfg.lines.length; i++) {
    const ask_line = line_cfg.lines[i];
    let promise = web_api.getCentrAskHourData(ask_line.line_id, start, end);
    promises.push(promise);
    ask_arrays_values.push(test_data.GenerateTestData())
  }
  let res = HoursSummCalculations(ask_arrays_values, line_cfg);
  //ask_arrays_values = await Promise.all(promises);
  return res;
}    

async function UpdateValuesInOAskGtp(queries) {
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    //find param id
    //TODO test if need to update
    //let curr_value = await web_api.getOaskGtpCurrPointValue("", query['1'])

    let res = await web_api.PostToOaskGtp(query);
    console.log( query, res )
  }
}

function HoursSummCalculations(ask_arrays_values, line_cfg) {
  let result =[];
  //concat arrays to one big
  let all_values_array = ask_arrays_values.reduce( (acc,curr) =>{return acc.concat(curr)}, [] );
    
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
      acc['1'] = ask_value.date;
      acc[line_cfg.point_id] = 0;
    }
    acc[line_cfg.point_id] += ask_value.volume;
  }
  //push last object
  if(current_time) result.push(acc);
  return result;
}