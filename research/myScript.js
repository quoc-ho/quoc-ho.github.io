function toggleAbstracts(el) {
    let abstract = el.parentNode.getElementsByClassName("abstract")[0];
    toggleMe(abstract);
    hideOther(abstract);
}

function toggleMe(me) {
    console.log(me);
    if (me.style.maxHeight)
        me.style.maxHeight = null;
    else 
        me.style.maxHeight = me.scrollHeight + "px";
}

function hideOther(me) {
    for (abs of Array.from(document.getElementsByClassName("abstract"))) {
        if (abs != me)
            abs.style.maxHeight = null;
    }
}