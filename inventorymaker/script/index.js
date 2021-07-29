//#region Type definitions
/**
 * Represents a Minecraft Item
 * @typedef {Object} Item
 * @property {string} type
 * @property {string} displayName
 * @property {string[]} lore
 */

/**
 * Represents an inventory row
 * @typedef {Item[]} Row
 */

/**
 * Represents the inventory metadata,
 * the data used only for editing the
 * menu, it can be ignored when reading
 * the exported file
 * @typedef {Object} Metadata
 * @property {number} formatVersion
 */

/**
 * Represents the inventory data
 * @typedef {Object} Inventory
 * @property {Metadata} metadata
 * @property {string} title
 * @property {Row[]} rows
 */
//#endregion

//#region Some constants
const FORMAT_VERSION = 1;
const ROW_SIZE = 9;
const MAX_ROWS = 6;
/**
 * Object containing possible entries
 */
let items = {};
//#endregion

(async () => {
    // item list fetch
    const response = await fetch('https://raw.githubusercontent.com/unnamed/webpage/master/inventorymaker/data/items.json');
    (await response.json()).forEach(item => {
        const key = (item.type << 4) + item.meta;
        items[key + ""] = item;
        const option = document.createElement("option");
        option.value = key;
        option.innerHTML = item.name;
        itemTypeElement.options.add(option);
    });
})().catch(e => showDialog(`Error while importing items: ${e.name}`, e.message));

/**
 * Object containing the menu information
 * @type {Inventory}
 */
let data = {
    metadata: {
        formatVersion: FORMAT_VERSION
    },
    title: "Click me!",
    rows: [
        [
        ]
    ]
};

// alias
const $ = selectors => document.querySelector(selectors);

const rightSidebar = $(".right-sidebar");
const itemTypeElement = $("#item-type");
const updateItemElement = $("#update-item");
const removeItemElement = $("#remove-item");
const displayNameElement = $("#display-name");
const loreElement = $("#lore");
const titleInput = $("#title");
const titleOutput = $("#title-output");

let tableBody = $("#table-body");


/**
 * Contains the selected slot, undefined
 * if no selection.
 * First element is row, second element is
 * row slot (0-ROW_SIZE)
 * @type {number[] | undefined}
 */
let selectedSlot = undefined;

/**
 * Draws the menu to the HTML
 */
function draw() {

    // update title
    titleInput.value = data.title;
    titleOutput.innerHTML = colorize(data.title);

    // remove all rows first
    const newBody = document.createElement("tbody");

    // then write the new rows
    for (let row = 0; row < data.rows.length; row++) {
        const rowData = data.rows[row];
        const tableRow = newBody.insertRow();
        for (let slot = 0; slot < ROW_SIZE; slot++) {
            const item = rowData[slot];
            const cell = tableRow.insertCell();

            cell.addEventListener("click", () => setSelection(row, slot, item));

            if (item) {
                const hover = document.createElement("div");
                hover.classList.add("item-tooltip");
                hover.classList.add("hidden");

                // TODO: This is vulnerable, we should sanitize the display name and lore
                hover.innerHTML = `
                    <p class="text">${colorize(item.displayName)}</p>
                    <p class="text">${colorize(item.lore.join('<br>'))}</p>
                `;

                const img = document.createElement("img");

                img.addEventListener("mouseenter", () => hover.classList.remove("hidden"));
                img.addEventListener("mouseleave", () => hover.classList.add("hidden"));

                const type = item.type >> 4;
                const meta = item.type & 15;

                img.src = `https://github.com/unnamed/webpage/raw/master/inventorymaker/data/items/${type}-${meta}.png`;

                cell.appendChild(img);
                cell.appendChild(hover);
            }
        }
    }

    // replace
    tableBody.parentNode.replaceChild(newBody, tableBody);
    tableBody = newBody;
}

/**
 * Updates the selection sidebar for editing the
 * item in the selected slot
 * @param {number} row The row (0-MAX_ROWS)
 * @param {number} slot The row slot (0-ROW_SIZE)
 * @param {Item|undefined} item The current item in this slot
 */
function setSelection(row, slot, item) {

    itemTypeElement.disabled = false;
    updateItemElement.disabled = false;
    removeItemElement.disabled = false;
    displayNameElement.disabled = false;
    loreElement.disabled = false;

    rightSidebar.classList.remove("disabled-sidebar");
    selectedSlot = [row, slot];

    if (item) {
        displayNameElement.value = item.displayName;
        loreElement.value = item.lore.join("\n");
    } else {
        displayNameElement.value = "";
        loreElement.value = "";
    }
}

/**
 * Updates the current selection specified by
 * 'selectedSlot' variable setting the values
 * from the input elements
 */
function updateSelection() {

    const type = itemTypeElement.value;
    const displayName = displayNameElement.value;
    const lore = loreElement.value.split(/\r?\n/g);

    if (!selectedSlot) {
        // should never pass, but we check anyways
        return;
    }

    const [row, slot] = selectedSlot;
    const rowData = data.rows[row];

    if (rowData !== undefined) {
        const item = rowData[slot] || {};
        item.type = type;
        item.displayName = displayName;
        item.lore = lore;
        rowData[slot] = item;
        draw();
    }
}

/**
 * Removes the current selection specified
 * by 'selectedSlot' variable
 */
function removeSelection() {

    if (!selectedSlot) {
        // should never pass but we
        // check anyways
        return;
    }

    const [row, slot] = selectedSlot;
    const rowData = data.rows[row];

    if (rowData) {
        // remove it!
        delete rowData[slot];
        // update menu
        draw();
    }

    displayNameElement.value = "";
    loreElement.value = "";
}

/**
 * Adds a new empty row to the
 * editing menu
 */
function addRow() {
    if (data.rows.length >= MAX_ROWS) {
        showDialog(
            "Cannot add more rows",
            `The rows limit is ${MAX_ROWS}`
        );
        return;
    }
    data.rows.push([]);
    draw();
}

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

draw();

$("#import").addEventListener("click", importInfo);
$("#export").addEventListener("click", exportInfo);
$("#add-row").addEventListener("click", addRow);
removeItemElement.addEventListener("click", removeSelection);
updateItemElement.addEventListener("click", updateSelection);

titleInput.addEventListener("input", event => data.title = event.target.value);

/**
 * Formats the given time in seconds
 * to a human readable string
 * @param {number} time The time in seconds
 * @return {string} The formatted string
 */
function formatSeconds(time) {
    let hours = Math.floor(time / 3600);
    let minutes = Math.floor((time - (hours * 3600)) / 60);
    let seconds = time - (hours * 3600) - (minutes * 60);

    /**
     * Ensures that the given number has two or
     * more digits and returns it as string
     * @param {number} number The number
     * @return {string} Number with 2+ digits
     */
    function fixed(number) {
        return number < 10 ? `0${number}` : number.toString();
    }

    return `${fixed(hours)}:${fixed(minutes)}:${fixed(seconds)}`;
}

let seconds = 1;
const time = $("#time");

/** Updates the time counter */
function updateTime() {
    time.innerHTML = formatSeconds(seconds);
    seconds++;
}

setInterval(updateTime, 1000);