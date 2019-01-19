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

schedule.scheduleJob('0 */10 * * * *', crawlingOriginFunction);

module.exports = { DBcafeFindOrCreate, DBcafeFind, DBcafeGetNameAll, DBcafeRemove, DBtitleRemoveAll, crawlingOriginFunction};