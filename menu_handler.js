function getCurrentValue() {
    chrome.storage.sync.get({ "txt_state": '' }, (res) => {
        console.log(res)
        if (res['txt_state'] === "") {
            chrome.storage.sync.set({ "txt_state": false }, () => {
                document.getElementById('activation').checked = false
            })
        } else {
            document.getElementById('activation').checked = res['txt_state']
        }
    })
}

function checkOption() {
    chrome.storage.sync.get({ "txt_state": '' }, (res) => {
        console.log("from chkec", res)
        chrome.storage.sync.set({ "txt_state": !res['txt_state'] }, () => {
            document.getElementById('activation').checked = !res['txt_state']
        })
    })
}

document.addEventListener('DOMContentLoaded', getCurrentValue);
document.getElementById('activation').addEventListener('change', checkOption);