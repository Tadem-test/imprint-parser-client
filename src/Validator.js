export function isImprintUrl(url) {
    if (url === "" || url === "#") {
        return false;
    }
    return true;
}

export function isImprintLink(link) {
    if (link == "Impressum"
        || link == "IMPRESSUM"
        || link == "Imprint"
        || link == "IMPRINT"
        || link == "imprint") {
        return true;
    }
    return false;
}