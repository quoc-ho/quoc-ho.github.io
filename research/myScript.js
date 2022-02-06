function toggleAbstracts(el) {
    let abstract = el.parentNode.getElementsByTagName("abstract")[0];
    toggleMe(abstract);
    hideOther(abstract);
}

function toggleMe(me) {
    if (me.style.display == "block")
        me.style.display = "none";
    else me.style.display = "block";
}

function hideOther(me) {
    for (abs of Array.from(document.getElementsByTagName("abstract"))) {
        if (abs != me)
            abs.style.display = "none";
    }
}