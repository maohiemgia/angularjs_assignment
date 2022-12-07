let dbUrl = "http://localhost:5000";

function getIdByUrl() {
	var querystring = location.search;
	var getUrlVar = new URLSearchParams(querystring);
	var id = getUrlVar.get("id");

	return id;
}

function displayErr(errContent, errId) {
	if (errContent.length < 1) {
		return (document.querySelector(
			"#" + errId
		).nextElementSibling.innerText = "");
	}
	return (document.querySelector("#" + errId).nextElementSibling.innerText =
		errContent);
}

export { dbUrl, displayErr, getIdByUrl };
