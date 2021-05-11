import { parse } from 'node-html-parser';
import validator from 'validator';

import {
    isImprintUrl,
    isImprintLink,
    isFilled,
    isHref,
} from './Validator';

import {
    formatText,
    htmlDecode,
    combineUrl
} from './Helper';

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

export function parseHref(attrs) {
    let url = "";
    const arr = attrs.split(' ');

    url = getHrefUrl(arr);

    return url;
}

export function getHrefUrl(arr) {
    let href = "";

    for (let i = 0; i < arr.length; i++) {
        if (href !== "") { break; }
        let text = arr[i];
        if (isHref(text)) {
            href = formatText(text);
        }
    }
    return href;
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
            const col = htmlDecode( row[j]);
            const colEl = col.split(" ");

            for (let k = 0; k < colEl.length; k++) {

                //console.log(`Ist ${element} eine Email? - ${validator.isEmail(element)}`)
                //console.log(colEl[k]);
                if (colEl[k].startsWith("Postfach")) { break; }

                if (colEl[k].startsWith('D-')) {
                    const arr = colEl[k];
                    const el = arr.split('D-');
                    
                    if (validator.isPostalCode(el[1], 'DE') === true && imprint.Plz === "") {
                        imprint.Plz = htmlDecode(el[1]);
                        if (row[j].includes(el[1])&&row[j].includes(",")) {

                            const r = row[j];
                            const rEl = r.split(",");
                            imprint.Straße= htmlDecode(rEl[0]);

                            let str = rEl[1].replace(colEl[k],"");
                            let s = str.replace(rEl[0],"")

                            imprint.Stadt = s.trim();
                        }
                        else {
                            imprint.Straße = htmlDecode(row[j - 1]);
                            imprint.Stadt = htmlDecode(row[j].replace(colEl[k], ""));
                        }
                        
                        break;
                    }
                }

                if (validator.isPostalCode(colEl[k], 'DE') === true && imprint.Plz === "") {
                    imprint.Plz = htmlDecode(colEl[k]);
                        if (row[j].includes(colEl[k])&&row[j].includes(",")) {
                            console.log(row[j]);
                            const r = row[j];
                            const rEl = r.split(",");
                            imprint.Straße= htmlDecode(rEl[0]);

                            let str = rEl[1].replace(colEl[k],"");
                            let s = str.replace(rEl[0],"")

                            imprint.Stadt = s.trim();
                        }
                        else {
                            imprint.Straße = htmlDecode(row[j - 1]);
                            imprint.Stadt = htmlDecode(row[j].replace(colEl[k], ""));
                        }
                        
                        break;
                }

                //manche telnummer fängt bei der zeile mit T an prüfe
                if (validator.isIn(colEl[k], ["T", "Tel:", "Tel.:", "tel:", "Tel.", "Telefon:", "Telefon", "phone:", "Phone:", "Phone", "Fon", "Fon:", "Servicenummer", "Telefonzentrale:", "Zentrale:"]) && imprint.Telefon === "") {
                    const r = row[j];
                    const rEl = r.split(colEl[k]);

                    let temp = rEl[1];
                    let str = temp.replace(/[^\d\+]/g, "");
                    imprint.Telefon = htmlDecode(str.trim());
                    break;
                }

                if (validator.isIn(colEl[k], ["F", "Fax:", "Fax.", "fax:", "Fax", "Telefax", "Telefax:"]) && imprint.Fax === "") {
                    const r = row[j];
                    const rEl = r.split(colEl[k]);

                    let temp = rEl[1];
                    let str = temp.replace(/[^\d\+]/g, "");
                    imprint.Fax = htmlDecode(str.trim());
                    break;
                }

                //problem wegen fax er geht in beide rein
                if (colEl[k].startsWith('+49') && imprint.Telefon === "") {
                    let temp = row[j];
                    let str = temp.replace(/[^\d\+]/g, "");
                    imprint.Telefon = htmlDecode(str.trim());
                    break;
                }

                if (colEl[k].startsWith('+49') === true && imprint.Fax === "" && imprint.Telefon !== "") {
                    const r = row[j];
                    const rEl = r.split(/[:.]/g);

                    let temp = row[j];
                    let str = temp.replace(/[^\d\+]/g, "");

                    let num = str.trim();
                    if (rEl.length > 1) {
                        num = rEl[1].trim();
                    }

                    if (imprint.Telefon !== num) {
                        imprint.Fax = htmlDecode(num);
                        break;
                    }
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
                    const href = hrefList.split('"');
                    const possibleEmail = href[1].split('mailto:');
                    imprint.Email = possibleEmail[1];
                }
            }
        }
    }

    return imprint;
}
