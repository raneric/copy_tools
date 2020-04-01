chrome.commands.onCommand.addListener((command) => {
	getListSymbol();
	switch (command) {
		case "copy_and_format":
			formatText(false); // function param type boolean(simpleText)
			formatFirstLineState = false;
			chrome.browserAction.setBadgeText({ text: badgetText });
			break;
		case "reset_data":
			resetData();
			chrome.browserAction.setBadgeText({ text: badgetText });
			break;
		case "format_first_line":
			formatText(false); // function param type boolean(simpleText)
			formatFirstLineState = true;
			chrome.browserAction.setBadgeText({ text: badgetText });
			break;
		case "concat_text":
			formatText(true); // function param type boolean(simpleText)
			formatFirstLineState = false;
			chrome.browserAction.setBadgeText({ text: badgetText });
			break;

	}
});

//-------------------------- CONTEXT MENU INIT ------------------------------------------------
chrome.contextMenus.create({
	"title": "Copy URL",
	"contexts": ["image"],
	"onclick": onClickImageHandler
});
//------------------------- GLOBAL VARIABLE AND CONSTANT -----------------------------------------------
var globalText = "";
var badgetText = "0";
var listWithNumber = false;
var formatFirstLineState = false;
var LIST_SYMBOL = "";
const DOT = "•";
const DASH = "-";
const SQUARE = "";
const MULTILINE_REGEX = /\n{2,20}/;
const MULTI_TAB_REGEX = /\t{1,20}/;
const API_URI = "https://v2.convertapi.com/convert/";
const API_SECRET = "";
const API_FILE_STORE_STATE = "&StoreFile=true";
const TAB_RPLC = " : ";
var accepted_format = ["jpg", "jpeg", "gif", "png", "tif"];

//----------------------------------------------------------------------------------------------
//---------------------------- IMAGE URL -------------------------------------------------------
//----------------------------------------------------------------------------------------------
function onClickImageHandler(info, tab) {
	let url = removeUrlParam(info.srcUrl);
	let imageExt = getImageExtentions(url);

	if (!isAcceptedFormat(imageExt)) {
		convertImage(url);
	}
	url = extentionToLowerCase(url);
	copyToClipBoard(url);
}

/**
*	Convert non-accepted file format
*	@Param type String : file url to be converted
*/
function convertImage(url) {
	let jpgUrl = "";
	let fileArray = [];
	let apiUrl = buildApiUrl("web", "jpg", url);
	sendRequest(apiUrl);
}

function isAcceptedFormat(imageExt) {
	return (accepted_format.find(ext => ext === imageExt) === undefined) ? false : true;
}

function removeUrlParam(url) {
	return (url.indexOf("?") != -1) ? url.substring(0, url.indexOf("?")) : url;
}

function getImageExtentions(url) {
	return url.substring(url.lastIndexOf(".") + 1);;
}

function extentionToLowerCase(url) {
	let urlExt = getImageExtentions(url);

	if (urlExt == urlExt.toUpperCase()) {
		url = url.substring(0, url.lastIndexOf(".")) + urlExt.toLowerCase();
	}
	return url;
}
//----------------------------------------------------------------------------------------------
//---------------------------- TEXT ------------------------------------------------------------
//----------------------------------------------------------------------------------------------

/**
*	Main function for the text formatter
**/
function formatText(simpleText) {
	let str = getClipboardData();

	if (!simpleText) {
		let formatedText = buildText(str);
		globalText = (globalText != "") ? globalText + "\n\n" + formatedText : formatedText;
	}

	if (simpleText) {
		let newText = str;
		newText = newText.replace(/\n{3,20}/g, "\n");
		newText = newText.replace(/\t{1,20}/g, TAB_RPLC);
		globalText = (globalText != "") ? globalText + "\n\n" + newText : newText;
	}
	copyToClipBoard(globalText);
}

/**
*	Format text by adding DASH or DOT
*	@Param str : type String ;  text to be formated
*	@Param formatFirstLineState: type boolean ; parm if first line need to be formated
**/
function buildText(str) {
	let formatedText;

	if (!listWithNumber) {
		if (MULTILINE_REGEX.test(str))
			str = deleteMultiNewLine(str);

		if (formatFirstLineState)
			str = LIST_SYMBOL + " " + str;
		formatedText = str.replace(/\n/g, "\n" + LIST_SYMBOL + " ");
	}

	if (listWithNumber) {
		str = str.replace(/\n{2,20}/g, "\n");
		formatedText = addNumber(splitTextToArray(str));
	}


	return formatedText;
}

function resetData() {
	globalText = "";
	badgetText = "0";
}

function deleteMultiNewLine(str) {
	return str.replace(/\n{2,20}/g, "\n");
}

/**
*	Cut text to 1700<
*	@Param str : type String ;  text to cut
*/
function cutAllText(str) {
	str = str.substr(0, 1699);
	return (str.lastIndexOf(".") < str.lastIndexOf("\n")) ?
		str.substr(0, str.lastIndexOf("\n") + 1) :
		str = str.substr(0, str.lastIndexOf(".") + 1);
}

/**
*	Get the current state of list_symbol from chrome.storage
*/
function getListSymbol() {
	chrome.storage.sync.get({
		list_symbol: '',
	}, function (items) {
		let current_choice = items.list_symbol;
		switch (current_choice) {
			case 'dot':
				listWithNumber = false;
				LIST_SYMBOL = DOT;
				break;
			case 'dash':
				listWithNumber = false;
				LIST_SYMBOL = DASH;
				break;
			case 'square':
				listWithNumber = false;
				LIST_SYMBOL = SQUARE;
				break;
			case 'number':
				listWithNumber = true;
				break;
			default:
				listWithNumber = false;
				LIST_SYMBOL = DOT;
		}
	});
}

/**
*	Split String with \n as separator
**/
function splitTextToArray(str) {
	let textArray = str.split("\n");
	return textArray;
}

/**
*	Add number for list
**/
function addNumber(textArray) {
	let strText = "";
	let j = 1;
	for (let i = 0; i < textArray.length; i++) {

		if (i === 0 && !formatFirstLineState) {
			strText += textArray[i] + "\n";
			continue;
		}

		strText += j + ". " + textArray[i] + "\n";
		j++;
	}
	return strText;
}

/**
*	Format tab with more than 2 column
**/
function formatMultiDTab(str) {
	let array = splitTextToArray(str);
	let newStr = "";
	for (let i = 0; i < array.length; i++) {
		newStr = newStr + "\n" + reverseArrayIndex(array[i]);
	}
	return newStr;
}

/**
*	Revese 1 and 2 index in array
**/
function reverseArrayIndex(str) {
	let array = splitTextTo3DArray(str);
	let unit = (array[1] === "-") ? "" : array[1];
	return array[0] + " : " + array[2] + " " + unit;
}

/**
*	Split String with \t as separator
**/
function splitTextTo3DArray(str) {
	let textArray = str.split("\t");
	return textArray;
}

//----------------------------------------------------------------------------------------------
//---------------------------- CLIPBOARD FUNCTION ----------------------------------------------
//----------------------------------------------------------------------------------------------

/**
*	Get data from clipboard
*	@Param formatFirstLineState: type boolean ; parm if first line need to be formated
*	@Param simpleText: type boolean ; param if no need to format text
**/
function getClipboardData(str) {
	const tempHtmlElement = document.createElement('textarea');
	tempHtmlElement.style.position = 'absolute';
	tempHtmlElement.style.left = '-9999px';

	document.body.appendChild(tempHtmlElement);
	tempHtmlElement.select();

	document.execCommand('paste');

	let textFromClipboard = tempHtmlElement.value
	document.body.removeChild(tempHtmlElement);
	return textFromClipboard;
}

/**
*
*/
function copyToClipBoard(str) {
	const tempHtmlElement = document.createElement('textarea');
	str = str.replace(/\n{3,20}/g, "\n\n");
	badgetText = str.length.toString();

	if (str.length > 1699) {
		badgetText = "OK";
		str = cutAllText(str);
	}

	tempHtmlElement.value = str;
	tempHtmlElement.setAttribute('readonly', '');
	tempHtmlElement.style.position = 'absolute';
	tempHtmlElement.style.left = '-9999px';

	document.body.appendChild(tempHtmlElement);
	tempHtmlElement.select();
	document.execCommand('copy');
	document.body.removeChild(tempHtmlElement);
}

//----------------------------------------------------------------------------------------------
//---------------------------- AJAX REQUEST ----------------------------------------------------
//----------------------------------------------------------------------------------------------
function sendRequest(url) {
	let jpgUrl = "";
	fetch(url).then((res) => {
		return res.json();
	}).then((jsRes) => {
		jpgUrl = jsRes['Files'][0].Url;
		clipboardData(jpgUrl);
	})
}

function getJpgUrl(resArray) {
	return resArray['Files'][0].Url;
}

function buildApiUrl(sourceFileType, convertTo, fileUrl) {
	return urlToRequest = API_URI + sourceFileType
		+ "/to/" + convertTo + "?" + API_SECRET
		+ "&Url=" + fileUrl + API_FILE_STORE_STATE;
}

//----------------------------------------------------------------------------------------------
//---------------------------- OTHER FUNCTION ----------------------------------------------
//----------------------------------------------------------------------------------------------

function sendNotification(message) {
	let notifOptions = {
		type: "basic",
		iconUrl: "copy.png",
		title: "",
		message: ""
	}
	notifOptions.message = message;
	chrome.notifications.create("text_lenght", notifOptions, () => { });
}

function getAllTabs() {
	chrome.tabs.getAllInWindow(null, function (tabs) {
		chrome.tabs.sendRequest(tabs[1].id, { test: "test" }, (data) => {
			console.log(data);
		})
		console.log(tabs[1].id);
	});
}

function addInfo(str) {
	const INFO = "?utm_source=directindustry.com&utm_medium=product-placement&utm_campaign=hq_directindustry.productentry_online-portal&utm_content=C-00031727";
	let url = str + INFO;
	copyToClipBoard(url);
}
