let search_chunk_form = document.getElementById("search_chunk_form");

let x = 0;

function OnChunkClick() {
    if (x == 0) {
        search_chunk_form.classList.add("form_on");
        x = 1;
    }
    else {
        search_chunk_form.classList.remove("form_on");
        x = 0;
    }
}