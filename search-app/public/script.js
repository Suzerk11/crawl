const fields = ['id', 'intro_id',
    'name', 'avatar', 'title',
    'description', 'vector',
    'short-description', 'instagram',
    'twitter', 'linkedin',
    'youtube', 'tiktok',
    'session_price', 'session_duration',
    'rating', 'rating_count',
    'verified', 'url',
    'top_expert']

const socials = ['linkedin', 'instagram', 'twitter', 'youtube', 'tiktok', 'url']
const filter_fields = ['id', 'intro_id', 'vector', 'verified', 'top_expert', 'session_price', 'session_duration', 'rating', 'rating_count']
const limit = 3;
let currentPage = 1;
let offset = 0;
let totalRecords = 0;

document.addEventListener('DOMContentLoaded', async () => {
    await fetchCoundAndResults()
});

document.getElementById('searchButton').addEventListener('click', async () => {
    await fetchCoundAndResults()
});

async function fetchCoundAndResults() {
    currentPage = 1;
    offset = 0;
    await getCollectionCount();
    await fetchAndDisplayResults();
}

async function fetchAndDisplayResults() {
    const query = document.getElementById('searchInput').value.trim();
    const selectedField = document.getElementById('fieldSelect').value;

    const response = await fetch(`/intro?q=${encodeURIComponent(query)}&field=${encodeURIComponent(selectedField)}&limit=${limit}&offset=${offset}`);
    console.log(response)
    const results = await response.json();
    displayResults(results);
}

async function getCollectionCount() {
    const query = document.getElementById('searchInput').value.trim();
    const selectedField = document.getElementById('fieldSelect').value;
    const response = await fetch(`/count?q=${encodeURIComponent(query)}&field=${encodeURIComponent(selectedField)}`);
    const results = await response.json();
    totalRecords = results['total'];
    console.log('Update totalRecords:', totalRecords)
    return results['total'];
}


function createNav() {
    const pagination = document.createElement('nav');
    pagination.setAttribute('aria-label', 'Page navigation');
    const paginationList = document.createElement('ul');
    paginationList.className = 'pagination';

    const prevButton = document.createElement('li');
    prevButton.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.innerText = 'Previous';
    prevLink.href = '#';
    prevLink.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            offset = (currentPage - 1) * limit;
            fetchAndDisplayResults();
        }
    };
    prevButton.appendChild(prevLink);
    paginationList.appendChild(prevButton);


    const pageButton = document.createElement('button');
    pageButton.className = 'btn btn-secondary';
    pageButton.innerText = currentPage;
    paginationList.appendChild(pageButton);

    let totalPages = Math.ceil(totalRecords / limit);
    const nextButton = document.createElement('li');
    nextButton.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.innerText = 'Next';
    nextLink.href = '#';
    nextLink.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            offset = (currentPage - 1) * limit;
            fetchAndDisplayResults();
        }
    };
    nextButton.appendChild(nextLink);
    paginationList.appendChild(nextButton);
    pagination.appendChild(paginationList);
    return pagination
}

function createTable(results) {
    const container = document.createElement('div');
    container.className = 'results-container';

    const table = document.createElement('table');
    table.className = 'table table-striped';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    fields.forEach(field => {
        if (filter_fields.includes(field) || socials.includes(field)) {
            return;
        }
        const th = document.createElement('th');
        if (field === 'avatar') {
            th.innerHTML = 'Profile';
        } else {
            th.innerHTML = field.charAt(0).toUpperCase() + field.slice(1);
        }
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    createRows(results, tbody);
    table.appendChild(tbody);
    container.appendChild(table);
    return container;
}

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (results.length === 0) {
        resultsDiv.innerHTML = '<p>No Result</p>';
        return;
    }

    let table = resultsDiv.querySelector('table');
    if (!table) {
        const container = createTable(results);
        resultsDiv.appendChild(container);
    } else {
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';
        createRows(results, tbody);

    }

    let pagination = resultsDiv.querySelector('nav');
    if (!pagination) {
        pagination = createNav();
        resultsDiv.appendChild(pagination);
    } else {
        pagination.innerHTML = currentPage;
    }


    resultsDiv.appendChild(pagination);
}

function createRows(results, tbody) {
    results.forEach(item => {
        const row = document.createElement('tr');
        let fullName = `${item.first_name.charAt(0).toUpperCase()}${item.first_name.slice(1)} ${item.last_name.charAt(0).toUpperCase()}${item.last_name.slice(1)}`;

        fields.forEach(field => {
            if (!filter_fields.includes(field)) {
                const td = document.createElement('td');
                if (field === 'avatar') {
                    td.innerHTML = `<img src="${item[field]}" alt="Avatar"/>`;

                    const socialLinks = socials
                        .map(social => item[social] ? `<a href="${item[social]}" target="_blank">${social.charAt(0).toUpperCase() + social.slice(1)}</a>` : '')
                        .join(' ');

                    td.innerHTML += socialLinks;
                }
                else if (socials.includes(field)) {
                    return;
                } else if (field === 'name') {
                    td.innerHTML = `<span id="${field}">${fullName}</span>`;
                } else if (field === 'short-description') {
                    td.innerHTML = `<span id="${field}">${item['short_description']}</span>`;
                }
                else {
                    td.innerHTML = `<span id="${field}">${item[field]}</span>`;
                }
                row.appendChild(td);
            }
        });
        tbody.appendChild(row);
    });
}
