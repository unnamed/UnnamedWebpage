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

// TODO: fix this code, it's puajj
/**
 * Object containing the menu information
 * @type {Inventory}
 */
let data = {
    metadata: {
        formatVersion: FORMAT_VERSION
    },
    title: "Title",
    rows: [
        [
            {
                type: 1 << 4,
                displayName: 'Test',
                lore: []
            }
        ]
    ]
};

// alias
const $ = selectors => document.querySelector(selectors);

const itemSearchElement = $("#item-search");
const itemListElement = $("#item-list");
const itemTypeElement = $("#item-type");
const removeItemElement = $("#remove-item");
const displayNameElement = $("#display-name");
const loreElement = $("#lore");
const titleInput = $("#title");
const titleOutput = $("#title-display");

let tableBody = $("#table-body");
let dragging = undefined;

itemSearchElement.addEventListener("input", event => {
    const query = event.target.value;
    console.log(query);
    for (const element of itemListElement.children) {
        if (element.children.item(1).innerHTML.toLowerCase().includes(query)) {
            element.classList.remove("hidden");
        } else {
            element.classList.add("hidden");
        }
    }
})

function src(type, meta) {
    return `https://github.com/unnamed/webpage/raw/master/inventorymaker/data/items/${type}-${meta}.png`;
}

(async () => {
    // item list fetch
    const response = await fetch('https://raw.githubusercontent.com/unnamed/webpage/master/inventorymaker/data/items.json');
    (await response.json()).forEach(item => {

        if (item.type === 0) {
            // ignore air
            return;
        }

        const key = (item.type << 4) + item.meta;
        items[key + ""] = item;
        const option = document.createElement("option");
        option.value = key;
        option.innerHTML = item.name;
        itemTypeElement.options.add(option);

        const itemElement = document.createElement("div");
        itemElement.classList.add("item-element");
        const img = document.createElement("img");
        img.classList.add("lazyload");
        img.src = src(item.type, item.meta);
        const label = document.createElement("p");
        label.classList.add("text");
        label.innerHTML = item.name;

        itemElement.appendChild(img);
        itemElement.appendChild(label);
        itemElement.setAttribute("draggable", "true");

        itemElement.addEventListener("dragstart", () => {
            dragging = key + "";
        });
        itemListElement.appendChild(itemElement);

        draw();
    });
})().catch(e => showDialog(`Error while importing items: ${e.name}`, e.message));

const itemTooltip = (() => {
    const container = $("#item-tooltip");
    const nameElement = $("#display-name-display");
    const loreElement = $("#lore-display");

    return {
        container,
        nameElement,
        loreElement,
        pinLocation: undefined,
        location: undefined,
        hide() {
            this.container.classList.add("hidden");
            if (this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
        },
        replaceParent(parent) {
            this.hide();
            this.container.classList.remove("hidden");
            parent.appendChild(this.container);
        },
        setItem(item) {
            this.nameElement.innerHTML = colorize(item.displayName);
            this.loreElement.innerHTML = colorize(item.lore.join('<br>'));
        }
    };
})();

function getItem(row, slot) {
    const rowData = data.rows[row];
    if (rowData) {
        return rowData[slot];
    }
}

/**
 * Draws the menu to the HTML
 */
function draw() {

    // update title
    titleInput.value = data.title;
    titleOutput.innerHTML = colorize(data.title);

    const newBody = document.createElement("tbody");

    // then write the new rows
    for (let row = 0; row < data.rows.length; row++) {
        const rowData = data.rows[row];
        const tableRow = newBody.insertRow();
        for (let slot = 0; slot < ROW_SIZE; slot++) {
            const item = rowData[slot];

            const realCell = tableRow.insertCell();
            const cell = document.createElement("div");

            cell.addEventListener("dragover", event => event.preventDefault());
            cell.addEventListener("drop", event => {
                event.preventDefault();
                if (!item) {
                    rowData[slot] = {
                        type: dragging,
                        displayName: '',
                        lore: []
                    };
                    draw();
                }
            });

            cell.classList.add("cell-content");
            realCell.appendChild(cell);

            cell.addEventListener("click", () => {
                if (item) {
                    if (itemTooltip.pinLocation && itemTooltip.pinLocation[0] === row && itemTooltip.pinLocation[1] === slot) {
                        itemTooltip.hide();
                        itemTooltip.pinLocation = undefined;
                        itemTooltip.location = undefined;
                        return;
                    }
                    itemTooltip.replaceParent(cell);
                    itemTooltip.setItem(item);
                    itemTooltip.pinLocation = itemTooltip.location = [row, slot];
                    setSelection(row, slot, item);
                }
            });

            if (item) {
                const img = document.createElement("img");

                img.addEventListener("mouseenter", () => {
                    itemTooltip.location = [row, slot];
                    itemTooltip.replaceParent(cell);
                    itemTooltip.setItem(item);
                });
                img.addEventListener("mouseleave", () => {
                    if (!itemTooltip.pinLocation || itemTooltip.location[0] !== row || itemTooltip.location[1] !== slot) {
                        itemTooltip.hide();
                        if (itemTooltip.location !== undefined && itemTooltip.pinLocation !== undefined) {
                            const [row, slot] = itemTooltip.pinLocation;
                            const daCell = tableBody.rows[row].cells.item(slot);
                            const item = getItem(row, slot);
                            itemTooltip.replaceParent(daCell.children.item(0));
                            itemTooltip.setItem(item);
                        }
                    }
                });

                const type = item.type >> 4;
                const meta = item.type & 15;

                img.src = src(type, meta);
                cell.appendChild(img);
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
    removeItemElement.disabled = false;
    displayNameElement.disabled = false;
    loreElement.disabled = false;

    if (item) {
        itemTypeElement.value = item.type;
        displayNameElement.value = item.displayName;
        loreElement.value = item.lore.join("\n");
    } else {
        displayNameElement.value = "";
        loreElement.value = "";
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

draw();

$("#add-row").addEventListener("click", addRow);

removeItemElement.addEventListener("click", removeSelection);
titleInput.addEventListener("input", event => data.title = event.target.value);

displayNameElement.addEventListener("input", event => {
    if (itemTooltip.location === itemTooltip.pinLocation) {
        itemTooltip.nameElement.innerHTML = colorize(event.target.value);
    }
    if (itemTooltip.pinLocation) {
        const [ row, slot ] = itemTooltip.pinLocation;
        const item = getItem(row, slot);
        item.displayName = event.target.value;
    }
});
loreElement.addEventListener("input", event => {
    itemTooltip.loreElement.innerHTML = colorize(event.target.value.replace(/\r?\n/g, '<br>'));
})