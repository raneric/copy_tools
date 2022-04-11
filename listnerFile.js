document.addEventListener('copy', function (e) {
    let textToCopy = getSelectedItem();
    updateAllText(textToCopy);
    e.preventDefault();
});

/**
 * Get the current selected text on the web site
 * @returns : formated text
 */
function getSelectedItem() {
    let olTagTest = isFocusNodeParentOlTag();
    let firstLineState = isAnchoreNodeLiTag();
    return isFocusNodeParentLiTag() ?
        buildText(window.getSelection().toString(), firstLineState, olTagTest) :
        window.getSelection().toString();
}

/**
 * 
 * @returns 
 */
function isFocusNodeParentOlTag() {
    return (window.getSelection().focusNode.parentNode.parentElement.tagName === 'OL') ? true : false;
}

/**
 * 
 * @returns 
 */
function isFocusNodeParentLiTag() {
    return (window.getSelection().focusNode.parentElement.tagName === 'LI') ? true : false;
}

/**
 * 
 * @returns 
 */
function isAnchoreNodeLiTag() {
    return (window.getSelection().anchorNode.parentElement.tagName === 'LI') ? true : false;
}

/**
 * 
 * @param {*String} str all concatenated text to be stored on chrome store
 */
async function updateAllText(str) {
    let current_text = await getText();
    let all_text = (current_text === "") ? str : current_text + "\n\n" + str;
    return new Promise((resolver, reject) => {
        chrome.storage.sync.set({ all_text }, resolver)
    }).then(res => {
        return;
    })
}

/**
 * get all text stored in chrome store
 * @returns {String} Retrn a string data of all text
 */
function getText() {
    return new Promise((resolver, reject) => {
        chrome.storage.sync.get({ all_text: '' }, resolver)
    }).then(all_text => {
        return all_text['all_text'];
    })
}

/**
 * Add symbol to text, split text separeted by \n to an array and add symbol to each line
 * @param {String} str String to fromated
 * @param {Boolean} firstLineState if firste need to be formated
 * @returns {String}
 */
function buildText(str, firstLineState, olTagState) {
    let formatedText = "";
    let arrayString = str.split('\n');
    let list_symbol = "•";
    let j = 0;
    for (let i = 0; i < arrayString.length; i++) {
        if (i === 0 && !firstLineState) {
            formatedText += arrayString[i];
            j++;
            continue;
        } else if (i === 0 && firstLineState) {
            j = i + 1;
            formatedText += addSymbol(arrayString[i], (olTagState) ? `${j}.` : list_symbol);
            j++;
            continue;
        }

        if (arrayString[i] === "") {
            continue;
        } else {
            formatedText += addSymbol(arrayString[i], (olTagState) ? `${j}.` : list_symbol);
        }
        j++;
    }
    return formatedText;
}

/**
 * 
 * @param {*} symbol 
 * @param {*} str 
 */
function addSymbol(str, list_symbol) {
    return "\n" + list_symbol + " " + str;
}

async function getListSymbol() {
    return new Promise((resolver, reject) => {
        chrome.storage.sync.get({ list_symbol: '' }, resolver);
    }).then(list_symbol => {
        return list_symbol['list_symbol'];
    })
}