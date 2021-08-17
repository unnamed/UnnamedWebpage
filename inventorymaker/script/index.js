(function() {

    const $ = selectors => document.querySelector(selectors);

    //#region Color Library
    /**
     * Colorizes the given input
     * @param {string} input The string input
     * @return {string} The HTML output
     */
    const colorize = (function() {

        // color char constant
        const COLOR_CHAR = '&';

        // special codes
        const STRIKETHROUGH = 'm';
        const ITALIC = 'o';
        const BOLD = 'l';
        const UNDERLINE = 'n';

        /**
         * Object containing all color characters
         * and their hex color
         */
        const COLORS = {
            '0': '000000', // black
            '1': '0000AA', // dark blue
            '2': '00AA00', // dark green
            '3': '00AAAA', // dark aqua
            '4': 'AA0000', // dark red
            '5': 'AA00AA', // dark purple
            '6': 'FFAA00', // gold
            '7': 'AAAAAA', // gray
            '8': '555555', // dark gray
            '9': '5555FF', // blue
            'a': '55FF55', // green
            'b': '55FFFF', // aqua
            'c': 'FF5555', // red
            'd': 'FF55FF', // light purple
            'e': 'FFFF55', // yellow
            'f': 'FFFFFF', // white
            'r': 'FFFFFF' // reset = white
        };

        return input => {
            const output = [];
            let suffixes = [];

            for (let i = 0; i < input.length; i++) {
                const current = input.charAt(i);

                if (current !== COLOR_CHAR) {
                    // not a color char, just push it
                    output.push(current);
                    continue;
                }

                const nextIndex = ++i;
                if (nextIndex >= input.length) {
                    // last character, push it and the
                    // current suffixes
                    output.push(current);
                    while (suffixes.length > 0) {
                        output.push(suffixes.pop());
                    }
                    continue;
                }

                const code = input.charAt(nextIndex);
                const hex = COLORS[code];

                if (hex) {
                    // push the previous prefixes
                    while (suffixes.length > 0) {
                        output.push(suffixes.pop());
                    }

                    // push the prefix
                    output.push(`<span style="color: #${hex}">`);
                    // push the suffix
                    suffixes.push('</span>')
                } else {
                    // now lets check if its a special code
                    switch (code) {
                        case STRIKETHROUGH: {
                            output.push('<span style="text-decoration: line-through;">');
                            suffixes.push('</span>');
                            break;
                        }
                        case ITALIC: {
                            output.push('<i>');
                            suffixes.push('</i>');
                            break;
                        }
                        case BOLD: {
                            output.push('<b>');
                            suffixes.push('</b>');
                            break;
                        }
                        case UNDERLINE: {
                            output.push('<span style="text-decoration: underline;">');
                            suffixes.push('</span>');
                            break;
                        }
                        default: {
                            // not a code, push everything
                            output.push(current);
                            output.push(code);
                        }
                    }
                }
            }
            // concatenation in some browsers is a
            // bit slow, so use an array and join it
            return output.join('') + suffixes.reverse().join('');
        }
    })();
    //#endregion

    //#region Alert Library
    const dialogElement = $("#dialog-bg");

    /**
     * Shows a dialog and sets the given title
     * and description to it
     * @param {string} title The dialog title
     * @param {string} description The dialog description
     */
    function showDialog(title, description) {
        $("#dialog__heading").innerText = title;
        $("#dialog__info").innerText = description;
        // show the dialog
        dialogElement.classList.remove("hidden");
    }

    /**
     * Closes the dialog (hides it)
     */
    function closeDialog() {
        dialogElement.classList.add("hidden");
    }


    $("#close-dialog").addEventListener("click", closeDialog);
    //#endregion

    //#region Exporting and Importing Library
    const FORMAT_VERSION = 1;

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
        downloadElement.setAttribute("download", "menu.mcmenu");
        document.body.appendChild(downloadElement);
        downloadElement.click();
        downloadElement.remove();
    }

    document.getElementById("import").addEventListener("click", importInfo);
    document.getElementById("export").addEventListener("click", exportInfo);
    //#endregion

    //#region Input linking library
    /**
     * Code for binding input elements with
     * their "Minecraft-style" display elements
     */

    const INPUT_CLASS = "live-input";

    for (const input of document.getElementsByClassName(INPUT_CLASS)) {

        const output = document.getElementById(input.dataset.bound);

        // update 'output' when 'input' changes
        input.addEventListener("input", event => {
            output.innerHTML = colorize(event.target.value);
        });

        // initial update
        output.innerHTML = colorize(input.value);
    }
    //#endregion

    //#region Type definitions
    /**
     * Represents a Minecraft Item
     * @typedef {Object} Item
     * @property {number | string} type
     * @property {string} displayName
     * @property {string[]} lore
     * @property {string | undefined} bound
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

    /**
     * Represents the information of the
     * item being transferred from a location
     * to another
     * @typedef {Object} DragInfo
     * @property {number[] | undefined} source The drag source
     * @property {number} type The dragged item type
     */
    //#endregion

    /**
     * The current dragging information
     * @type {DragInfo | undefined}
     */
    let dragging = undefined;

    //#region Some constants
    const ROW_SIZE = 9;
    const MAX_ROWS = 6;
    /**
     * Object containing possible entries
     */
    let items = {};
    //#endregion

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
            []
        ]
    };

    const itemSearchElement = $("#item-search");
    const itemListElement = $("#item-list");
    const itemTypeElement = $("#item-type");
    const removeItemElement = $("#remove-item");
    const displayNameElement = $("#display-name");
    const bindingElement = $("#binding");
    const loreElement = $("#lore");
    const titleInput = $("#title");
    const titleOutput = $("#title-display");

    let tableBody = $("#table-body");

    itemSearchElement.addEventListener("input", event => {
        const query = event.target.value;
        for (const element of itemListElement.children) {
            if (element.children.item(1).innerHTML.toLowerCase().includes(query)) {
                element.classList.remove("hidden");
            } else {
                element.classList.add("hidden");
            }
        }
    })

    function src(type, meta) {
        return `https://github.com/unnamed/webpage/raw/master/inventorymaker/assets/1.8/${type}-${meta}.png`;
    }

    (async () => {
        // item list fetch
        const response = await fetch('https://raw.githubusercontent.com/unnamed/webpage/master/inventorymaker/assets/1.8/list.json');
        (await response.json()).forEach(item => {

            const key = (item.type << 4) + item.meta;
            const keyStr = key.toString();

            items[keyStr] = item;
            const option = document.createElement("option");
            option.value = key;
            option.innerHTML = item.name;
            itemTypeElement.options.add(option);

            const itemElement = document.createElement("div");
            itemElement.classList.add("item-element");
            const img = document.createElement("img");
            img.setAttribute("data-src", src(item.type, item.meta));
            img.classList.add("lazyload");
            const label = document.createElement("p");
            label.classList.add("text");
            label.innerHTML = item.name;

            itemElement.appendChild(img);
            itemElement.appendChild(label);
            itemElement.setAttribute("draggable", "true");

            itemElement.addEventListener("dragstart", () => dragging = { type: key });
            itemListElement.appendChild(itemElement);
        });
    })().catch(e => {
        showDialog(`Error while importing items: ${e.name}`, e.message);
        console.error(e);
    });

    //#region Item Tooltip
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
    //#endregion

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
                    if (!item && dragging) {
                        let displayName = '';
                        let lore = [];

                        if (dragging.source) {
                            const sourceRowData = data.rows[dragging.source[0]];
                            if (sourceRowData) {
                                const srcItem = sourceRowData[dragging.source[1]];
                                if (srcItem) {
                                    displayName = srcItem.displayName;
                                    lore = srcItem.lore;
                                }
                                sourceRowData[dragging.source[1]] = undefined;
                            }
                        }
                        rowData[slot] = {
                            type: dragging.type,
                            displayName,
                            lore
                        };
                        dragging = undefined;
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

                    img.setAttribute("draggable", "true");
                    img.addEventListener("dragstart", () => {
                        dragging = { source: [row, slot], type: item.type };
                    })
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
        bindingElement.disabled = false;
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

    itemTypeElement.addEventListener("change", event => {
        if (!itemTooltip.pinLocation) {
            return;
        }
        const [ row, slot ] = itemTooltip.pinLocation;
        const item = getItem(row, slot);
        item.type = parseInt(event.target.value);
        draw();
    });
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
        if (itemTooltip.location === itemTooltip.pinLocation) {
            itemTooltip.loreElement.innerHTML = colorize(event.target.value.replace(/\r?\n/g, '<br>'));
        }
        if (itemTooltip.pinLocation) {
            const [ row, slot ] = itemTooltip.pinLocation;
            const item = getItem(row, slot);
            item.lore = event.target.value.split(/\r?\n/g)
        }
    });

    window.addEventListener("beforeunload", event => {
        return event.returnValue = "Are you sure you want to leave the page? Some changes may not be saved";
    });

})();