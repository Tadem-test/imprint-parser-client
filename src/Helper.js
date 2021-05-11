export function formatText(text) {

    //remove line breaks
    if (text.startsWith("\n")) {
        let splitText = text.split("\n");
        text = splitText[1];
    }

    //remove ""
    if (text.startsWith('"')) {
        let splitText = text.split('"');
        text = splitText[splitText.length - 2];
    }

    //remove ''
    if (text.startsWith("'")) {
        let splitText = text.split("'");
        text = splitText[splitText.length - 2];
    }

    //remove ../
    if (text.startsWith("../")) {
        let splitText = text.split("../");
        text = splitText[splitText.length - 1];
    }

    if (text.startsWith("href")) {
        let splitText = text.split("href=");
        text = splitText[splitText.length - 1];

        text= formatText(text);
    }

    //trim space
    let trim = text.trim();
    text = trim;

    return text;
}

export function combineUrl(strUrl, websiteUrl) {
    if (strUrl.startsWith("http")) { return strUrl; }

    let url = "";
    let urlTemp = [];

    let s1 = websiteUrl.split("/");
    let s2 = strUrl.split("/");

    for (let i = 0; i < s1.length; i++) {
        if (s1[i] !== "") {
            if (s1[i] === "http:" || s1[i] === "https:") {
                urlTemp.push(s1[i] + "/");
            }
            else {
                urlTemp.push(s1[i]);
            }
        }
    }

    let filter = s2.filter(function (el) {
        return el !== "";
    });
    s2 = filter;

    for (let i = 0; i < s2.length; i++) {
        urlTemp.push(s2[i]);
    }

    let arr = urlTemp;
    urlTemp = removeDuplicates(arr);
    url = urlTemp.join('/');

    return url;
}

export function removeDuplicates(arr) {
    return arr.filter((value, index) => arr.indexOf(value) === index);
}

export function htmlDecode(text) {
    let doc = new DOMParser().parseFromString(text, "text/html");
    return doc.documentElement.textContent;
}