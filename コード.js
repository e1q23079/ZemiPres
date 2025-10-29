/*------------------------------------------------------------------------------
  コード.js
  Google Apps Script (GAS) のメインコード
--------------------------------------------------------------------------------*/

// スプレッドシートの取得
// const spred = SpreadsheetApp.getActive();
// シートの取得
// const sheet = spred.getSheetByName('test'); // 開発環境
// const sheet = spred.getSheetByName('product'); // 本番環境

// DBへの接続設定
const notionToken = PropertiesService.getScriptProperties().getProperty('NOTION_TOKEN');
// const notionDatabaseId = PropertiesService.getScriptProperties().getProperty('NOTION_DATABASE_ID_TEST'); // 開発環境
const notionDatabaseId = PropertiesService.getScriptProperties().getProperty('NOTION_DATABASE_ID_PRODUCT'); // 本番環境

const lastUpdatedDatabaseId = PropertiesService.getScriptProperties().getProperty('NOTION_LAST_UPDATED_DATABASE_ID'); // 更新時刻管理用DB

const notionApiUrlQuery = `https://api.notion.com/v1/databases/${notionDatabaseId}/query`;
const notionApiUrlPage = `https://api.notion.com/v1/pages`;

// 現在のWebアプリのURLを取得
function getNowUrl() {
  return ScriptApp.getService().getUrl();
}

// Googleアカウントでログインしているユーザーのメールアドレスを取得
function getUserEmail() {
  const UserEmail = Session.getActiveUser().getEmail();
  return UserEmail;
}

// Googleアカウントでログインしているユーザーの名前を取得
function getUserName() {
  try {
    // People API でログインユーザーの情報を取得
    const profile = People.People.get('people/me', {
      personFields: 'names'
    });

    if (profile.names && profile.names.length > 0) {
      return profile.names[0].displayName;
    }

    return 'Unknown User';
  } catch (e) {
    Logger.log('エラー: ' + e);
    return Session.getActiveUser().getEmail(); // フォールバック
  }
}

// メールを配信する
function sendEmail(to, subject, body) {
  // MailApp.sendEmail(送信先, 件名, 本文);
  // console.log(`メール送信先: ${to}\n件名: ${subject}\n本文: ${body}`);
  /*const mailOptions = {
  from: 'your-email@gmail.com',
  to: to,
  subject: subject,
  text: body
};*/
  MailApp.sendEmail(to, subject, body);
  // MailApp.sendEmail(送信先, 件名, 本文);
}

// 特定のユーザーの発表順番を取得
function getUserPresentationOrder(userEmail) {

  // sheetからuserEmailの発表順を取得して返す
  // let data = sheet.getDataRange().getValues();
  // for (let i = 0; i < data.length; i++) {
  //   if (data[i][0] === userEmail) {
  //     return data[i][4];
  //   }
  // }

  // NotionAPIでuserEmailの発表順を取得して返す
  const users = getAllUsers();

  for (let i = 0; i < users.length; i++) {
    if (users[i].email === userEmail) {
      return users[i].number;
    }
  }

  return null;
}


// 全体にメールを送信する
function sendEmailToAllUsers() {
  // NotionAPIから全ユーザーのメールアドレスを取得し、sendEmail関数で一括送信する

  let users = getAllUsers();
  let subject = "発表順番管理ツール ZemiPress からのお知らせ";

  for (let i = 0; i < users.length; i++) {
    let body = `発表の順番が更新されました。\n${users[i].name}さんは${getUserPresentationOrder(users[i].email)}番目の発表です。\n詳細は、ZemiPressをご確認ください。\nhttps://script.google.com/a/macros/oit.ac.jp/s/AKfycbwiyeXQoOj--_So-Xsfc8SiRT1P9wpFj7vF2ViHA7tc3gFmyxPPoUGidXxEwkVB35f3/exec\nまた、明日の発表を欠席される方は、欠席申請をお願いいたします。\n最終更新時刻：${getLastUpdatedTime()}\n※これはZemiPressからの一斉メールです。`;
    sendEmail(users[i].email, subject, body);
  }

}

// トリガー処理
function triggerSendEmailToAllUsers() {
  // config設定：yesの場合のみ実行
  if (getConfig() === "yes") {
    resetStatus();  // ステータスリセット
    assignPresentationOrder();  // 発表順をランダムに割り振る
    recordLastUpdatedTime();  // 更新時刻記録
    sendEmailToAllUsers();  // 全体にメール送信
    console.log("トリガーが実行されました。");
  } else {
    console.log("トリガーは無効化されています。");
  }
}

// // sheetから全ユーザーのメールアドレスを取得し、sendEmail関数で一括送信する
// function sendEmailToAllUsers(subject, body) {
//   const users = getAllUsers();
//   const emailList = users.map(user => user.email);
//   const uniqueEmailList = [...new Set(emailList)];
//   uniqueEmailList.forEach(email => {
//     sendEmail(email, subject, body);
//   });
// }

// ユーザー登録
function registerUser(userEmail, userName) {
  // sheetに[userEmail, userName, null, null, null]を追加
  // sheet.appendRow([userEmail, userName, null, null, null]);

  // NotionAPIでユーザー登録
  const notionHeaders = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${notionToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    payload:
      JSON.stringify({
        parent: { database_id: notionDatabaseId },
        properties: {
          name: {
            title: [
              { text: { content: userName } }
            ]
          },
          email: {
            email: userEmail
          },
          attendance: {
            select: { name: "出席" }
          },
          number: {
            number: null
          }
        }
      }),
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch(notionApiUrlPage, notionHeaders);

}

// 登録完了メール
function sendRegistrationCompleteEmail(userEmail, userName) {
  let subject = "発表順番管理ツール ZemiPress ユーザー登録完了のお知らせ";
  let body = `${userName}さん\nZemiPressへのユーザー登録が完了しました。\nhttps://script.google.com/a/macros/oit.ac.jp/s/AKfycbwiyeXQoOj--_So-Xsfc8SiRT1P9wpFj7vF2ViHA7tc3gFmyxPPoUGidXxEwkVB35f3/exec\n※これはZemiPressからの自動送信メールです。`;
  sendEmail(userEmail, subject, body);
}

// ユーザーが登録されているか確認
function isUserRegistered(userEmail) {
  // // sheetにuserEmailが存在するか確認し、存在すればtrue、存在しなければfalseを返す
  // let data = sheet.getDataRange().getValues();
  // for (let i = 0; i < data.length; i++) {
  //   if (data[i][0] === userEmail) {
  //     return true;
  //   }
  // }

  // NotionAPIでユーザー登録確認
  const users = getAllUsers();
  for (let i = 0; i < users.length; i++) {
    if (users[i].email === userEmail) {
      return true;
    }
  }
  return false;

}

// DBから全ユーザー情報を取得
function getAllUsers() {
  // sheetから{email: '', name: '', attendance: '', presentation: '', number: ''}の配列を返す
  // let data = sheet.getDataRange().getValues();
  // let users = [];
  // for (let i = 0; i < data.length; i++) {
  //   users.push({
  //     email: data[i][0],
  //     name: data[i][1],
  //     attendance: data[i][2],
  //     presentation: data[i][3],
  //     number: data[i][4]
  //   });
  // }

  // NotionAPIから全ユーザー情報を取得して配列で返す
  const notionHeaders = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${notionToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(notionApiUrlQuery, notionHeaders);
  const json = JSON.parse(response.getContentText());

  let users = [];

  json.results.forEach(page => {
    let user = {
      pageId: page.id,
      email: page.properties.email.email || "",
      name: page.properties.name.title[0]?.text.content || "",
      attendance: page.properties.attendance.select?.name || "",
      number: page.properties.number.number || null
    };
    users.push(user);
  });

  return users;
}

// データを発表順に並び変えて取得
function getUsersByPresentationOrder() {
  // sheetから発表順に並び変えた{email: '', name: '', attendance: '', presentation: '', number: ''}の配列を返す
  let users = getAllUsers();
  users.sort((a, b) => {
    return a.number - b.number;
  });
  return users;
}

// 発表順を更新する
function updatePresentationOrder(userEmail, orderNumber) {
  // // sheetのuserEmailの発表順をorderNumberに更新する
  // let data = sheet.getDataRange().getValues();
  // for (let i = 0; i < data.length; i++) {
  //   if (data[i][0] === userEmail) {
  //     sheet.getRange(i + 1, 5).setValue(orderNumber);
  //     break;
  //   }
  // }

  // NotionAPIで発表順を更新する
  const users = getAllUsers();
  let pageId = null;
  for (let i = 0; i < users.length; i++) {
    if (users[i].email === userEmail) {
      pageId = users[i].pageId;
      break;
    }
  }

  if (pageId) {
    const notionHeaders = {
      method: 'patch',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      payload:
        JSON.stringify({
          properties: {
            number: {

              number: orderNumber
            }
          }
        }),
      muteHttpExceptions: true
    };
    UrlFetchApp.fetch(`${notionApiUrlPage}/${pageId}`, notionHeaders);
  }

}

// 発表順をランダムに割り振る
function assignPresentationOrder() {
  // // sheetの全ユーザーの発表順をランダムに割り振る
  // let users = getAllUsers();
  // let numbers = [];
  // for (let i = 1; i <= users.length; i++) {
  //   numbers.push(i);
  // }
  // // シャッフル
  // for (let i = numbers.length - 1; i > 0; i--) {
  //   const j = Math.floor(Math.random() * (i + 1));
  //   [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  // }
  // // 発表順を更新
  // for (let i = 0; i < users.length; i++) {
  //   updatePresentationOrder(users[i].email, numbers[i]);
  // }

  // NotionAPIで発表順をランダムに割り振る
  const users = getAllUsers();
  let numbers = [];
  for (let i = 1; i <= users.length; i++) {
    numbers.push(i);
  }

  // シャッフル
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  // 発表順を更新
  for (let i = 0; i < users.length; i++) {
    const notionHeaders = {
      method: 'patch',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      payload:
        JSON.stringify({
          properties: {
            number: {
              number: numbers[i]
            }
          }
        }),
      muteHttpExceptions: true
    };
    UrlFetchApp.fetch(`${notionApiUrlPage}/${users[i].pageId}`, notionHeaders);
  }

}

// ステータスをリセットする
function resetStatus() {
  // sheetの全ユーザーの出欠、発表ステータス、発表順をリセットする
  // let data = sheet.getDataRange().getValues();
  // for (let i = 0; i < data.length; i++) {
  //   sheet.getRange(i + 1, 3).setValue("出席");
  //   sheet.getRange(i + 1, 4).setValue(null);
  //   sheet.getRange(i + 1, 5).setValue(null);
  // }

  // NotionAPIでステータスリセット
  const users = getAllUsers();
  for (let i = 0; i < users.length; i++) {
    const notionHeaders = {
      method: 'patch',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      payload:
        JSON.stringify({
          properties: {
            attendance: {
              select: { name: "出席" }
            },
            number: {
              number: null
            }
          }
        }),
      muteHttpExceptions: true
    };
    UrlFetchApp.fetch(`${notionApiUrlPage}/${users[i].pageId}`, notionHeaders);
  }

}

// ステータスを更新する（出欠）
function updateAttendanceStatus(userEmail, status) {
  // sheetのuserEmailの出欠ステータスをstatusに更新する
  // let data = sheet.getDataRange().getValues();
  // for (let i = 0; i < data.length; i++) {
  //   if (data[i][0] === userEmail) {
  //     sheet.getRange(i + 1, 3).setValue(status);
  //     break;
  //   }
  // }

  // NotionAPIで出欠ステータスを更新する
  const users = getAllUsers();
  let pageId = null;

  for (let i = 0; i < users.length; i++) {
    if (users[i].email === userEmail) {
      pageId = users[i].pageId;
      break;
    }
  }

  if (pageId) {
    const notionHeaders = {
      method: 'patch',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      payload:
        JSON.stringify({
          properties: {
            attendance: {
              select: { name: status }
            }
          }
        }),
      muteHttpExceptions: true
    };
    UrlFetchApp.fetch(`${notionApiUrlPage}/${pageId}`, notionHeaders);
  }
}

// ステータス更新完了メール
function sendStatusUpdateCompleteEmail(userEmail, userName, status) {
  let subject = "発表順番管理ツール ZemiPress ステータス更新完了のお知らせ";
  let body = `${userName}さん\nZemiPressの出欠状況が「${status}」に更新されました。\nhttps://script.google.com/a/macros/oit.ac.jp/s/AKfycbwiyeXQoOj--_So-Xsfc8SiRT1P9wpFj7vF2ViHA7tc3gFmyxPPoUGidXxEwkVB35f3/exec\n※これはZemiPressからの自動送信メールです。`;
  sendEmail(userEmail, subject, body);
}

// // ステータスを更新する（発表済み）
// function updatePresentationStatus(userEmail, status) {
//   // sheetのuserEmailの発表ステータスをstatusに更新する
// }

// パスコードを取得
function getPasscode() {
  // 認証用パスコード
  // const passcode = spred.getSheetByName('passcode').getRange('A1').getValue();

  // スクリプトプロパティから取得
  const passcode = PropertiesService.getScriptProperties().getProperty('PASSCODE');
  return passcode;
}

// パスコード認証
function authenticatePasscode(passcode) {
  // 正しいパスコードと比較して認証する
  let correctPasscode = getPasscode();
  if (passcode != correctPasscode) {
    return false;
  }
  return true;
}

// 更新時刻取得
function getLastUpdatedTime() {
  // 更新時刻をseetから取得して返す
  // return spred.getSheetByName('lastUpdated').getRange('A1').getValue();

  // NotionAPIで更新時刻を取得して返す
  const notionHeaders = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${notionToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    payload:
      JSON.stringify({
        "sorts": [
          {
            "property": "updated_time",
            "direction": "descending"
          }
        ],
        "page_size": 1
      }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(`https://api.notion.com/v1/databases/${lastUpdatedDatabaseId}/query`, notionHeaders);
  const json = JSON.parse(response.getContentText());
  let lastUpdatedTime = "";

  if (json.results.length > 0) {
    lastUpdatedTime = json.results[0].properties.updated_time.date.start;
  }

  const updateDate = new Date(lastUpdatedTime);
  const formattedTime = Utilities.formatDate(updateDate, "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");

  return formattedTime;
}

// 現在の時刻を取得
function getCurrentTime() {
  // 現在の時刻を返す
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getDate()).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 更新時刻記録
function recordLastUpdatedTime() {
  // 現在時刻を更新時刻として記録
  let currentTime = getCurrentTime();
  // spred.getSheetByName('lastUpdated').getRange('A1').setValue(currentTime);

  // NotionAPIで更新時刻を記録
  const notionHeaders = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${notionToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    payload:
      JSON.stringify({
        parent: { database_id: lastUpdatedDatabaseId },
        properties: {
          update: {
            title: [
              { text: { content: "更新完了" } }
            ]
          },
          updated_time: {
            date: {
              start: currentTime
            }
          }
        }
      }),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(notionApiUrlPage, notionHeaders);
}

// Webアプリのメイン処理
function doGet(e, msg = "") {

  // パラメータから現在のページを取得
  let nowPage = e.parameter.page;
  // デフォルトはindexページ
  let file = 'index';
  // 指定があればそのページを表示
  if (nowPage) {
    file = nowPage;
  }

  // ユーザーが登録されていなければ登録ページへ強制遷移
  if (!isUserRegistered(getUserEmail())) {
    file = 'register';
  }

  // HTMLテンプレートの取得
  const template = HtmlService.createTemplateFromFile(file);

  /* メッセージをテンプレートにセット */
  template.url = getNowUrl();
  template.msg = msg;
  template.usersByPresentationOrder = getUsersByPresentationOrder();
  template.userName = getUserName();
  template.userEmail = getUserEmail();
  template.lastUpdatedTime = getLastUpdatedTime();

  // メッセージをテンプレートに渡す
  const html = template.evaluate();
  // HTML出力の設定
  html.setTitle("ZemiPres");  //  タイトル設定
  //  スタイル設定
  html.addMetaTag('viewport', 'width=device-width, initial-scale=1');  //  スマホ対応

  return html;

}

function doPost(e) {

  // パラメータの取得
  let passcode = e.parameters.passcode;
  let attendance = parseInt(e.parameters.attendance);

  //  ユーザー登録
  if (passcode) {

    // パスコード認証
    if (!authenticatePasscode(passcode)) {
      return doGet(e, msg = "認証用パスコードが間違っています。");
    }

    // 既に登録されている場合はエラー
    if (isUserRegistered(getUserEmail())) {
      return doGet(e, msg = "既にユーザー登録されています。");
    } else {
      // ユーザー登録
      registerUser(getUserEmail(), getUserName());

      // 登録完了メール送信
      sendRegistrationCompleteEmail(getUserEmail(), getUserName());

      return doGet(e, msg = "ユーザー登録が完了しました。");
    }

  }

  // 出欠ステータス更新
  if (attendance) {

    let attendanceList = [null, "出席", "欠席"];

    // 出欠ステータス更新
    updateAttendanceStatus(getUserEmail(), attendanceList[attendance]);

    // ステータス更新完了メール送信
    sendStatusUpdateCompleteEmail(getUserEmail(), getUserName(), attendanceList[attendance]);

    return doGet(e, msg = "出欠ステータスを更新しました。");
  }

}

//config読み込み
function getConfig() {
  // return spred.getSheetByName('config').getRange('A1').getValue();
  // スクリプトプロパティから取得
  return PropertiesService.getScriptProperties().getProperty('TRIGGER_STATUS');
}

// include用関数
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// テスト
function test() {
  console.log(getConfig());
  console.log(getUserEmail());
  console.log(getUserName());
}