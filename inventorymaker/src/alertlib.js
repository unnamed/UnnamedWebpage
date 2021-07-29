const dialogElement = document.getElementById("dialog-bg");

/**
 * Shows a dialog and sets the given title
 * and description to it
 * @param {string} title The dialog title
 * @param {string} description The dialog description
 */
export function showDialog(title, description) {
    document.getElementById("dialog__heading").innerText = title;
    document.getElementById("dialog__info").innerText = description;
    // show the dialog
    dialogElement.classList.remove("hidden");
}

/**
 * Closes the dialog (hides it)
 */
function closeDialog() {
    dialogElement.classList.add("hidden");
}


document.getElementById("close-dialog").addEventListener("click", closeDialog);