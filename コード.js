/*------------------------------------------------------------------------------
  コード.js
  Google Apps Script (GAS) のメインコード
--------------------------------------------------------------------------------*/

// スプレッドシートの取得
const spred = SpreadsheetApp.getActive();
// シートの取得
const sheet = spred.getSheetByName('test'); // 開発環境
// const sheet = spred.getSheetByName('product'); // 本番環境

// 現在のWebアプリのURLを取得
function getNowUrl() {
  return ScriptApp.getService().getUrl();
}

// Googleアカウントでログインしているユーザーのメールアドレスを取得
function getUserEmail() {
  return "e1q23000@example.com";
}

// Googleアカウントでログインしているユーザーの名前を取得
function getUserName() {
  return "北海道 太郎";
}

// メールを配信する
function sendEmail(to, subject, body) {
  // MailApp.sendEmail(送信先, 件名, 本文);
}

// 特定のユーザーの発表順番を取得
function getUserPresentationOrder(userEmail) {
  // sheetからuserEmailの発表順を取得して返す
  let data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === userEmail) {
      return data[i][4];
    }
  }
  return null;
}

// 全体にメールを送信する
function sendEmailToAllUsers() {
  // sheetから全ユーザーのメールアドレスを取得し、sendEmail関数で一括送信する
  let users = getAllUsers();
  let subject = "発表順番管理ツール ZemiPress からのお知らせ";
  for (let i = 0; i < users.length; i++) {
    let body = `${getLastUpdatedTime()}に、発表の順番が更新されました。\n${users[i].name}さんは${getUserPresentationOrder(users[i].email)}番目の発表です。\n詳細は、ZemiPressをご確認ください。\nhttps://script.google.com/a/macros/oit.ac.jp/s/AKfycbwiyeXQoOj--_So-Xsfc8SiRT1P9wpFj7vF2ViHA7tc3gFmyxPPoUGidXxEwkVB35f3/exec\nまた、明日の発表を欠席される方は、欠席申請をお願いいたします。\n※これはZemiPressからの一斉メールです。`;
    sendEmail(users[i].email, subject, body);
  }
}

// トリガー処理
function triggerSendEmailToAllUsers() {
  resetStatus();  // ステータスリセット
  assignPresentationOrder();  // 発表順をランダムに割り振る
  recordLastUpdatedTime();  // 更新時刻記録
  sendEmailToAllUsers();
}

// ユーザー登録
function registerUser(userEmail, userName) {
  // sheetに[userEmail, userName, null, null, null]を追加
  sheet.appendRow([userEmail, userName, null, null, null]);
}

// ユーザーが登録されているか確認
function isUserRegistered(userEmail) {
  // sheetにuserEmailが存在するか確認し、存在すればtrue、存在しなければfalseを返す
  let data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === userEmail) {
      return true;
    }
  }
  return false;
}

// DBから全ユーザー情報を取得
function getAllUsers() {
  // sheetから{email: '', name: '', attendance: '', presentation: '', number: ''}の配列を返す
  let data = sheet.getDataRange().getValues();
  let users = [];
  for (let i = 0; i < data.length; i++) {
    users.push({
      email: data[i][0],
      name: data[i][1],
      attendance: data[i][2],
      presentation: data[i][3],
      number: data[i][4]
    });
  }
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
  // sheetのuserEmailの発表順をorderNumberに更新する
  let data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === userEmail) {
      sheet.getRange(i + 1, 5).setValue(orderNumber);
      break;
    }
  }
}

// 発表順をランダムに割り振る
function assignPresentationOrder() {
  // sheetの全ユーザーの発表順をランダムに割り振る
  let users = getAllUsers();
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
    updatePresentationOrder(users[i].email, numbers[i]);
  }
}

// ステータスをリセットする
function resetStatus() {
  // sheetの全ユーザーの出欠、発表ステータス、発表順をリセットする
  let data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    sheet.getRange(i + 1, 3).setValue("出席");
    sheet.getRange(i + 1, 4).setValue(null);
    sheet.getRange(i + 1, 5).setValue(null);
  }
}

// ステータスを更新する（出席）
function updateAttendanceStatus(userEmail, status) {
  // sheetのuserEmailの出欠ステータスをstatusに更新する
  let data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === userEmail) {
      sheet.getRange(i + 1, 3).setValue(status);
      break;
    }
  }
}

// // ステータスを更新する（発表済み）
// function updatePresentationStatus(userEmail, status) {
//   // sheetのuserEmailの発表ステータスをstatusに更新する
// }

// パスコードを取得
function getPasscode() {
  // 認証用パスコード
  const passcode = spred.getSheetByName('passcode').getRange('A1').getValue();
  return passcode;
}

// パスコード認証
function authenticatePasscode(passcode) {
  // 正しいパスコードと比較して認証する
  let correctPasscode = getPasscode();
  return true;
}

// 更新時刻取得
function getLastUpdatedTime() {
  // 更新時刻をseetから取得して返す
  return spred.getSheetByName('lastUpdated').getRange('A1').getValue();
}

// 現在の時刻を取得
function getCurrentTime() {
  // 現在の時刻を返す
  return "2024-01-02 14:30:00";
}

// 更新時刻記録
function recordLastUpdatedTime() {
  // 現在時刻を更新時刻として記録
  let currentTime = getCurrentTime();
  spred.getSheetByName('lastUpdated').getRange('A1').setValue(currentTime);
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

    // ユーザー登録
    registerUser(getUserEmail(), getUserName());

    return doGet(e, msg = "ユーザー登録が完了しました。");
  }

  // 出欠ステータス更新
  if (attendance) {

    let attendanceList = [null, "出席", "欠席"];

    // 出欠ステータス更新
    updateAttendanceStatus(getUserEmail(), attendanceList[attendance]);

    return doGet(e, msg = "出欠ステータスを更新しました。");
  }

}

//config読み込み
function getConfig() {
  return spred.getSheetByName('config').getRange('A1').getValue();
}

// テスト
function test() {
  console.log(getConfig());
}