(function() {

    // anchors setup
    const root = document.getElementById("root");
    const header = document.getElementsByTagName("header").item(0);

    for (const anchor of document.getElementsByClassName("anchor")) {
        const targetId = anchor.dataset["anchorfor"];
        if (targetId) {
            const target = document.getElementById(targetId);
            if (target) {
                anchor.addEventListener("click", () => {
                    root.scroll({ top: (target.offsetTop - header.getBoundingClientRect().height), behavior: "smooth" });
                });
            }
        }
    }

    // some used elements
    const teamContainer = document.getElementById("team__container");
    const starsElement = document.getElementById("stars");

    // name of the organization in GitHub
    const organization = "unnamed";

    // fetch team members
    fetch(`https://api.github.com/orgs/${organization}/public_members`)
        .then(response => response.json())
        .then(members => members.map(({ url }) => {
            return fetch(url)
                .then(response => response.json())
                .then(member => {
                    let { name, login, bio, avatar_url, html_url } = member;
                    bio = bio ? bio.replace(/\r?\n/g, '') : "";
                    name = name ? name : login;

                    // dom modifications, sorry for doing this haha
                    const element = document.createElement("div");
                    const avatar = document.createElement("img");
                    const infoElement = document.createElement("div");
                    const nameElement = document.createElement("h4");
                    const loginElement = document.createElement("h5");
                    const bioElement = document.createElement("p");

                    element.classList.add("team__member");
                    element.addEventListener("click", () => {
                        window.open(html_url);
                    });

                    avatar.src = avatar_url;
                    nameElement.innerText = name;
                    loginElement.innerText = login;
                    bioElement.innerText = bio;

                    // append
                    infoElement.appendChild(nameElement);
                    infoElement.appendChild(loginElement);
                    infoElement.appendChild(bioElement);
                    element.appendChild(avatar);
                    element.appendChild(infoElement);
                    teamContainer.appendChild(element);
                });
        }));

    fetch(`https://api.github.com/orgs/${organization}/repos`)
        .then(response => response.json())
        .then(repositories => repositories.filter(repo => !repo.fork).reduce((count, repo) => count + repo.stargazers_count, 0))
        .then(stars => starsElement.innerText = stars.toString());

})();