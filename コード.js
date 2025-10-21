/*------------------------------------------------------------------------------
  コード.js
  Google Apps Script (GAS) のメインコード
--------------------------------------------------------------------------------*/

// // スプレッドシートの取得
// const spred = SpreadsheetApp.getActive();
// // シートの取得
// const sheet = spred.getSheetByName('test'); // 開発環境
// // const sheet = spred.getSheetByName('product'); // 本番環境

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
  /*const mailOptions = {
    from: 'your-email@gmail.com',
    to: to,
    subject: subject,
    text: body
  };*/
  MailApp.sendEmail(to, subject, body);
    // MailApp.sendEmail(送信先, 件名, 本文);
}


// 全体にメールを送信する
function sendEmailToAllUsers(subject, body) {
  const users = getAllUsers();
  const emailList = users.map(user => user.email);
  const uniqueEmailList = [...new Set(emailList)];
  uniqueEmailList.forEach(email => {
    sendEmail(email, subject, body);
  });
  // sheetから全ユーザーのメールアドレスを取得し、sendEmail関数で一括送信する
}

// ユーザー登録
function registerUser(userEmail, userName) {
  // sheetに[userEmail, userName, null, null, null]を追加
}

// ユーザーが登録されているか確認
function isUserRegistered(userEmail) {
  // sheetにuserEmailが存在するか確認し、存在すればtrue、存在しなければfalseを返す
  return true;
}

// DBから全ユーザー情報を取得
function getAllUsers() {
  // sheetから{email: '', name: '', attendance: '', presentation: '', number: ''}の配列を返す
  return [{ email: 'e1q230000@example.com', name: '北海道 太郎', attendance: null, presentation: null, number: null }];
}

// データを発表順に並び変えて取得
function getUsersByPresentationOrder() {
  // sheetから発表順に並び変えた{email: '', name: '', attendance: '', presentation: ''}の配列を返す
  return [{ email: 'e1q230000@example.com', name: '北海道 太郎', attendance: '出席', presentation: null }];
}

// 発表順をランダムに割り振る
function assignPresentationOrder() {
  // sheetの全ユーザーの発表順をランダムに割り振る
}

// ステータスをリセットする
function resetStatus() {
  // sheetの全ユーザーの出欠、発表ステータス、発表順をリセットする
}

// ステータスを更新する（出席）
function updateAttendanceStatus(userEmail, status) {
  // sheetのuserEmailの出欠ステータスをstatusに更新する
}

// // ステータスを更新する（発表済み）
// function updatePresentationStatus(userEmail, status) {
//   // sheetのuserEmailの発表ステータスをstatusに更新する
// }

// パスコードを取得
function getPasscode() {
  // 認証用パスコード
  const passcode = spred.getSheetByName('config').getRange('B1').getValue();
  return passcode;
}

// パスコード認証
function authenticatePasscode(passcode) {
  // 正しいパスコードと比較して認証する
  let correctPasscode = getPasscode();
  if (passcode !== correctPasscode) {
    return false;
  }
  return true;
}

// 更新時刻取得
function getLastUpdatedTime() {
  // 更新時刻をseetから取得して返す
  return "2024-01-02 14:00:00";
}

// 現在の時刻を取得
function getCurrentTime() {
  // 現在の時刻を返す
    const now= new Date();
  const year = now.getFullYear();
  const month=String(now.getDate()).padStart(2,'0');
  const day=String(now.getDate()).padStart(2,'0');
  const hours=String(now.getHours()).padStart(2,'0');
  const minutes=String(now.getMinutes()).padStart(2,'0');
  const seconds=String(now.getSeconds()).padStart(2,'0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 更新時刻記録
function recordLastUpdatedTime() {
  // 現在時刻を更新時刻として記録
  let currentTime = getCurrentTime();
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
  html.setTitle("ZemiPress");  //  タイトル設定
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

// テスト
function test() {
  console.log(getUserEmail());
  console.log(getUserName());
}