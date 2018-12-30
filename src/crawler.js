const request = require('request');
const moment = require('moment');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const schedule = require('node-schedule');
const JsonDB = require('node-json-db');
const channel = require('./channel');

const DB = new JsonDB('crawler', true, false);

const colorNaver = '#1DDB16';
const colorError = '#FF0000';
const colorRequest = '#0054FF';


const requestOptions  = { 
	method: "GET"
	,uri: ""
	,headers: { "User-Agent": "Mozilla/5.0" }
	,encoding: null
};

const NaverCafeCrawlingLoop = (uri, title, color, callback) => {
    var naverlist = [];
    requestOptions.uri = uri;
    request(requestOptions, (err, res, body) => {
        if (err) { return console.log(err); }
        var utf8Text = iconv.decode(body, "euc-kr");
        var $ = cheerio.load(utf8Text);
        $('div.article-board').each(function (i, element) {
            if ($(this).find($('form')).attr('name') === "ArticleList") {
                $(this).find('.board-list').each(function (i, element) {
                    var texttitle = $(this).find('span.aaa').find('a').text();
                    if(!DBtitleFindOrCreate(texttitle))
                    {
                        var texthref = $(this).find('span.aaa').find('a').attr("href");
                    
                        const message = {
                            attachments: [{
                                title: title,
                                text: '<https://cafe.naver.com/monstersuperleague' + texthref + '|' + texttitle + '>',                            
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

        callback(naverlist);
    }
    );
};

const crawlingOriginFunction = () => 
{
    console.log("loggin at " + moment().format());
    NaverCafeCrawlingLoop('https://cafe.naver.com/ArticleList.nhn?search.clubid=28196706&search.menuid=65&search.boardtype=L', "네이버 카페 건의사항", colorRequest, CrawlingCallback);
    NaverCafeCrawlingLoop('https://cafe.naver.com/ArticleList.nhn?search.clubid=28196706&search.menuid=50&search.boardtype=L', "네이버 카페 오류제보", colorError, CrawlingCallback);
};


const CrawlingCallback = (list) => {
    list.forEach(function (element) {

        channel.sendNotification(element, process.env.CHANNEL_ID);
    }, this);
};

const DBtitleFindOrCreate = (title) => 
{
  let channel = false;
  try { channel = DB.getData(`/monstersuperleague/title/${title}`); } catch (error) {
    console.error(`${title} not found`);
  }

  // save channel if one isn't found
  if (!channel) {
    DB.push(`/monstersuperleague/title/${title}`, 1);
    return false;
  }
  else
      return true;
};

const DBtitleRemove = (title) => {
  DB.delete(`/monstersuperleague/title/${title}`);
};

schedule.scheduleJob('0 */1 * * * *', crawlingOriginFunction);
schedule.scheduleJob('0 */1 * * * *', function(){
    request('http://bnscalculator.azurewebsites.net/');
});
schedule.scheduleJob('0 */1 * * * *', function(){
    request('http://bnsmacketcrawler.azurewebsites.net/');
});
