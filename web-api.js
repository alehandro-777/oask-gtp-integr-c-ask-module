const axios = require('axios');
const config = require('config');

//http://localhost:3000/pointvalues/100?start=2020-12-01 07:00:00&end=2022-12-31 09:00:00
exports.getOaskGtpCurrPointValue = (point_id, str_time) => {
  const url = config.get('web_api.oask-gtp-uri')
  let uri = `${url}/pointvalue/${point_id}?current_time=${str_time}`
  //console.log(uri)
  return axios.get(uri);
}

//https://10.46.24.62:8080/api/getdata/fmhour/?idOwn=101742051&dtBegin=12/01/2020 07:00:00&dtEnd=12/31/2020 07:00:00

exports.getCentrAskHourData = (line_id, dt_start_time, dt_end_time) => {
    const url = config.get('web_api.c-ask-uri')

    let start = FormatAskDateTime(dt_start_time)
    let end = FormatAskDateTime(dt_end_time)

    //console.log(`${url}/getdata/fmhour/?idOwn=${line_id}&dtBegin=${start}&dtEnd=${end}`)
    return axios.get(`${url}/getdata/fmhour/?idOwn=${line_id}&dtBegin=${start}&dtEnd=${end}`);
  }
  
function FormatAskDateTime(time) {
  let yyyy = time.getFullYear()
  let mn = time.getMonth()	//Get the month as a number (0-11)
  let dd = time.getDate()	//Get the day as a number (1-31)
  let hh = time.getHours()	//Get the hour (0-23)
  let mm = time.getMinutes()	//Get the minute (0-59)
  let ss = time.getSeconds()	//Get the second (0-59)
  //12/01/2020 07:00:00
  return `${mn+1}/${dd}/${yyyy} ${hh}:${mm}:${ss}`
}
  
exports.PostToOaskGtp = async (data) => {
  const url = config.get('web_api.oask-gtp-uri')
  let res = await axios.post(url+"/formvalues", data);
  return res;
}

