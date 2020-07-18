function save() {
	let list_s = document.getElementById('list_choice').value;
	chrome.storage.sync.set({
		list_symbol: list_s,
	}, function () {
		let current_choice = document.getElementById('option_choice');
		current_choice.textContent = "Choice : " + list_s;
	});
}

function getCurrentValue() {
	chrome.storage.sync.get({
		list_symbol: '',
	}, function (items) {
		let current_choice = document.getElementById('option_choice');
		current_choice.textContent = "Choice : " + items.list_symbol;
	});
}
document.addEventListener('DOMContentLoaded', getCurrentValue);
document.getElementById('save').addEventListener('click', save);