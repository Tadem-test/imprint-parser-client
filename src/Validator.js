export function isImprintUrl(url) {
    if (url === "" || url === "#") {
        return false;
    }
    return true;
}

export function isImprintLink(link) {
    if (link === "Impressum"
        || link === "IMPRESSUM"
        || link === "Imprint"
        || link === "IMPRINT"
        || link === "imprint") {
        return true;
    }
    return false;
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
        return true;
    }
    return false;
}

export function isHref(text) {
    if (text.startsWith("href=")) {
        return true;
    }
    return false;
}