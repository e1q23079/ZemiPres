function doGet(e) {

  const file = 'index';
  const template = HtmlService.createTemplateFromFile(file);
  const html = template.evaluate();

  html.setTitle("ZemiPress");  //  タイトル設定

  html.addMetaTag('viewport', 'width=device-width, initial-scale=1');  //  スマホ対応

  return html;

}