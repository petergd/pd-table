# pd-table

A Custom Web Element used to create a sortable, filterable and 
paginated table, having also group by functionality, that can export the filtered or grouped results as Excel, TSV, CSV file.

`Data source format is JSON. Object keys ideally should be snakecase, e.g. "education_level"`

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/pd-table)

[Demo page (by unpkg.com)](https://unpkg.com/pd-table@1.1.0/index.html)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

`node.js`

### Installing

`$ npm install pd-table`

## Deployment

Add the custom element tag to your HTML page. 

The element's parameters are:

 - **export-button** text - if not set default value is "Export" 
 - **group-by** text - if not set default value is "Group By" 
 - **table-label** text - if not set default value is "Example Table"
 - **data-index** text - if set it skips a column table that has that key in JSON data
 - **no-results** text - if not set default value is "No records were found for the provided keywords" 
 - **from-to** text - if not set default value is "rows {FROM} to {TO} of {SIZE}" tags {FROM}, {TO}, {SIZE} are not change
 - **go-to** text - if not set default value is "go to page {NUM}" tag {NUM} is not to change.
 - **rpp-message** text - if not set default value is "rows per page"
 - **per-page** - number if not set default value is "5" 
 - **table-data** - JSON data are loaded to the component via this attribute
 - **nodata-message** - text if not set default value is "Data is invalid or empty! Please try again!"
   
Simplest way to use:

`<pd-table></pd-table>`

There are 6 example JSON files that are provided along with the package to check on your own performance of various datasets and data lengths.
Those files `generated.json, generated1.json, ..., generated5.json` are between 1000 records and ~151K records.

    window.addEventListener("DOMContentLoaded", async (event) => {
		let response = await fetch("generated4.json");	
		let data = await response.text();
		let pdTable = document.createElement("pd-table");
		pdTable.setAttribute('table-data', data);
		document.body.prepend(pdTable);
	});

Additional `CSS` is used to position the messages container *pd-table*.

    <style>
	body {
		font-family: system-ui;
		height: 100%;
		background-color: #fff;
		display: flex;
		align-items:center;
		justify-content:center;
		align-content: center;
	}
	:host {
		display: block;
	}
	pd-table {
		display: block;
		width:100%;
		align-self: center;
	}  	
    </style>

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request 😁

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
