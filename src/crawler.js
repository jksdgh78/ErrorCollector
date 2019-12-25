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

const DBspineSetOrCreate = (spine, channelId) => 
{
  DB.push(`/${channelId}/spine`, spine);
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

const DBGetSpine = (channelId) => 
{
    let result = false;
    try {result = DB.getData(`/${channelId}/spine`);} catch(error) {
        console.error(`${channelId} not found`);
    }
    return result;
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
  
  var cafes = DB.getData(`/${channelId}/cafe`);
  for(var cafeName in cafes)
  {
      result.push(cafeName);
  }
  
  return result;
};

const DBcafeRemove = (cafe, channelId) => {
  DB.delete(`/${channelId}/cafe/${cafe}`);
};

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [new schedule.Range(1, 5)];
rule.hour = [2, 6];
rule.minute = 30;
 
schedule.scheduleJob(rule, spineOriginFunction);

schedule.scheduleJob('0 */10 * * * *', crawlingOriginFunction);
schedule.scheduleJob('0 */10 * * * *', function(){
    request('http://bnscalculator.azurewebsites.net/');
});
schedule.scheduleJob('0 */10 * * * *', function(){
    request('http://bnsmacketcrawler.azurewebsites.net/');
});


module.exports = { DBcafeFindOrCreate, DBcafeFind, DBcafeGetNameAll, DBcafeRemove, DBtitleRemoveAll, crawlingOriginFunction, DBspineSetOrCreate};