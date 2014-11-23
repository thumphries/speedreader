var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
pageMod.PageMod({
  include: /.*/,
  contentScriptFile: [data.url("jquery.min.js"),
                      data.url("speedreader.user.js")],
  contentScriptWhen: "end"
});
