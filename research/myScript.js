function toggleAbstract(el) {
    let abstract = el.parentNode.getElementsByTagName("abstract")[0];
    if (abstract.style.display == "block")
        abstract.style.display = "none";
    else abstract.style.display = "block";
}