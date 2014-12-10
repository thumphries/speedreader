// Add an item to right-click menu
var menu = document.createElement("menu");
menu.setAttribute("type", "context");
menu.setAttribute("id", "sprd-gm-menu");
var item = document.createElement("menuitem");
item.setAttribute("label", "Speed-read selection");
item.onclick = function () { processSelection(); };
menu.appendChild(item);
document.body.appendChild(menu);
document.body.setAttribute("contextmenu", "sprd-gm-menu");
