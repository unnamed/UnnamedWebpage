(function () {

    const $ = selectors => document.querySelector(selectors);
    const on = (element, events, listener) => events.split(" ")
        .forEach(event => element.addEventListener(event, listener));
    const append = (element, children) => children
        .forEach(children => element.appendChild(children));

    const container = $(".emoji-container");
    const form = $(".file-input");
    const emojis = [];

    /**
     * Object representing an information dialog,
     * used to show information to the user
     */
    const dialog = (function () {
        const containerElement = $(".dialog-container");
        const titleElement = $(".dialog-title");
        const contentElement = $(".dialog-content");
        const closeButton = $(".dialog-close");
        let callback = () => true;

        closeButton.addEventListener("click", () => {
            if (callback()) {
                containerElement.classList.add("hidden");
            }
        });

        return {
            /**
             * Shows the dialog using the given title,
             * content and some extra options
             * @param {string} title Dialog title
             * @param {string} content Dialog content
             * @param {Function} cb Callback (executed when clicking
             * the submit button)
             * @param close The close button text
             */
            show(title, content, cb = (() => true), close = "Ok") {
                titleElement.innerText = title;
                contentElement.innerText = content;
                closeButton.innerText = close;
                containerElement.classList.remove("hidden");
                if (cb) {
                    callback = cb;
                }
            }
        };
    })();

    function addEmoji(name, img, ascent, height, permission) {

        if (emojis.filter(e => e !== undefined).some(e => e.name === name)) {
            // if the name is duplicated, use other name
            name = Math.floor(Math.random() * 1E10).toString(36);
        }

        // index for this emoji
        const index = emojis.length;

        function input(property, parse, validate) {
            const labelElement = document.createElement("label");
            labelElement.innerText = property;
            const element = document.createElement("input");
            labelElement.appendChild(element);

            element.addEventListener("keypress", event => {
                const value = event.target.value + event.key;
                if (!validate(value)) {
                    event.preventDefault();
                    event.stopPropagation();
                } else {
                    emojis[index][property] = parse(value);
                }
            });

            return {label: labelElement, input: element};
        }

        function regex(pattern) {
            return value => value.match(pattern);
        }

        const div = document.createElement("div");

        div.classList.add("ghost", "emoji");

        const imgElement = document.createElement("img");
        const propertiesElement = document.createElement("div");
        const deleteButton = document.createElement("button");

        deleteButton.innerHTML = "&#x2715;";
        deleteButton.classList.add("delete-button");

        deleteButton.addEventListener("click", () => {
            // set to undefined and don't change the others emojis index
            emojis[index] = undefined;
            // remove the card
            container.removeChild(div);
        });

        propertiesElement.classList.add("properties");

        const nameElement = input("name", v => v, regex(/^[A-Za-z_]{1,14}$/g));
        const ascentElement = input("ascent", parseInt, regex(/^\d+$/g));
        const heightElement = input("height", parseInt, regex(/^\d+$/g));
        const permissionElement = input("permission", v => v, regex(/^[a-z0-9_.]+$/g));

        imgElement.src = img;
        nameElement.input.value = name;
        ascentElement.input.value = ascent;
        heightElement.input.value = height;
        permissionElement.input.value = permission;

        append(propertiesElement, [nameElement, ascentElement, heightElement, permissionElement].map(e => e.label));
        append(div, [deleteButton, imgElement, propertiesElement]);

        container.appendChild(div);

        emojis.push({name, img, ascent, height, permission });
    }

    on(form, "dragover dragenter", event => {
        event.preventDefault();
        event.stopPropagation();
        form.classList.add("is-dragover");
    });

    on(form, "dragleave dragend drop", event => {
        event.preventDefault();
        event.stopPropagation();
        form.classList.remove("is-dragover");
    });

    on(form, "drop", event => {
        const errors = [];

        for (const file of event.dataTransfer.files) {
            const reader = new FileReader();
            const name = file.name;

            if (!name.endsWith(".png")) {
                errors.push(`Cannot load ${name}. Invalid extension.`);
                continue;
            }

            reader.addEventListener("load", event => addEmoji(
                name.slice(0, -4), // remove the .png extension
                event.target.result,
                8,
                9
            ));
            reader.readAsDataURL(file);
        }

        if (errors) {
            dialog.show(
                `${errors.length} errors occurred`,
                errors.join('\n')
            );
        }
    });

    /**
     * Creates a zip containing all the emojis using
     * the MCEmoji format
     * @returns {Promise<Blob>} The ZIP blob
     */
    async function createZip() {
        function base64ToByteArray(base64) {
            const binary_string = window.atob(base64);
            const len = binary_string.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
            }
            return bytes;
        }

        const zip = new JSZip();
        let char = 1 << 15;

        for (const emoji of emojis) {

            // the array may contain undefined values
            if (!emoji) continue;

            const dataPrefix = "data:image/png;base64,";
            const imgBytes = base64ToByteArray(emoji.img.substring(dataPrefix.length));
            const buffer = new ArrayBuffer(8 * (8 + (emoji.name.length * 2)) + imgBytes.length);
            const view = new Uint8Array(buffer);

            view.set([1, emoji.name.length & 0xFF], 0);
            for (let i = 0; i < emoji.name.length; i++) {
                const c = emoji.name.codePointAt(i);
                view.set([c >> 8, c & 0xFF], i * 2 + 2);
            }
            view.set([
                emoji.height,
                emoji.ascent,
                char >> 8,
                char & 0xFF,
                0,
                imgBytes.length >> 8,
                imgBytes.length & 0xFF
            ], 2 + (emoji.name.length * 2));
            view.set(imgBytes, 9 + (emoji.name.length) * 2);

            zip.file(`${emoji.name}.mcemoji`, buffer);
            char--;
        }

        return zip.generateAsync({type: "blob"});
    }

    $(".upload").addEventListener("click", () => {
        if (emojis.length < 1) {
            // no emojis, return
            dialog.show(
                "Error",
                "No emojis to upload, first add some emojis!"
            );
            return;
        }
        createZip()
            .then(blob => {
                const formData = new FormData();
                formData.set("file", blob);
                return fetch(
                    'https://artemis.unnamed.team/tempfiles/upload/',
                    {method: "POST", body: formData}
                );
            })
            .then(response => response.json())
            .then(response => {
                const { id } = response;
                dialog.show(
                    "Uploaded!",
                    "Successfully uploaded the emojis, execute this" +
                    " command in your Minecraft server to load them.",
                    () => {
                        navigator.clipboard.writeText(`/emojis update ${id}`)
                            .then(() => $(".dialog-container").classList.add("hidden"))
                            .catch(console.error);
                    },
                    "Copy Command"
                );
            });
    });

    $(".save").addEventListener("click", () => {
        if (emojis.length < 1) {
            // no emojis, return
            dialog.show(
                "Error",
                "No emojis to save, first add some emojis!"
            );
            return;
        }
        createZip().then(blob => {
            const downloadElement = document.createElement("a");
            downloadElement.setAttribute("href", URL.createObjectURL(blob));
            downloadElement.setAttribute("download", "emojis.zip");
            document.body.appendChild(downloadElement);
            downloadElement.click();
            downloadElement.remove();
        });
    });

})();
