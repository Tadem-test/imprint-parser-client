import { parse } from 'node-html-parser';
import validator from 'validator';
import { isImprintUrl, isImprintLink } from './Validator';

const taglist = ['a', 'div', 'table', 'p'];

//config html parser
export function parseHtml(html) {
    return parse(html, {
        comment: false,
        blockTextElements: {
            script: true,
            noscript: true,
            style: true,
            pre: true
        }
    });
}

export function getImprintUrl(sourcecode, url) {

    //parse page to object
    let parsedHtml = parseHtml(sourcecode);

    //find imprint URL
    let imprintUrl = findImprintUrl(parsedHtml);

    //check if found imprint
    if (!isImprintUrl(url)) {
        imprintUrl = url;
    }

    //combine page URL and imprint URL
    let combinedUrl = combineUrl(imprintUrl, url);

    return combinedUrl;
}

export function findImprintUrl(parsedHtml) {
    let url = "";

    //select tag
    const linkList = parsedHtml.querySelectorAll(taglist[0]);

    //get Imprint Link in Tag
    url = getLinkFromTagList(linkList);

    return url;
}

export function getLinkFromTagList(linkList) {
    let url = "";
    let found = false;

    for (let index = linkList.length; index > 0; index--) {
        if (found) { break; }

        const link = linkList[index - 1];
        const childNodes = link.childNodes;

        if (childNodes !== []) {

            //childNode list
            let values = getLinkFromChildNodeList(childNodes, found);
            url = values[0];
            found = values[1];
        }
    }
    return url;
}

export function getLinkFromChildNodeList(childNodes, found) {
    let url = "";

    for (let index = 0; index < childNodes.length; index++) {
        if (found) { break; }

        const childNode = childNodes[index];
        let rawText = childNode.rawText;

        rawText = formatText(rawText);

        if (isImprintLink(rawText)) {
            found = true;
            const parentNode = childNode.parentNode;
            const attrs = parentNode.rawAttrs;
            url = parseHref(attrs);
        }
    }
    return [url, found];
}

export function formatText(text) {

    //remove break lines
    if (text.startsWith("\n")) {
        let split = text.split("\n");
        text = split[1];
    }

    //trim space
    let trim = text.trim();
    text = trim;
    
    return text;
}

export function parseHref(attrs) {
    let url = "";
    const arr = attrs.split(' ');

    for (let i = 0; i < arr.length; i++) {
        if (url !== "") { break; }
        const text = arr[i];
        if (text.startsWith("href=")) {
            const s1 = text.split("href=");
            const s2 = s1[s1.length - 1];

            if (s2.startsWith("\"")) {
                const s3 = s2.split("\"");
                url = s3[s3.length - 2];
                break;
            }
            if (s2.startsWith("\'")) {
                const s3 = s2.split("\'");
                url = s3[s3.length - 2];
                break;
            }
            if (s2.startsWith("../")) {
                const s3 = s2.split("../");
                url = s3[s3.length - 1];
                break;
            }
            url = s2;
        }
    }
    return url;
}

//get complete urllink to Imprint url
export function combineUrl(strUrl, websiteUrl) {
    if (strUrl.startsWith("http")) { return strUrl; }

    let url = "";
    let urlTemp = [];

    let s1 = websiteUrl.split("\/");
    let s2 = strUrl.split("\/");

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
        return el != "";
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

export function getImprintInformation(sourcecode, imprint = {
    "Straße": "",
    "Plz": "",
    "Stadt": "",
    "Telefon": "",
    "Fax": "",
    "Email": ""
}) {

    //parse imprint page to object
    let obj = parseHtml(sourcecode);

    const divList = obj.querySelectorAll('div');

    for (let i = 0; i < divList.length; i++) {
        if (isFilled(imprint)) { break; }

        const div = divList[i];
        const value = div.structuredText;

        const row = value.split("\n");

        for (let j = 0; j < row.length; j++) {
            const col = row[j];
            const colEl = col.split(" ");

            for (let k = 0; k < colEl.length; k++) {

                //console.log(`Ist ${element} eine Email? - ${validator.isEmail(element)}`)

                if (colEl[k].startsWith("Postfach")) { break; }

                if (colEl[k].startsWith('D-')) {
                    const arr = colEl[k];
                    const el = arr.split('D-');

                    if (validator.isPostalCode(el[1], 'DE') === true && imprint.Plz === "") {
                        imprint.Plz = htmlDecode(el[1]);
                        imprint.Stadt = htmlDecode(colEl[k + 1]);
                        imprint.Straße = htmlDecode(row[j - 1]);
                        break;
                    }
                }

                if (validator.isPostalCode(colEl[k], 'DE') === true && imprint.Plz === "") {
                    imprint.Plz = htmlDecode(colEl[k]);
                    imprint.Stadt = htmlDecode(colEl[k + 1]);
                    imprint.Straße = htmlDecode(row[j - 1]);
                    break;
                }

                //manche telnummer fängt bei der zeile mit T an prüfe
                if (validator.isIn(colEl[k], ["Tel:", "Tel.:", "tel:", "Tel.", "Telefon:", "Telefon", "phone:", "Phone:", "Phone", "Fon", "Fon:", "Servicenummer", "Telefonzentrale:", "Zentrale:"]) && imprint.Telefon === "") {
                    const r = row[j];
                    const rEl = r.split(colEl[k]);
                    imprint.Telefon = htmlDecode(rEl[1]);
                    break;
                }

                if (validator.isIn(colEl[k], ["Fax:", "fax:", "Fax", "Telefax", "Telefax:"]) && imprint.Fax === "") {
                    const r = row[j];
                    const rEl = r.split(colEl[k]);
                    imprint.Fax = htmlDecode(rEl[1]);
                    break;
                }

                //problem wegen fax er geht in beide rein
                if (colEl[k].startsWith('+49') && imprint.Telefon === "") {
                    imprint.Telefon = htmlDecode(row[j]);
                    break;
                }

                if (colEl[k].startsWith('+49') === true && imprint.Fax === "" && imprint.Telefon !== "" && imprint.Telefon !== colEl[k]) {
                    imprint.Fax = htmlDecode(row[j]);
                    break;
                }

                if (colEl[k].includes("(at)")) {
                    let str = colEl[k].replace("(at)", "@");

                    if (validator.isEmail(str) === true && imprint.Email === "") {
                        imprint.Email = htmlDecode(str);
                        break;
                    }
                }

                if (colEl[k].includes("[at]")) {
                    let str = colEl[k].replace("[at]", "@");

                    if (validator.isEmail(str) === true && imprint.Email === "") {
                        imprint.Email = htmlDecode(str);
                        break;
                    }
                }

                if (colEl[k].includes("[at]")) {
                    let str = colEl[k].replace("[at]", "@");

                    if (validator.isEmail(str) === true && imprint.Email === "") {
                        imprint.Email = htmlDecode(str);
                        break;
                    }
                }

                if (validator.isEmail(colEl[k]) === true && imprint.Email === "") {
                    imprint.Email = htmlDecode(colEl[k]);
                    break;
                }


                /* if (imprint.Email === "" && isEmailAddress(colEl[k]) === true) {
                    imprint.Email = getEmailAddress(colEl[k]);
                } */

            }

        }

    }

    if (imprint.Email === "") {
        let aList = obj.querySelectorAll('a');

        for (let i = 0; i < aList.length; i++) {
            const a = aList[i];

            let rawAttrs = a.rawAttrs.split(' ');
            for (let j = 0; j < rawAttrs.length; j++) {
                const hrefList = rawAttrs[j];
                if (hrefList.startsWith('href="mailto:')) {
                    console.log(hrefList);
                    const href = hrefList.split('\"');
                    console.log(href[1]);
                    const possibleEmail = href[1].split('mailto:');
                    console.log(possibleEmail[1]);
                    imprint.Email = possibleEmail[1];
                }
            }
        }
    }
    console.log(imprint);
    return imprint;
}

export function isFilled(imprint) {
    if (
        imprint.Straße !== "" &&
        imprint.Plz !== "" &&
        imprint.Stadt !== "" &&
        imprint.Telefon !== "" &&
        imprint.Fax !== "" &&
        imprint.Email !== ""
    ) {
        console.log("ALL FILLED");
        return true;
    }
    return false;
}

export function htmlDecode(text) {
    let doc = new DOMParser().parseFromString(text, "text/html");
    return doc.documentElement.textContent;
}

export function getEmailAddress(email) {

}
