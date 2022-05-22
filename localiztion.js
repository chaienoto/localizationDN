var inputJson = document.getElementById("json");
var inputXml = document.getElementById("xml");
var transFrom = document.getElementById("tf");
var transTo = document.getElementById("tt");
var transTobx = document.getElementById("transTo");
var currentTrans = document.getElementById("CurrentTransIndex");
var transStatus = document.getElementById("status");
var fileCount = document.getElementById("FileItemCount")
var box = document.getElementById("processDisplay");
var btnDownload = document.getElementsByClassName("download")
const baseUrl = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl='
const sourceLang = "ko"
const transLang = "vi"
var fileSize = 0;
var inputFile
var startTransIndex = 64202
var endTransIndex = 12
const cacheSize = 3000
var transBuffer = []
var flagBuffer = []
var handleErrosBuffer = []

var transCache = []
var flagCache = []

const x2js = new X2JS();
const fileReader = new FileReader();

if (transFrom) {
    transFrom.addEventListener("change", function () {
        startTransIndex = parseInt(transFrom.value) - 1
        currentTrans.innerText = startTransIndex + 1

    })
}
if (transTo) {
    transTo.addEventListener("change", function () {
        endTransIndex = parseInt(transTo.value) + 1
        transTobx.innerText = endTransIndex - 1
    })

}

// if (inputJson) {
//     inputJson.addEventListener("change", function () {
//         showDownLoadBtn()
//         readInputFile(inputJson, "json")
//             .then(function (file) {
//                 flagBuffer = file.flag
//                 console.log(flagBuffer)
//             })
//     });
// }



if (inputXml) {
    inputXml.addEventListener('change', function () {
        btnDownload[0].style.display = 'block'

        box.innerText = ""
        clearCache()
        clearBuffer()
        readInputFile(inputXml, "xml")
            .then(function (file) {
                fileSize = file.messages.message.length
                fileCount.innerText = "Total item: " + fileSize
                inputFile = file.messages.message
                btnDownload[4].style.display = 'block'


            })
    })
}
function start() {
    document.getElementById("tf").disabled = true;
    document.getElementById("tt").disabled = true;
    btnDownload[1].style.display = 'block'
    btnDownload[2].style.display = 'block'
    btnDownload[3].style.display = 'block'
    fetchFromGoogleTranslateApi(inputFile)
}

async function fetchFromGoogleTranslateApi(MsgData) {
    for (let index = startTransIndex; index < endTransIndex; index++) {
        currentTrans.innerText = index
        var mid = MsgData[index]._mid
        var _cdata = MsgData[index].__cdata
        var url = getUrl(_cdata)
        console.log("index: +" + index + " id: " + mid + " " + url)
        if (_cdata == "" || _cdata == null) {
            saveTranslatedResult(mid, _cdata, _cdata, "failed", url)
            return
        }
        const transData = await fetchData(url, mid, _cdata, index)
        await getGoogleTranslateApiResult(transData[0], mid, _cdata, index, url)
    }
}

function getUrl(_cdata) {
    return baseUrl + sourceLang + '&tl=' + transLang + '&dt=t&q=' + encodeURI(_cdata.replace(" ",""));
}

async function fetchData(url, mid, _cdata, index) {
    const response = await fetch(url)
    if (!response.ok) saveTranslatedResult(mid, _cdata, _cdata, "failed", url, index)
    return response.json()
}

async function getGoogleTranslateApiResult(transData, mid, _cdata, index, url) {
    var raw = ""
    if (transData == null) {
        saveTranslatedResult(mid, _cdata, _cdata, "failed", url, index)
        return
    }
    if (transData[0] == null || transData[0] == "") {
        saveTranslatedResult(mid, _cdata, _cdata, "failed", url, index)
        return
    }
    transData.forEach(element => { raw = raw + element[0] })
    var transTxt = trimTranslateText(raw)
    if (transTxt === "\\N" || transTxt === "\\n" || transTxt === "\\N\\n" || transTxt === "//" ||  transTxt === "") {
        saveTranslatedResult(mid, _cdata, _cdata, "false", url, index)
        return
    }
    await saveTranslatedResult(mid, _cdata, transTxt, "ok", url, index)
    return
}

function trimTranslateText(s) {
    sb = s.replace(/\\ n/g, "\n")
    s = sb.replace("% d", " %d")
    sb = s.replace("# ", "#");
    s = sb.replace(/\\ N/g, "\n")
    sb = s.replace("// ", "//")
    s = sb.replace(" \ N ", "\N")
    return sb
}

async function saveTranslatedResult(mid, _cdata, trans, flag, url, index) {
    transBuffer.push({ _mid: mid, __cdata: trans })
    flagBuffer.push({ _mid: mid, __cdata: flag, url: url })
    if (flag == "failed") handleErrosBuffer.push({ _mid: mid, __cdata: _cdata, url: url })
    // await checkBuffer()
    showTranslateItemResult(mid, _cdata, trans, flag, index)
    showtransStatus(" total case translated: " + transBuffer.length)
}

async function checkBuffer() {
    showtransStatus(" total item in cache: " + transCache.length)
    if (transCache.length >= cacheSize - 1) {
        transBuffer.push(...transCache)
        flagBuffer.push(...flagCache)
        clearCache()
    }
    return
}


function clearCache() {
    transCache = []
    flagCache = []
    showtransStatus(" total item in cache: " + transCache.length)
}
function clearBuffer() {
    transBuffer = []
    flagBuffer = []
}

function downloadEFlag() {
    download(prepareJsonFlagFile(handleErrosBuffer), "uistring_Errors_flag_" + startTransIndex + "_" + currentTrans.innerText + ".json")
}

function downloadFlag() {
    download(prepareJsonFlagFile(flagBuffer), "uistring_VI_flag_" + startTransIndex + "_" + currentTrans.innerText + ".json")
}

function downloadXml() {
    download(prepareXmlFile(), "uistring_VI_" + startTransIndex + "_" + currentTrans.innerText + ".xml")
}
function prepareJsonFlagFile(flagfile) {
    flagfile.sort(function (a, b) {
        return (a._mid - b._mid);
    })
    return JSON.stringify({ flag: flagfile });
}

function prepareXmlFile() {
    transBuffer.sort(function (a, b) {
        return (a._mid - b._mid);
    })
    var baseJson = {
        "messages": {
            "message": transBuffer,
            "_name": "UIString",
            "_lang": "VI_US"
        }
    }
    console.log("Repair xml file")
    return x2js.json2xml_str(baseJson)
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

function readInputFile(file, type) {
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
}

function showTranslateItemResult(mid, question, answer, status, index) {
    box.append("index: " + index + " Id: " + mid + "  -  " + question + " - " + answer + " - " + status)
    box.appendChild(document.createElement("br"))
    box.scrollTop = box.scrollHeight;
}

function showtransStatus(message) {
    transStatus.innerText = message
}


