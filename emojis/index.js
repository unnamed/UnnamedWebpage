(function() {

    const $ = selectors => document.querySelector(selectors);

    const container = $("#emoji-container");
    const form = $(".file-input");
    const emojis = [];

    function addEmoji(name, img, ascent, height) {

        const div = document.createElement("div");

        div.classList.add("ghost", "emoji");

        const imgElement = document.createElement("img");
        const propertiesElement = document.createElement("div");
        propertiesElement.classList.add("properties");
        const nameElement = document.createElement("input");
        const ascentElement = document.createElement("input");
        const heightElement = document.createElement("input");

        imgElement.src = img;
        nameElement.value = name;
        ascentElement.value = ascent;
        heightElement.value = height;

        div.appendChild(imgElement);
        propertiesElement.appendChild(nameElement);
        propertiesElement.appendChild(ascentElement);
        propertiesElement.appendChild(heightElement);
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

        const zip = new JSZip();

        for (const emoji of emojis) {
            const buffer = new ArrayBuffer(8 * 6);
            const view = new Int32Array(buffer);

            view.set([
                1,
                emoji.height,
                emoji.ascent,
                0,
                10,
                0
            ], 0);

            zip.file(`${emoji.name}.mcemoji`, buffer);
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

})();
