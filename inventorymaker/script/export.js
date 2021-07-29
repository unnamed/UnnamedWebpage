/**
 * Asks an user for a file and reads it as JSON
 */
function importInfo() {
    const inputElement = document.createElement("input");
    inputElement.type = "file";
    inputElement.addEventListener("change", event => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.readAsText(file, "UTF-8");
        reader.addEventListener("load", readEvent => {
            try {
                const newData = JSON.parse(readEvent.target.result.toString());

                if (newData.metadata.formatVersion > FORMAT_VERSION) {
                    showDialog(
                        'Invalid file version',
                        'Imported file has a file greater than current'
                        + ` format version (Given: ${newData.metadata.formatVersion},`
                        + `Current: ${FORMAT_VERSION}). Please update inventorymaker`
                    );
                    return;
                } else if (newData.metadata.formatVersion < FORMAT_VERSION) {
                    // TODO: Add backwards compatibility
                    showDialog(
                        'Invalid file version',
                        'Imported file has a older inventorymaker file format.'
                        + ' Backwards compatibility is not added yet.'
                    );
                    return;
                }

                data = newData;
                draw();
            } catch (e) {
                showDialog(`Invalid file: ${e.name}`, e.message);
            }
        });
    });
    document.body.appendChild(inputElement);
    inputElement.click();
    inputElement.remove();
}

/**
 * Exports the current data to a JSON file
 * and makes the user save it
 */
function exportInfo() {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
    const downloadElement = document.createElement("a");
    downloadElement.setAttribute("href", dataStr);
    downloadElement.setAttribute("download", "menu.mcinv");
    document.body.appendChild(downloadElement);
    downloadElement.click();
    downloadElement.remove();
}

document.getElementById("import").addEventListener("click", importInfo);
document.getElementById("export").addEventListener("click", exportInfo);
