var inputJson = document.getElementById("json");
var inputXml = document.getElementById("xml");
var box = document.getElementById("processDisplay");
var btnDownload = document.getElementsByClassName("download")
// var btnDownload = document.getElementById("download");
var lastestTransIndex = 0;
var targetLanguage = "&langpair=ko|vi"
var baseUrl = "https://api.mymemory.translated.net/get?q="
var baseUrl2 = "https://translated-mymemory---translation-memory.p.rapidapi.com/api/get?langpair="
var targetLanguage2 = "ko|vi&q="
// https://api.mymemory.translated.net/get?q=Hello World!&langpair=en|it
var fileLength = 0;
var fileReader = new FileReader();
var x2js = new X2JS();

var buffer = []

var flagbuffer = []

var startTransIndex = 0
var maxIndex = startTransIndex + 10

if (inputJson) {
    inputJson.addEventListener("change", function () {
        showDownLoadBtn()
        getJsonObject(inputJson, "json")
            .then(function (file) {
                flagbuffer = file.flag
                console.log(flagbuffer)
            })
    });
}
if (inputXml) {
    inputXml.addEventListener('change', function () {
        showDownLoadBtn()
        getJsonObject(inputXml, "xml")
            .then(function (file) {
                // maxIndex = file.messages.message.length
                fetchFromGoogleTranslateApi(file)
            })
    })
}
function getUrl(question) {
    url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' +
        "ko" +
        '&tl=' +
        "vi" +
        '&dt=t&q=' +
        encodeURI(question.replace(/ /g, ''));
    return url
}

async function fetchFromGoogleTranslateApi(file) {

    for (let index = 0; index < maxIndex; index++) {
        var q = file.messages.message[index].__cdata
        var qId = file.messages.message[index]._mid
        var url = getUrl(q)
        const data = await fetchData(url, qId, q)
        console.log(url)
        getGoogleTranslateApiResult(data[0], q, index, qId)
        lastestTransIndex = index
    }
    showLastestTransIndex()

}

async function fetchData(url, qId, q) {
    const response = await fetch(url)
    if (!response.ok) saveTranslatedResult(qId, q, "", "failed")
    return response.json()
}


function getGoogleTranslateApiResult(dataReponse, question, index, qId) {
    var raw = ""
    dataReponse.forEach(element => {
        raw = raw + element[0]
    });
    var translateText = trimTranslateText(raw)
    saveTranslatedResult(qId, question, translateText, "ok")
}

function trimTranslateText(s) {
    sb = s.replace(/\\ n/g, "\n")
    s = sb.replace("% d", " %d")
    sb = s.replace("# ", "#");
    return sb
}

function saveTranslatedResult(index, question, answer, flag) {
    buffer.push({ _mid: index, __cdata: answer })
    flagbuffer.push({ _mid: index, __cdata: flag })
    showTranslateItemResult(index, question, answer, flag)
}

function prepareXmlFile() {
    buffer.sort(function (a, b) {
        return (a._mid - b._mid);
    })
    var baseJson = {
        "messages": {
            "message": buffer,
            "_name": "UIString",
            "_lang": "VI_US"
        }
    }
    console.log("Repair xml file")
    xml = x2js.json2xml_str(baseJson);
    return xml
}

function prepareJsonFlagFile() {
    flagbuffer.sort(function (a, b) {
        return (a._mid - b._mid);
    })
    return JSON.stringify({ flag: flagbuffer });
}
function downloadFlag() {
    download(prepareJsonFlagFile(), "uistring_VI_flag_" + lastestTransIndex + ".json")
}
function downloadXml() {
    download(prepareXmlFile(), "uistring_VI_" + lastestTransIndex + ".xml")
}

function download(file, name) {
    console.log("Ready for download " + name)
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(file));
    element.setAttribute('download', name);
    element.style.display = 'block';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}



function getJsonObject(file, type) {
    return new Promise(function (resolve, reject) {
        fileReader.readAsText(file.files[0], "UTF-8")
        fileReader.onloadend = (e) => {
            const fileContent = e.target.result
            if (type == "json") resolve(JSON.parse(fileContent));
            else resolve(x2js.xml_str2json(fileContent));
        }
    });
}

function showDownLoadBtn() {
    btnDownload[0].style.display = 'block'
    btnDownload[1].style.display = 'block'
}

function showTranslateItemResult(qId, question, answer, status) {
    box.append("Id: " + qId + "  -  " + question + " - " + answer + " - "+ status)
    box.appendChild(document.createElement("br"))
}

function showLastestTransIndex() {
    box.append('Lastest translate index: ' + lastestTransIndex)
    box.appendChild(document.createElement("br"))
}

