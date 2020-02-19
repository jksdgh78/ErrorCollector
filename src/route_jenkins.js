const channel = require('./channel');

const jenkins_clientbuild = (req, res) =>
{
    var dialog = {
      "callback_id": "clientbuild",
      "title": "Jenkins client build",
      "submit_label": "build",
      "notify_on_cancel": true,
      "state": "Limo",
      "elements": [
          {
              "type": "text",
              "label": "Starter",
              "name": "text_starter"
          },
          {
              "type": "select",
              "label": "빌드 타입(QA, TEST, PRODUCTION)",
              "name": "select_build_type",
              "options": [
                  {
                    "label": "QA",
                    "value": "QA"
                  },
                  {
                    "label": "TEST",
                    "value": "TEST"
                  },
                  {
                    "label": "PRODUCTION",
                    "value": "PRODUCTION"
                  } 
              ]
          },
          {
              "type": "select",
              "label": "빌드 플랫폼(Android / IOS)",
              "name": "select_platform",
              "options": [
                  {
                    "label": "android,ios",
                    "value": "android,ios"
                  },
                  {
                    "label": "android",
                    "value": "android"
                  },
                  {
                    "label": "ios",
                    "value": "ios"
                  } 
              ]
          },
          {
              "type": "text",
              "label": "build version ex) 1.0.20012101",
              "name": "text_build_version"
          },
          {
              "type": "text",
              "label": "android version ex) 113",
              "name": "text_android_version"
          },
          {
              "type": "text",
              "label": "ios version ex) 2.1.3",
              "name": "text_ios_version"
          }
      ]
    };
    
    channel.sendDialog(dialog, req.body.trigger_id, req.body.channel_id);
    res.sendStatus(200);
};
    
const jenkins_databuild = (req, res) =>
{
    var dialog = {
      "callback_id": "databuild",
      "title": "Jenkins Data build",
      "submit_label": "build",
      "notify_on_cancel": true,
      "state": "Limo",
      "elements": [
          {
              "type": "text",
              "label": "Starter (메모도 가능)",
              "name": "text_starter"
          },
          {
              "type": "select",
              "label": "빌드 브랜치(QA, TEST ...)",
              "name": "select_branch",
              "options": [
                  {
                    "label": "QA",
                    "value": "QA"
                  },
                  {
                    "label": "TEST",
                    "value": "TEST"
                  },
                  {
                    "label": "PRODUCT",
                    "value": "PRODUCT"
                  },
                  {
                    "label": "NONE",
                    "value": "NONE"
                  }
              ]
          },
          {
              "type": "text",
              "label": "DOCS version ex) 1.0.20012101",
              "name": "text_docs_version"
          },
          {
              "type": "text",
              "label": "base version > 라이브는 절대 '0' 사용 금지",
              "name": "text_base_version"
          },
          {
              "type": "select",
              "label": "기획 방에 슬랙 보낼지",
              "name": "select_send_slack",
              "options": [
                  {
                    "label": "YES",
                    "value": "YES"
                  },
                  {
                    "label": "NO",
                    "value": "NO"
                  }
              ]
          }
      ]
    };
    
    channel.sendDialog(dialog, req.body.trigger_id, req.body.channel_id);
    res.sendStatus(200);
};

const jenkins_datadeploy = (req, res) =>
{
    var dialog = {
      "callback_id": "datadeploy",
      "title": "Jenkins Data deploy",
      "submit_label": "submit",
      "notify_on_cancel": true,
      "state": "Limo",
      "elements": [
          {
              "type": "text",
              "label": "Starter (메모도 가능)",
              "name": "text_starter"
          },
          {
              "type": "select",
              "label": "METHOD(server_deploy ...)",
              "name": "select_method",
              "options": [
                  {
                    "label": "server_deploy",
                    "value": "server_deploy"
                  },
                  {
                    "label": "개발팀용 build_patch",
                    "value": "build_patch"
                  },
                  {
                    "label": "개발팀용 upload",
                    "value": "upload"
                  },
                  {
                    "label": "개발팀용 rollback",
                    "value": "rollback"
                  } 
              ]
          },
          {
              "type": "text",
              "label": "Data Version",
              "name": "text_data_version"
          },
          {
              "type": "select",
              "label": "Server(데이터 배포 할 서버)",
              "name": "select_branch",
              "options": [
                  {
                    "label": "QA",
                    "value": "QA"
                  },
                  {
                    "label": "TEST",
                    "value": "TEST"
                  },
                  {
                    "label": "NONE",
                    "value": "NONE"
                  }
              ]
          },
          {
              "type": "select",
              "label": "기획 방에 슬랙 보낼지",
              "name": "select_send_slack",
              "options": [
                  {
                    "label": "YES",
                    "value": "YES"
                  },
                  {
                    "label": "NO",
                    "value": "NO"
                  }
              ]
          }
      ]
    };
    
    channel.sendDialog(dialog, req.body.trigger_id, req.body.channel_id);
    res.sendStatus(200);
};

const jenkins_resourcebuild = (req, res) => 
{
    var dialog = {
      "callback_id": "resourcebuild",
      "title": "Jenkins Resource build",
      "submit_label": "build",
      "notify_on_cancel": true,
      "state": "Limo",
      "elements": [
          {
              "type": "text",
              "label": "Starter (메모도 가능)",
              "name": "text_starter"
          },
          {
              "type": "select",
              "label": "빌드 브랜치(QA, TEST ...)",
              "name": "select_branch",
              "options": [
                  {
                    "label": "QA",
                    "value": "QA"
                  },
                  {
                    "label": "TEST",
                    "value": "TEST"
                  },
                  {
                    "label": "PRODUCT",
                    "value": "PRODUCT"
                  },
                  {
                    "label": "NONE",
                    "value": "NONE"
                  } 
              ]
          },
          {
              "type": "text",
              "label": "base version > 라이브는 절대 '0' 사용 금지",
              "name": "text_base_version"
          }
      ]
    };
    
    channel.sendDialog(dialog, req.body.trigger_id, req.body.channel_id);
    res.sendStatus(200);
};

const jenkins_protobuild = (req, res) => 
{
    var dialog = {
      "callback_id": "protobuild",
      "title": "Jenkins Proto build",
      "submit_label": "build",
      "notify_on_cancel": true,
      "state": "Limo",
      "elements": [
          {
              "type": "text",
              "label": "Starter (메모도 가능)",
              "name": "text_starter"
          },
          {
              "type": "select",
              "label": "빌드 브랜치(QA, TEST ...)",
              "name": "select_branch",
              "options": [
                  {
                    "label": "QA",
                    "value": "QA"
                  },
                  {
                    "label": "TEST",
                    "value": "TEST"
                  },
                  {
                    "label": "DEV",
                    "value": "DEV"
                  },
                  {
                    "label": "PRODUCT",
                    "value": "PRODUCT"
                  }
              ]
          }
      ]
    };
    
    channel.sendDialog(dialog, req.body.trigger_id, req.body.channel_id);
    res.sendStatus(200);
};

const jenkins_datadiff = (req, res) => 
{
    var dialog = {
      "callback_id": "datadiff",
      "title": "Jenkins Data Diff",
      "submit_label": "Start",
      "notify_on_cancel": true,
      "state": "Limo",
      "elements": [
          {
              "type": "text",
              "label": "Starter (메모도 가능)",
              "name": "text_starter"
          },
          {
              "type": "text",
              "label": "현재 라이브에서 사용중인 데이터의 독스 버전",
              "name": "text_docs_version"
          },
          {
              "type": "text",
              "label": "다음 라이브에서 사용할 데이터의 버전",
              "name": "text_data_version"
          },
          {
              "type": "select",
              "label": "기획 방에 슬랙 보낼지",
              "name": "select_send_slack",
              "options": [
                  {
                    "label": "YES",
                    "value": "YES"
                  },
                  {
                    "label": "NO",
                    "value": "NO"
                  }
              ]
          }
      ]
    };
    
    channel.sendDialog(dialog, req.body.trigger_id, req.body.channel_id);
    res.sendStatus(200);
};

module.exports = { jenkins_clientbuild, jenkins_databuild, jenkins_datadeploy, jenkins_resourcebuild
  , jenkins_protobuild, jenkins_datadiff};