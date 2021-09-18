/*! Unnamed Team's Webpage v0.1.0 | MIT License | github.com/unnamed/webpage */

(function() {

    const $ = selectors => document.querySelector(selectors);

    /**
     * Class that represents a menu location
     * @param {number} row The slot row
     * @param {number} slot The slot in the row
     */
    function Slot(row, slot) {
        this.row = row;
        this.slot = slot;

        /**
         * Determines if this slot is equal to
         * the given 'other' slot
         * @param {Slot} other The compared slot
         * @returns {boolean} True if equal
         */
        this.equals = function(other) {
            if (!other) {
                return false;
            }
            return this.row === other.row && this.slot === other.slot;
        };
    }

    /**
     * Replaces the given element by the given replacement
     * @param {HTMLElement} element The replaced element
     * @param {HTMLElement} replacement The replacement
     */
    function replace(element, replacement) {
        element.parentNode.replaceChild(replacement, element);
    }

    function asString(value) {
        if (value === undefined) return ""; // empty for undefined
        if (Array.isArray(value)) return value.join('\n'); // join
        return value;
    }

    const formatter = new MCFormat({ colorChar: "&", allowMagic: true });

    /**
     * Formats the given text into the specified
     * element using a single children
     * @param {HTMLElement} element The element where
     * the rich text will be put
     * @param {string} text The raw text
     */
    MCFormat.prototype.formatInto = function (element, text) {
        const children = element.children;
        const output = this.format(text);
        if (children.length === 0) {
            element.appendChild(output);
        } else {
            replace(children.item(0), output);
        }
    };

    const dialog = (function () {
        const dialogElement = $("#dialog-container");

        const dialog = {
            /**
             * Shows a dialog and sets the given title
             * and description to it
             * @param {string} title The dialog title
             * @param {string} description The dialog description
             */
            show(title, description) {
                $("#dialog__heading").innerText = title;
                $("#dialog__info").innerText = description;
                // show the dialog
                dialogElement.classList.remove("hidden");
            },

            /**
             * Closes the dialog
             */
            close() {
                dialogElement.classList.add("hidden");
            }
        };

        $("#close-dialog").addEventListener("click", dialog.close);
        return dialog;
    })();

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
                        dialog.show(
                            'Invalid file version',
                            'Imported file has a file greater than current'
                            + ` format version (Given: ${newData.metadata.formatVersion},`
                            + `Current: ${FORMAT_VERSION}). Please update inventorymaker`
                        );
                        return;
                    } else if (newData.metadata.formatVersion < FORMAT_VERSION) {
                        // TODO: Add backwards compatibility
                        dialog.show(
                            'Invalid file version',
                            'Imported file has a older inventorymaker file format.'
                            + ' Backwards compatibility is not added yet.'
                        );
                        return;
                    }

                    (data.metadata.minecraftVersion === newData.metadata.minecraftVersion
                            ? Promise.resolve()
                            : loadItems(newData.metadata.minecraftVersion))
                        .then(() => {
                            data = newData;
                            draw();
                        })
                        .catch(e => {
                            dialog.show(`Invalid file: ${e.name}, could not load items`, e.message);
                            console.error(e);
                        });
                } catch (e) {
                    dialog.show(`Invalid file: ${e.name}`, e.message);
                    console.error(e);
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

    $("#import").addEventListener("click", importInfo);
    $("#export").addEventListener("click", exportInfo);
    //#endregion

    /**
     * @typedef {Object} Drag
     * @property {Slot | undefined} source The source
     * location of the dragged item
     *
     * @type {Drag}
     */
    let dragging = undefined;

    //#region Some constants
    const ROW_SIZE = 9;
    const MAX_ROWS = 6;
    //#endregion

    let data = {
        metadata: {
            formatVersion: FORMAT_VERSION,
            minecraftVersion: '1.8'
        },
        title: "Title",
        rows: [
            []
        ]
    };

    const itemListElement = $("#item-list");
    const titleInput = $("#title");
    const titleOutput = $("#title-display");

    const itemControls = {
        type: $("#item-type"),
        displayName: $("#display-name"),
        binding: $("#binding"),
        lore: $("#lore")
    };

    let tableBody = $("#table-body");
    let rowContainer = $("#row-container");

    $("#item-search").addEventListener("input", event => {
        const query = event.target.value.toLowerCase();
        for (const element of itemListElement.children) {
            if (element.children.item(1).innerHTML.toLowerCase().includes(query)) {
                element.classList.remove("hidden");
            } else {
                element.classList.add("hidden");
            }
        }
    });

    /* Listener for title changes */
    titleInput.addEventListener("input", event => {
        const value = event.target.value;
        formatter.formatInto(titleOutput, value);
        data.title = value;
    });

    function src(type, meta) {
        return `https://raw.githubusercontent.com/unnamed/webpage/master/menumaker/assets/1.8/${type}-${meta}.png`;
    }

    /**
     * Loads the minecraft items specified
     * by the given version, returns a void
     * promise
     * @param version The minecraft version
     * @returns {Promise<void>}
     */
    async function loadItems(version) {
        // item list fetch
        const response = await fetch(`https://raw.githubusercontent.com/unnamed/webpage/master/menumaker/assets/${version}/list.json`);
        const json = await response.json();

        json.forEach(item => {

            const key = (item.type << 4) + item.meta;
            //const keyStr = key.toString();

            const option = document.createElement("option");
            option.value = key;
            option.innerHTML = item.name;
            itemControls.type.options.add(option);

            const itemElement = document.createElement("div");
            itemElement.classList.add("item-element");
            const img = document.createElement("img");
            img.setAttribute("data-src", src(item.type, item.meta));
            img.classList.add("lazyload");

            const label = document.createElement("p");
            label.innerText = item.name;
            label.classList.add("hidden");

            itemElement.appendChild(img);
            itemElement.setAttribute("draggable", "true");

            itemElement.appendChild(label);

            itemElement.addEventListener("dragstart", () => {
                dragging = {
                    type: key,
                    displayName: item.name,
                    lore: []
                };
            });
            itemListElement.appendChild(itemElement);
        });
    }

    // initial load
    loadItems(data.metadata.minecraftVersion)
        .catch(e => {
            dialog.show(`Error while importing items: ${e.name}`, e.message);
            console.error(e);
        });

    //#region Item Tooltip
    /**
     * @typedef {Object} Tooltip
     * @property {HTMLElement} container The container element
     * @property {HTMLElement} displayName The display name element
     * @property {HTMLElement} lore The lore element
     * @property {Slot | undefined} pinLocation The pin location
     * @property {Slot | undefined} location The tooltip location
     *
     * @type {Tooltip}
     */
    const itemTooltip = (() => {
        const container = $("#item-tooltip");
        const displayName = $("#display-name-display");
        const lore = $("#lore-display");

        return {
            container,
            displayName,
            lore,
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
                formatter.formatInto(this.displayName, item.displayName);
                formatter.formatInto(this.lore, item.lore.join('<br>'));
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
     * Sets the given item to the specified
     * slot in the menu.
     * @param {Slot} slot The target slot
     * @param {Object} item The set item
     */
    function setItem(slot, item) {
        let rowData = data.rows[slot.row];
        if (rowData === undefined) {
            rowData = data.rows[slot.row] = [];
        }
        rowData[slot.slot] = item;
    }

    function dropDrag(event) {
        event.preventDefault();
        if (dragging) {
            const source = dragging.source;
            dragging = undefined;
            if (source) {
                if (source.equals(itemTooltip.pinLocation)) {
                    itemTooltip.pinLocation = undefined; // remove pin location
                }
                // remove the item
                setItem(source, undefined);
            }
            draw();
        }
    }

    itemListElement.addEventListener("dragover", event => event.preventDefault());
    itemListElement.addEventListener("drop", dropDrag);

    /**
     * Draws the menu to the HTML
     */
    function draw() {

        // update title
        titleInput.value = data.title;
        formatter.formatInto(titleOutput, data.title);

        const newBody = document.createElement("tbody");
        const newRowContainer = document.createElement("div");

        // then write the new rows
        for (let row = 0; row < data.rows.length; row++) {
            const rowData = data.rows[row];
            const tableRow = newBody.insertRow();
            for (let slot = 0; slot < ROW_SIZE; slot++) {

                const location = new Slot(row, slot);
                const item = rowData[slot];

                const realCell = tableRow.insertCell();
                const cell = document.createElement("div");

                cell.addEventListener("dragover", event => event.preventDefault());
                cell.addEventListener("drop", event => {
                    event.preventDefault();
                    if (!item && dragging) {
                        const source = dragging.source;
                        if (source) {
                            if (source.equals(itemTooltip.pinLocation)) {
                                itemTooltip.pinLocation = location; // set pin to here
                            }
                            // remove the item
                            setItem(source, undefined);
                        }
                        delete dragging.source;
                        rowData[slot] = { ...dragging };
                        dragging = undefined;
                        draw();
                    }
                });

                cell.classList.add("cell-content");
                realCell.appendChild(cell);

                cell.addEventListener("click", () => {
                    if (item) {
                        if (itemTooltip.pinLocation && itemTooltip.pinLocation.equals(location)) {
                            itemTooltip.hide();
                            itemTooltip.pinLocation = undefined;
                            // itemTooltip.location = undefined;
                            return;
                        }
                        itemTooltip.replaceParent(cell);
                        itemTooltip.setItem(item);
                        itemTooltip.pinLocation = itemTooltip.location = location;
                        setSelection(row, slot, item);
                    }
                });

                if (item) {
                    const img = document.createElement("img");

                    img.setAttribute("draggable", "true");
                    img.addEventListener("dragstart", () => {
                        dragging = { ...item, source: location };
                    })
                    img.addEventListener("mouseenter", () => {
                        itemTooltip.location = location;
                        itemTooltip.replaceParent(cell);
                        itemTooltip.setItem(item);
                    });
                    img.addEventListener("mouseleave", () => {
                        if (itemTooltip.location && itemTooltip.location.equals(location)) {
                            if (itemTooltip.pinLocation !== undefined) {
                                itemTooltip.location = itemTooltip.pinLocation;
                                const { row, slot } = itemTooltip.pinLocation;
                                const daCell = tableBody.rows[row].cells.item(slot);
                                const item = getItem(row, slot);
                                itemTooltip.replaceParent(daCell.children.item(0));
                                itemTooltip.setItem(item);
                            } else {
                                itemTooltip.hide();
                            }
                        }
                    });

                    const type = item.type >> 4;
                    const meta = item.type & 15;

                    img.src = src(type, meta);
                    cell.appendChild(img);
                }
            }

            const rowElement = document.createElement("div");
            rowElement.classList.add("row");
            rowElement.innerHTML = `
                <span class="row-number text">Row ${row + 1}</span>
                <div class="row-buttons">
                    <button class="row-move-up"><i class="fas fa-chevron-up"></i></button>
                    <button class="row-move-down"><i class="fas fa-chevron-down"></i></button>
                    <button class="row-delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;

            newRowContainer.appendChild(rowElement);
        }

        replace(tableBody, newBody);
        replace(rowContainer, newRowContainer);
        tableBody = newBody;
        rowContainer = newRowContainer;
    }

    /**
     * Updates the selection sidebar for editing the
     * item in the selected slot
     * @param {number} row The row (0-MAX_ROWS)
     * @param {number} slot The row slot (0-ROW_SIZE)
     * @param {Object|undefined} item The current item in this slot
     */
    function setSelection(row, slot, item) {

        /* Enable all item controls */
        for (const controlName in itemControls) {
            const control = itemControls[controlName];
            control.disabled = false;
        }

        if (item) {
            /* Set values to controls */
            for (const controlName in itemControls) {
                const control = itemControls[controlName];
                control.value = asString(item[controlName]);
            }
        } else {
            /* Reset all controls */
            for (const controlName in itemControls) {
                const control = itemControls[controlName];
                control.value = "";
            }
        }
    }

    /**
     * Adds a new empty row to the
     * editing menu
     */
    function addRow() {
        if (data.rows.length >= MAX_ROWS) {
            dialog.show(
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

    titleInput.addEventListener("input", event => data.title = event.target.value);

    for (const controlName in itemControls) {
        const control = itemControls[controlName];
        if (control instanceof HTMLSelectElement) {
            control.addEventListener("change", event => {
                if (!itemTooltip.pinLocation) {
                    return;
                }

                const { row, slot } = itemTooltip.pinLocation;
                const item = getItem(row, slot);
                item[controlName] = parseInt(event.target.value);
                draw();
            });
        } else if (control instanceof HTMLInputElement
            || control instanceof HTMLTextAreaElement) {
            control.addEventListener("input", event => {

                if (itemTooltip.location
                    && itemTooltip.pinLocation
                    && itemTooltip.location.equals(itemTooltip.pinLocation)) {
                    formatter.formatInto(itemTooltip[controlName], event.target.value);
                }

                if (itemTooltip.pinLocation) {
                    const { row, slot } = itemTooltip.pinLocation;
                    const item = getItem(row, slot);
                    item[controlName] = event.target.value;
                }
            });
        }
    }

    window.addEventListener("beforeunload", event => {
        return event.returnValue = "Are you sure you want to leave the page? Some changes may not be saved";
    });

})();