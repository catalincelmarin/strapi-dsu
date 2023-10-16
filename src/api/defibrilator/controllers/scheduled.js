'use strict';

/**
 * A set of functions called "actions" for `scheduled`
 */
function isDefibrillatorAvailable(defibrillator) {
  if(defibrillator.defibrilator_schedules_id !== undefined) {
    console.log(defibrillator.defibrilator_schedules_id)
    const currentDate = new Date();
    const weekdays = ["Du","Lu", "Ma", "Mi", "Jo", "Vi", "Sa" ];
    const currentDay = weekdays[currentDate.getDay()];

    const hours = currentDate.getHours().toString().padStart(2, '0'); // Format hours with leading zero
    const minutes = currentDate.getMinutes().toString().padStart(2, '0'); // Format minutes with leading zero
    const seconds = currentDate.getSeconds().toString().padStart(2, '0'); // Format seconds with leading zero
    const milliseconds = currentDate.getMilliseconds().toString().padStart(3, '0'); // Format milliseconds with leading zeros

    const currentTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;

    //const currentTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    for (const schedule of defibrillator.defibrilator_schedules_id) {
      if (schedule.days.includes(currentDay)) {
        console.log(schedule.startTime,currentTime,schedule.endTime)
        if (schedule.is24Hour || (schedule.startTime <= currentTime && currentTime <= schedule.endTime)) {
          return true; // Defibrillator is available
        }
      }
    }
  }

  return false; // Defibrillator is not available
}

module.exports = {
  getScheduled: async (ctx, next) => {
     try {
        let defibs = await strapi.query('api::ip-point.ip-point').findMany({
             'populate':['defibrilator','defibrilator.defibrilator_schedules_id'],
             'where':{
                  'defibrilator':{'id':{'$null':false}}
             }
	})
        console.log(defibs);
       defibs.forEach(defibrillator => {
             defibrillator.isOn = defibrillator.defibrilattor !== null && isDefibrillatorAvailable(defibrillator.defibrilator);
             //console.log(defibrillator);
          });
	let categorized = {
	    'On':[],'Off':[],'On112':[],'Off112':[]
	}
	defibs.forEach(el => {
	    let key = el['isOn'] === true ? (el['defibrilator']['canCallEmergency'] === true ? 'On112' : 'On') :
                (el['defibrilator']['canCallEmergency'] === true ? 'Off112' : 'Off');
	    categorized[key].push(el);
        
	});

       ctx.body = categorized;
     } catch (err) {
       ctx.body = err;
     }
   }
};
