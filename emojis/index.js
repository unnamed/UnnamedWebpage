(function() {

    const $ = selectors => document.querySelector(selectors);

    const container = $("#emoji-container");
    const form = $(".file-input");
    const emojis = [];

    function createInput(label, index, property, parse, pattern) {
        const labelElement = document.createElement("label");
        labelElement.innerText = label;
        const element = document.createElement("input");
        labelElement.appendChild(element);

        element.addEventListener("keypress", event => {
            const value = event.target.value + event.key;
            if (!value.match(pattern)) {
                event.preventDefault();
                event.stopPropagation();
            } else {
                emojis[index][property] = parse(value);
                console.log(emojis);
            }
        });

        return { label: labelElement, input: element };
    }

    function addEmoji(name, img, ascent, height) {

        const div = document.createElement("div");

        div.classList.add("ghost", "emoji");

        const imgElement = document.createElement("img");
        const propertiesElement = document.createElement("div");
        propertiesElement.classList.add("properties");

        const nameElement = createInput("Name", emojis.length, "name", v => v, /^[A-Za-z_]{1,14}$/g);
        const ascentElement = createInput("Ascent", emojis.length, "ascent", parseInt, /^\d+$/g);
        const heightElement = createInput("Height", emojis.length, "height", parseInt, /^\d+$/g);

        imgElement.src = img;
        nameElement.input.value = name;
        ascentElement.input.value = ascent;
        heightElement.input.value = height;

        div.appendChild(imgElement);
        propertiesElement.appendChild(nameElement.label);
        propertiesElement.appendChild(ascentElement.label);
        propertiesElement.appendChild(heightElement.label);
        div.appendChild(propertiesElement);
        container.appendChild(div);

        emojis.push({ name, img, ascent, height });
    }

    function over(event) {
        event.preventDefault();
        event.stopPropagation();

        form.classList.add("is-dragover");
    }

    form.addEventListener("dragover", over);
    form.addEventListener("dragenter", over);

    function drop(event) {
        event.preventDefault();
        event.stopPropagation();

        form.classList.remove("is-dragover");
    }

    form.addEventListener("dragleave", drop);
    form.addEventListener("dragend", drop);
    form.addEventListener("drop", drop);
    form.addEventListener("drop", event => {
        for (const file of event.dataTransfer.files) {
            const reader = new FileReader();
            let name = file.name;
            if (name.endsWith(".png")) {
                name = name.slice(0, -4);
            }
            reader.addEventListener("load", event => {
                addEmoji(
                    name,
                    event.target.result,
                    7,
                    7
                );
            });
            reader.readAsDataURL(file);
        }
    });

    $("#save").addEventListener("click", () => {

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
            const dataPrefix = "data:image/png;base64,";
            const imgBytes = base64ToByteArray(emoji.img.substring(dataPrefix.length));
            const buffer = new ArrayBuffer(8 * 6 + imgBytes.length);
            const view = new Uint8Array(buffer);

            view.set([
                1,
                emoji.height,
                emoji.ascent,
                char >> 8,
                char & 0xFF,
                0
            ], 0);
            view.set(imgBytes, 6);

            zip.file(`${emoji.name}.mcemoji`, buffer);
            char--;
        }

        zip.generateAsync({ type: "blob" })
            .then(blob => {
                const downloadElement = document.createElement("a");
                downloadElement.setAttribute("href", URL.createObjectURL(blob));
                downloadElement.setAttribute("download", "emojis.zip");
                document.body.appendChild(downloadElement);
                downloadElement.click();
                downloadElement.remove();
            });
    });

    addEmoji("test", undefined, 7, 7);
    addEmoji("test", undefined, 7, 7);
    addEmoji("test", undefined, 7, 7);
    addEmoji("test", undefined, 7, 7);

})();
