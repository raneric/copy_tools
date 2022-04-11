function save() {
    let list_s = document.getElementById('list_choice').value;
    chrome.storage.sync.set({
        list_symbol: list_s,
    }, function () {
        let current_choice = document.getElementById('option_choice');
        current_choice.textContent = "Current choice : " + list_s;
    });
}

function getCurrentValue() {
    chrome.storage.sync.get({
        list_symbol: '',
    }, function (items) {
        let current_choice = document.getElementById('option_choice');
        current_choice.textContent = "Current choice : " + items.list_symbol;
    });
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
document.getElementById('save').addEventListener('click', save);
