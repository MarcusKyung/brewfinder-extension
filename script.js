function getLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve(position),
                (error) => reject(error)
            );
        } else {
            reject("Geolocation is not supported by this browser.");
        }
    });
}

function displayGreeting() {
    let randomNum = Math.floor(Math.random() * 5) + 1;

    let greeting;
    let language; 

    if (randomNum === 1) {
        greeting = "Cheers!";
        language = " (English)";
    } else if (randomNum === 2) {
        greeting = "Prost!";
        language = " (German)";
    } else if (randomNum === 3) {
        greeting = "Salud!";
        language = " (Spanish)";
    } else if (randomNum === 4) {
        greeting = "Sláinte!";
        language = " (Irish)";
    } else {
        greeting = "Skål!";
        language = " (Swedish)";
    }

    document.getElementById("greetingDisplay").classList.add("greetingStyling");
    document.getElementById("greetingDisplay").innerHTML = greeting; 
    document.getElementById("greetingDisplay").setAttribute("data-language", language);

}


async function createButtons(data) {
    const buttonContainer = document.getElementById("buttonContainer");
    const viewToggleContainer = document.getElementById("viewToggleContainer");

    const openBreweryButton = document.createElement("button");
    openBreweryButton.textContent = "Visit OpenBreweryDB";
    openBreweryButton.addEventListener("click", () => {
        window.open("https://www.openbrewerydb.org/", "_blank");
    });
    buttonContainer.appendChild(openBreweryButton);

    if (data[0].website_url) {
        const breweryHomepageButton = document.createElement("button");
        breweryHomepageButton.textContent = "Visit Brewery Webpage";
        breweryHomepageButton.addEventListener("click", () => {
            window.open(data[0].website_url, "_blank");
        });
        buttonContainer.appendChild(breweryHomepageButton);
    } else {
        const breweryNoHomepageButton = document.createElement("button");
        breweryNoHomepageButton.textContent = "No Brewery Webpage Available";
        buttonContainer.appendChild(breweryNoHomepageButton);
    }

    const viewToggleButton = document.createElement("button");
    viewToggleButton.addEventListener("click", () => {
        const infoCardDisplay = document.getElementById("infoCardDisplay");
        const searchBreweriesDisplay = document.getElementById("searchBreweriesDisplay");
        infoCardDisplay.setAttribute("style", "display: none");
        searchBreweriesDisplay.removeAttribute("style");
    });
    viewToggleButton.textContent = "Search Breweries";
    viewToggleContainer.appendChild(viewToggleButton);

    const buttonGroup = document.getElementById("buttonGroup");
    const prevPage = document.createElement("button");
    const nextPage = document.createElement("button");
    prevPage.setAttribute("id", "prevPageButton");
    nextPage.setAttribute("id", "nextPageButton");
    prevPage.textContent = "<<<";
    nextPage.textContent = ">>>";
    buttonGroup.appendChild(prevPage);
    buttonGroup.appendChild(nextPage);
    document.getElementById("prevPageButton").addEventListener("click", loadPreviousPage);
    document.getElementById("nextPageButton").addEventListener("click", loadNextPage);
}


let currentPage = 1;

function loadPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        searchBreweries();
    }
}

function loadNextPage() {
    currentPage++;
    searchBreweries();
}

async function searchBreweries(event) {
    try {
        if (event) {
            event.preventDefault();
        }

        let state = document.getElementById("stateInput").value;
        let city = document.getElementById("cityInput").value;

        const searchResponse = await fetch(`https://api.openbrewerydb.org/v1/breweries?by_city=${city}&by_state=${state}&per_page=3&page=${currentPage}`);
        const searchData = await searchResponse.json();
        console.log(searchData);
        const brewerySearchList = document.getElementById("brewerySearchList");

        brewerySearchList.innerHTML = "";

        if (searchData.length === 0) {
            brewerySearchList.innerHTML = "No breweries found. Please try again.";
        } else if (searchData.length < 3 && searchData.length > 0) {
            nextPageButton.disabled = true; 
            for (const brewery of searchData) {
                const brewerySearchItem = document.createElement("li");
                brewerySearchItem.textContent = brewery.name;
                brewerySearchList.appendChild(brewerySearchItem);
            }
        } else {
            nextPageButton.disabled = false; 
            for (const brewery of searchData) {
                const brewerySearchItem = document.createElement("li");
                brewerySearchItem.textContent = brewery.name;
                brewerySearchList.appendChild(brewerySearchItem);
            }
        }


    } catch (error) {
        console.error("Error:", error);
    }
}

async function fetchData() {
    try {
        // Show the loading indicator before fetching data
        const loadingIndicator = document.getElementById("loadingIndicator");
        loadingIndicator.style.display = "block";

        const position = await getLocation();
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const response = await fetch(`https://api.openbrewerydb.org/v1/breweries?by_dist=${latitude},${longitude}`);
        const data = await response.json();
        const closestBrewery = data[0].name;
        const closestBreweryAddress = data[0].street;
        const closestBreweryState = data[0].state;
        const closestBreweryPostalCode = data[0].postal_code;
        const closestBeerType = data[0].brewery_type;
        const closestBeerTypeFirst = closestBeerType.charAt(0).toUpperCase();
        const closestBeerTypeRest = closestBeerType.slice(1);

        document.getElementById("infoCardDisplay").classList.add("infoCard");
        document.getElementById("closestBeer").innerHTML = closestBrewery + " - " + closestBeerTypeFirst + closestBeerTypeRest;
        document.getElementById("closestBeerAddress").innerHTML = closestBreweryAddress + ", " + closestBreweryState + closestBreweryPostalCode;

        createButtons(data);
        displayGreeting();

        loadingIndicator.style.display = "none";
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("closestBeer").innerHTML = "This extension has encountered an error. Geolocation must be enabled in your browser settings for this extension to work. Right click on extension, click View Web Permissions, then toggle Location to Allow.";

        const loadingIndicator = document.getElementById("loadingIndicator");
        loadingIndicator.style.display = "none";
    }
}

document.getElementById("searchForm").addEventListener("submit", searchBreweries);

fetchData();
