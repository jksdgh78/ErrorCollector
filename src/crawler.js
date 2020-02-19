const request = require('request');
const moment = require('moment');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const schedule = require('node-schedule');
const JsonDB = require('node-json-db');
const colors = require('./colors.json');
const channel = require('./channel');

const DB = new JsonDB('crawler', true, false);

const requestOptions  = { 
	method: "GET"
	,uri: ""
	,headers: { "User-Agent": "Mozilla/5.0" }
	,encoding: null
};

const NaverCafeCrawlingLoop = (uri, mainurl, cafeName, channelId, color, callback) => {
    var naverlist = [];
    requestOptions.uri = uri;
    request(requestOptions, (err, res, body) => {
        if (err) { return console.log(err); }
        var utf8Text = iconv.decode(body, "euc-kr");
        var $ = cheerio.load(utf8Text);
        $('div.article-board').each(function (i, element) {
            if ($(this).find($('form')).attr('name') === "ArticleList") {
                $(this).find('.board-list').each(function (i, element) {
                    var texttitle = $(this).find('span.aaa').children().first().text();
                    if(!DBtitleFindOrCreate(cafeName, channelId, texttitle))
                    {
                        var texthref = $(this).find('span.aaa').children().first().attr("href");
                    
                        const message = {
                            attachments: [{
                                title: cafeName,
                                text: '<' + mainurl + texthref + '|' + texttitle + '>',                            
                                color: color,
                                thumb_url: "https://errorcollector2.azurewebsites.net/img/naver_icon.PNG",
                                footer: "Error Collector",
                                footer_icon: "https://errorcollector2.azurewebsites.net/img/E.PNG",
                                ts: moment().unix()
                            }],
                        };
                        naverlist.push(message);
                    }
                });
            }
        });

        callback(naverlist, channelId);
    }
    );
};

const crawlingOriginFunction = () => 
{
    console.log("logging at " + moment().format());
    crawlingCafeAll();
};

const crawlingCafeAll = () =>
{
    let channels = false;
    channels = DB.getData(`/`);
    
    if(channels)
    {
        for(var channelId in channels){
            var cafes = channels[channelId].cafe;
            for(var cafeName in cafes)
                NaverCafeCrawlingLoop(cafes[cafeName].url, cafes[cafeName].mainurl,
                     cafeName, channelId, cafes[cafeName].color, CrawlingCallback);
        }
    }  
};

const CrawlingCallback = (list, channelId) => {
    list.forEach(function (element) {

        channel.sendNotification(element, channelId);
    }, this);
};

const DBtitleFindOrCreate = (cafe, channelId, title) => 
{
  let result = false;
  try { result = DB.getData(`/${channelId}/cafe/${cafe}/title/${title}`); } catch (error) {
    console.error(`${title} not found`);
  }

  // save channel if one isn't found
  if (!result) {
    DB.push(`/${channelId}/cafe/${cafe}/title/${title}`, 1);
    return false;
  }
  else
      return true;
};

const DBtitleRemove = (cafe, channelId, title) => {
  DB.delete(`/${channelId}/cafe/${cafe}/title/${title}`);
};

const DBtitleRemoveAll = (channelId) => {
  var cafes = DB.getData(`/${channelId}/cafe`);
  for(var cafeName in cafes)
  {
      cafes[cafeName].title = {};
  }
  DB.delete(`/${channelId}/cafe`);
  DB.push(`/${channelId}/cafe`, cafes);
};

const DBcafeFindOrCreate = (cafe, url, mainurl, channelId, color) => 
{
  let result = DBcafeFind(cafe, channelId);

  // save cafe if one isn't found
  if (!result) {
    DB.push(`/${channelId}/cafe/${cafe}/url`, url);
    DB.push(`/${channelId}/cafe/${cafe}/color`, color);
    DB.push(`/${channelId}/cafe/${cafe}/mainurl`, mainurl);
    return 1;
  }
  else
      return 2;
};

const DBcafeFind = (cafe, channelId) => 
{
  let result = false;
  try { result = DB.getData(`/${channelId}/cafe/${cafe}`); } catch (error) {
    console.error(`${cafe} not found`);
  }
  
  return result;
};

const DBcafeGetNameAll = (channelId) => {
    var result = [];
    
    try
    {   
        var cafes = DB.getData(`/${channelId}/cafe`);    
    
        for(var cafeName in cafes)
        {
            result.push(cafeName);
        }
    }
    catch(e)
    {
        return null;
    }
    
    return result; 
};

const DBcafeRemove = (cafe, channelId) => {
  DB.delete(`/${channelId}/cafe/${cafe}`);
};

const spineOriginFunction = () =>
{
    console.log("spine start");
    let channels = false;
    channels = DB.getData(`/`);
    
    if(channels)
    {
        var index = Math.floor(Math.random() * (5 - 1) + 1);
        var thumb = "https://errorcollector2.azurewebsites.net/img/spine_fairy" + index + ".png";
        console.log(thumb);
        for(var channelId in channels){
            var spine = channels[channelId].spine;
            if(spine)
            {
                const message = 
                {
                    attachments: [{
                        title: "척추 피시죠 <단호>",
                        text : "|척|\n|추|",
                        thumb_url : thumb,
                        footer: "척추 요정",
                        footer_icon: "https://errorcollector2.azurewebsites.net/img/E.PNG",
                        ts: moment().unix()
                    }],
                };
                channel.sendNotification(message , channelId);
            }
        }
    }  
};

const DBspineSetOrCreate = (spine, channelId) => 
{
  DB.push(`/${channelId}/spine`, spine);
};

const DBGetSpine = (channelId) => 
{
    let result = false;
    try {result = DB.getData(`/${channelId}/spine`);} catch(error) {
        console.error(`${channelId} not found`);
    }
    return result;
};

const alarmOriginFunction = (scrumType) =>
{
    console.log("alarm start");
    let channels = false;
    channels = DB.getData(`/`);
    
    if(channels)
    {
        for(var channelId in channels){
            var alarm = channels[channelId].alarm;
            if(alarm && alarm.active)
            {
                if(scrumType == 1)
                {
                    var thumb = "https://errorcollector2.azurewebsites.net/img/alarm_morning.png";
                    const message =  
                    {
                        attachments: [{
                            title: "오전 스크럼",
                            text : alarm.customMessage,
                            thumb_url : thumb,
                            color : colors["green"],
                            footer: "스크럼 알람",
                            footer_icon: "https://errorcollector2.azurewebsites.net/img/E.PNG",
                            ts: moment().unix()
                        }],
                    };
                    
                    channel.sendNotification(message , channelId);
                }
                else
                {
                    var thumb = "https://errorcollector2.azurewebsites.net/img/alarm_afternoon.png";
                    const message =  
                    {
                        attachments: [{
                            title: "오후 스크럼",
                            text : alarm.customMessage,
                            thumb_url : thumb,
                            color : colors["blue"],
                            footer: "스크럼 알람",
                            footer_icon: "https://errorcollector2.azurewebsites.net/img/E.PNG",
                            ts: moment().unix()
                        }],
                    };
                    
                    channel.sendNotification(message , channelId);
                }
            }
        }
    }  
};

const DBalarmSetOrCreate = (active, customMessage, channelId) => 
{
  DB.push(`/${channelId}/alarm/active`, active);
  DB.push(`/${channelId}/alarm/customMessage`, customMessage);
};

const DBGetAlarm = (channelId) => 
{
    let result = false;
    try {result = DB.getData(`/${channelId}/alarm`);} catch(error) {
        console.error(`${channelId} not found`);
    }
    return result;
};

var spineRule = new schedule.RecurrenceRule();
spineRule.dayOfWeek = [new schedule.Range(1, 5)];
spineRule.hour = [2, 6];
spineRule.minute = 30;
 
schedule.scheduleJob(spineRule, spineOriginFunction);

var alarmRuleMorning = new schedule.RecurrenceRule();
alarmRuleMorning.dayOfWeek = [new schedule.Range(1, 5)];
alarmRuleMorning.hour = 0;
alarmRuleMorning.minute = 0;
schedule.scheduleJob(alarmRuleMorning, function(scrumType) { 
        alarmOriginFunction(scrumType);
    }.bind(null, 1));

var alarmRuleAfterNoon = new schedule.RecurrenceRule();
alarmRuleAfterNoon.dayOfWeek = [new schedule.Range(1, 5)];
alarmRuleAfterNoon.hour = 9;
alarmRuleAfterNoon.minute = 0;
schedule.scheduleJob(alarmRuleAfterNoon, function(scrumType) { 
        alarmOriginFunction(scrumType);
    }.bind(null, 2));


schedule.scheduleJob('0 */10 * * * *', crawlingOriginFunction);
schedule.scheduleJob('0 */10 * * * *', function(){
    request('http://bnscalculator.azurewebsites.net/');
});
schedule.scheduleJob('0 */10 * * * *', function(){
    request('http://bnsmacketcrawler.azurewebsites.net/');
});


module.exports = { DBcafeFindOrCreate, DBcafeFind, DBcafeGetNameAll, DBcafeRemove, 
    DBtitleRemoveAll, crawlingOriginFunction, DBspineSetOrCreate,
    DBalarmSetOrCreate};