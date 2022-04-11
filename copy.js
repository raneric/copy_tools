//------------------------- GLOBAL VARIABLE AND CONSTANT -----------------------------------------------
var globalText = "";
var badgetText = "0";
var isSimpleText = true;
var isListWithNumber = false;
var formatFirstLine = false;
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
const ACCEPTED_FORMAT = ["jpg", "jpeg", "gif", "png", "tif"];

chrome.commands.onCommand.addListener((command) => {
	getListSymbol();
	switch (command) {
		case "copy_and_format":
			isSimpleText = false;
			formatText();
			formatFirstLine = false;
			break;
		case "reset_data":
			injectScript();
			resetData();
			clearTextStorage();
			break;
		case "format_first_line":
			isSimpleText = false;
			formatText();
			formatFirstLine = true;
			break;
		case "concat_text":
			isSimpleText = true;
			formatText();
			formatFirstLine = false;
			break;

	}
	updateBadgeText({ text: badgetText });
});

//-------------------------- SCRIPT INECTION ------------------------------------------------
function injectScript() {
	chrome.tabs.getSelected(null, (tab) => {
		chrome.tabs.executeScript(tab.id, { file: 'listnerFile.js' }, () => {
		});
	})
}

chrome.storage.onChanged.addListener((storedItem, name) => {
	if (Object.keys(storedItem)[0] === "all_text") {
		let textToC = storedItem['all_text'].newValue;
		textToC = textToC.replace(/\t{1,20}/g, ": ");
		textToC = textToC.replace(/• •/g, "•");
		textToC = textToC.replace(/• ●/g, "•");
		textToC = textToC.replace(/• (-+|\.)/g, " - ");
		textToC = textToC.replace(/\n{2,50}/g, "\n\n");
		//textToC = textToC.replace(/\s{2,80}/g, " ");

		copyToClipBoard(textToC);
	}
})

//-------------------------- CONTEXT MENU INIT ------------------------------------------------
chrome.contextMenus.create({
	"title": "Copy URL",
	"contexts": ["image"],
	"onclick": onClickImageHandler
});

//----------------------------------------------------------------------------------------------
//---------------------------- IMAGE URL -------------------------------------------------------
//----------------------------------------------------------------------------------------------
function onClickImageHandler(info, tab) {
	let url = removeUrlParam(info.srcUrl);
	let imageExt = getImageExtentions(url);

	/*if (!isAcceptedFormat(imageExt)) {
		convertImage(url);
	}*/

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

function isAcceptedFormat(imageExtention) {
	return (ACCEPTED_FORMAT.find(ext => ext === imageExtention) === undefined) ? false : true;
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
		url = url.substring(0, url.lastIndexOf(".") + 1) + urlExt.toLowerCase();
	}
	return url;
}
//----------------------------------------------------------------------------------------------
//---------------------------- TEXT ------------------------------------------------------------
//----------------------------------------------------------------------------------------------

/**
*	Main function for the text formatter
**/
function formatText() {
	let textFromClipboard = getClipboardData();

	if (!isSimpleText) {
		let formatedText = buildText(textFromClipboard);
		globalText = (globalText != "") ? globalText + "\n\n" + formatedText : formatedText;
	}

	if (isSimpleText) {
		let newText = textFromClipboard;
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

	if (!isListWithNumber) {
		if (MULTILINE_REGEX.test(str))
			str = deleteMultiLineBreak(str);

		if (formatFirstLine)
			str = LIST_SYMBOL + " " + str;
		formatedText = str.replace(/\n/g, "\n" + LIST_SYMBOL + " ");
	}

	if (isListWithNumber) {
		str = str.replace(/\n{2,20}/g, "\n");
		formatedText = addNumber(splitTextToArray(str));
	}

	return formatedText;
}

function deleteMultiLineBreak(str) {
	return str.replace(/\n{2,20}/g, "\n");
}

/**
*	Cut text to 1700<
*	@Param str : type String ;  text to cut
*/
function cutAllText(textes) {
	textes = textes.substr(0, 1699);
	return (textes.lastIndexOf(".") < textes.lastIndexOf("\n")) ?
		textes.substr(0, textes.lastIndexOf("\n") + 1) :
		textes = textes.substr(0, textes.lastIndexOf(".") + 1);
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
				isListWithNumber = false;
				LIST_SYMBOL = DOT;
				break;
			case 'dash':
				isListWithNumber = false;
				LIST_SYMBOL = DASH;
				break;
			case 'square':
				isListWithNumber = false;
				LIST_SYMBOL = SQUARE;
				break;
			case 'number':
				isListWithNumber = true;
				break;
			default:
				isListWithNumber = false;
				LIST_SYMBOL = DOT;
				udateListSymbol(DOT);
		}
	});
}

/**
*	Split String with \n as separator
**/
function splitTextToArray(textes) {
	let textArray = textes.split("\n");
	return textArray;
}

/**
*	Add number for list
**/
function addNumber(textArray) {
	let newStringText = "";
	let j = 1;
	for (let i = 0; i < textArray.length; i++) {

		if (i === 0 && !formatFirstLine) {
			newStringText += textArray[i] + "\n";
			continue;
		}

		newStringText += j + ". " + textArray[i] + "\n";
		j++;
	}
	return newStringText;
}

/**
*	Format tab with more than 2 column
**/
function formatMultiDTab(textes) {
	let textesArray = splitTextToArray(textes);
	let newStringText = "";
	for (let i = 0; i < textesArray.length; i++) {
		newStringText = newStringText + "\n" + reverseArrayIndex(textesArray[i]);
	}
	return newStringText;
}

/**
*	Revese 1 and 2 index in array
**/
function reverseArrayIndex(textes) {
	let textesArray = splitTextTo3DArray(textes);
	let unit = (textesArray[1] === "-") ? "" : textesArray[1];
	return textesArray[0] + " : " + textesArray[2] + " " + unit;
}

/**
*	Split String with \t as separator
**/
function splitTextTo3DArray(textes) {
	let textArray = textes.split("\t");
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
function copyToClipBoard(textes) {
	const tempHtmlElement = document.createElement('textarea');
	textes = textes.replace(/\n{3,20}/g, "\n\n");
	badgetText = textes.length.toString();

	if (textes.length > 1699) {
		badgetText = "OK";
		textes = cutAllText(textes);
	}
	updateBadgeText({ text: badgetText.toString() });

	tempHtmlElement.value = textes;
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
	let urlToRequest = `${API_URI}${sourceFileType}/to/${convertTo}?${API_SECRET}&Url=${fileUrl}${API_FILE_STORE_STATE}`;
	return urlToRequest;

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

function clearTextStorage() {
	chrome.storage.sync.set({ all_text: "" }, () => {

	});
}

function resetData() {
	globalText = "";
	badgetText = "0";
}

function updateBadgeText(textObject) {
	chrome.browserAction.setBadgeText(textObject);
}

function udateListSymbol(list_symbol) {
	chrome.storage.sync.set({ list_symbol }, () => {

	})
}