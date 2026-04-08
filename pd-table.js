import * as XLSX from 'https://cdn.jsdelivr.net/npm/xlsx/+esm'
export class pdTable extends HTMLElement {
  #tableData;
  #headerTitles;
  #css;
  #currPage;
  #perPage;
  #filtered;
  #extractDataIndex;
  #totPages;
  #groupByLabel;
  #tableLabel;
  #noResults;
  #fromTo;
  #goTo;
  #rppMessage;
  #noDataMessage;
  #exportButtonLabel;
  #exportData;
  
  static get observedAttributes() {
    return ['export-button', 'table-label', 'data-index', 'no-results', 'from-to', 'go-to', 'rpp-message', 'per-page', 'table-data', 'nodata-message', 'group-by'];
  }

  constructor() {
    super();
    this.sRoot = this.attachShadow({
      mode: 'closed'
    });
	let tableLabel = this.getAttribute('table-label');
	let noResults = this.getAttribute('no-results');
	let fromTo = this.getAttribute('from-to');
	let goTo = this.getAttribute('go-to');
	let rppMessage = this.getAttribute('rpp-message');
	let perPage = this.getAttribute('per-page');
	let groupByLabel = this.getAttribute('group-by');
	let noDataMessage = this.getAttribute('nodata-message');
	let tableData = this.getAttribute('table-data');
	let extractDataIndex = this.getAttribute('data-index');
	let exportButtonLabel = this.getAttribute('export-button');
	this.#groupByLabel = !this.#isEmpty(groupByLabel) ? groupByLabel.replace(/(<([^>]+)>)/gi, '') : 'Group By';
	this.#tableLabel = !this.#isEmpty(tableLabel) ? tableLabel.replace(/(<([^>]+)>)/gi, '') : 'Example Table';
	this.#noResults = !this.#isEmpty(noResults) ? noResults.replace(/(<([^>]+)>)/gi, '') : 'No records were found for the provided keywords';
	this.#fromTo = !this.#isEmpty(fromTo) ? fromTo.replace(/(<([^>]+)>)/gi, '') : 'rows {FROM} to {TO} of {SIZE}';
	this.#goTo = !this.#isEmpty(goTo) ? goTo.replace(/(<([^>]+)>)/gi, '') : 'go to page {NUM}';
	this.#rppMessage = !this.#isEmpty(rppMessage) ? rppMessage.replace(/(<([^>]+)>)/gi, '') : 'rows per page';
	this.#perPage = !this.#isEmpty(perPage) ? parseInt(perPage) : 15;
	this.#noDataMessage = !this.#isEmpty(noDataMessage) ? noDataMessage.replace(/(<([^>]+)>)/gi, '') : 'Data is invalid or empty! Please try again!';
	this.#tableData = !this.#isEmpty(tableData) ? JSON.parse(tableData) : [];
	this.#extractDataIndex = !this.#isEmpty(extractDataIndex) ? extractDataIndex.replace(/(<([^>]+)>)/gi, '') : '';
    this.#exportButtonLabel = !this.#isEmpty(exportButtonLabel) ? exportButtonLabel.replace(/(<([^>]+)>)/gi, '') : 'EXPORT';
	window.performance.mark('Module initialized');
  }
  
  #setStyle() {
    const Style = document.createElement('style');
    this.#css = `:host {
		--main-color: hsl(190, 41%, 33%);
		--odd: hsl(255, 100%, 97%);
		--even: hsl(255, 100%, 100%);
		--hover: hsl(128, 25%, 85%);
		--active: hsl(106, 79%, 23%);
	}
	.asc:after {
		content: "▲";
	}
	.desc:after {
		content: "▼";
	}
	.active {
		background-color: var(--active);
	}
	.footer {
		display: inline-flex;
		flex-flow: row;
		width: 100%;
		gap: 1vw;
		justify-content: space-between;
		height: 4vmax;
		margin-top: 2vh;
		align-items: center;
	}
	.searchable {
		width: 100%;
		display: flex;
		align-items: stretch;
		justify-content: space-between;
		height: 3.5vmax;
		position: sticky;
		top: 0;
		background: #fff;
		z-index: 999;
	}
	.pagination {
		display: flex;
		align-items: stretch;
		justify-content: end;
		flex-flow: row;
		width: 30%;
		gap: 0.5rem;
		float: right;
	}
	.pagination > button[aria-selected="true"] {
		background-color: var(--even);
		border-color: var(--main-color);
	}
	.pagination > button {
		text-size-adjust: 80%;
		color: var(--main-color);
		height: 3vmax;
		width: 4vmax;
		border-radius: 0.25em;
		align-items: center;
		justify-content: center;
		display: flex;
		border: solid 0.01em var(--main-color);
		cursor: pointer;
		line-height: 3vmax;
		font-size: min(1.75vmin, 1rem);
	}
	.pagination > button:first-child {
		margin-left: 0;
	}
	.pagination > button.btn-char {
		font-size: 1rem;
	}
	.searchable .dropdown-container button.btn {
		background-color: var(--main-color);
		height: 2.5vmax;
		margin: 1vh 0.55vw;
		text-align: center;
		border-radius: 0.25em;
		border: solid 0.01em var(--main-color);
		cursor: pointer;
		padding: 0.5em;
		font-size: min(1.5vmin, 1.5rem);
		color: var(--even);
	}
	.dropdown-container {
		z-index: 999;
	  	position: fixed;
		right: 0;
		top: 0;
	}
	.dropdown-list {
		right: 0;
		display: none;
		position: absolute;
		background-color: #f9f9f9;
		width: 7rem;
		box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
	}
	.dropdown-list a {
		color: var(--main-color);
		padding: 12px 16px;
		text-decoration: none;
		display: block;
	}
	.dropdown-list a:hover {
		background-color: var(--even);
	}
	.dropdown-container:hover .dropdown-list {
		display: block;
	}
	.dropdown-container:hover .btn {
		background-color: var(--even);
	}
	.rsdisplay {
		width: 10%;
		font-size: 1.125vmax;
	}
	.pgdisplay {
		width: 15%;
		font-size: 1.125vmax;
		text-align: center;
	}
	.search {
		font-size: 1vmax;
		position: fixed;
		top: 0;
		width: auto;
		height: 2.5vmax;
		font-family: inherit;
		border-radius: 0.25em;
		border: solid 0.01em var(--odd);
		padding: 0.5em 1em;
		margin: 1vh 0 1vh 0;
		outline: none;
		transition: border 0.9s;
		cursor: text;
	}
	.select,
	select	{
		font-size: 1vmax;
		position: relative;
		width: 8%;
		height: 3vmax;
		font-family: inherit;
		border-radius: 0.25em;
		border: solid 0.01em var(--odd);
		padding: 0.5em 1em;
		cursor: pointer;
	}	
	.searchable select#groupBy,
	.searchable select.group {
	  appearance: base-select;
	  position: fixed;
	  top: 1vh;
	  z-index: 999;
	  background: var(--odd);
	  width: 200px;
	  height: 2.5vmax;
	}
	.searchable select#groupBy {
	  right: 70px;
	  padding: 0;
	}
	.select,
	.searchable select.group	{
		transition: border 0.9s;
	}
	.searchable select:hover,
	.searchable select:focus,
	.search:hover,
	.search:focus,
	.select:hover,
	.select:focus {
		border: solid 0.01em var(--main-color);
		color: var(--main-color);
	}
	.wrapper {		
		align-self: flex-start;
		display:flex;
		paddin: 0;
		margin: 0;
		flex-flow:column;
		width:100%;
		font-family: inherit;
	}
	.table {
		margin: 0;
		width: 100%;
		box-shadow: 0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.2);
		display: table;
	}
	.row {
		display: table-row;
		padding: 3vh 0;
		background: var(--even);
	}
	.row:nth-of-type(odd) {
		background: var(--odd);
	}
	.row:not(.header):hover {
		background: var(--hover, #000069);
	}
	.row.header {
		font-weight: 300;
		text-align: center;
		color: #fff;
		background: var(--main-color, #000069);
		cursor: pointer;
		-webkit-user-select: none;
		-ms-user-select: none;
		user-select: none;
		position:sticky;
		top: 3.5vmax;
	}
	.row.green {
		background: var(--even);
	}
	.row.blue {
		background: var(--odd);
	}
	.cell {
		padding: 0.375rem 0.75rem;
		display: table-cell;
		font-size: 2vh;
		line-height: 2.5vh;
		text-align: center;
		font-weight: 300;
	}
	.row .cell {
		border-right-width: 1px;
		border-right-style: solid;
		border-right-color: var(--odd);
	}
	.row:nth-of-type(odd) .cell {
		border-right-width: 1px;
		border-right-style: solid;
		border-right-color: var(--even);
	}
	.row .cell:last-child {
		border:none;
	}
	.row:nth-of-type(odd) .cell:lasthild {
		border:none;
	}
	.loader {
	  transform: rotateZ(45deg);
	  perspective: 1000px;
	  border-radius: 50%;
	  width: 48px;
	  height: 48px;
	  color: #216ca6;
	  position: fixed;
	  z-index: 9999;
	  top: calc(50% - 24px);
	  left: calc(50% - 24px);
	}
	.hidden {
		display: none;
	}
	.loader:before,
	.loader:after {
	  content: '';
	  display: block;
	  color: #FF3D00;
	  position: absolute;
	  top: 0;
	  left: 0;
	  width: inherit;
	  height: inherit;
	  border-radius: 50%;
	  transform: rotateX(70deg);
	  animation-delay: .4s;
	  animation: 1s spin linear infinite;
	}
	.loader:after {
	  color: #FF3D00;
	  transform: rotateY(70deg);
	}
	@keyframes spin {
	  0%,
	  100% {
		box-shadow: .2em 0px 0 0px #FF3D00;
	  }
	  12% {
		box-shadow: .2em .2em 0 0 #FF3D00;
	  }
	  25% {
		box-shadow: 0 .2em 0 0px #FF3D00;
	  }
	  37% {
		box-shadow: -.2em .2em 0 0 #FF3D00;
	  }
	  50% {
		box-shadow: -.2em 0 0 0 #FF3D00;
	  }
	  62% {
		box-shadow: -.2em -.2em 0 0 #FF3D00;
	  }
	  75% {
		box-shadow: 0px -.2em 0 0 #FF3D00;
	  }
	  87% {
		box-shadow: .2em -.2em 0 0 #FF3D00;
	  }
	}
	.searchable label {
	  height: 2.5vmax;
	  line-height: 2.5vmax;
	  position: fixed;
	  top: 1vh;
	  right: 280px;
	  z-index: 999;
	  color: var(--main-color);
	}
	.searchable select.group {
	  right: 380px;
	}

	.searchable select#groupBy option, 
	.searchable select.group option {
	  background: var(--odd);
	  padding: 0.125em 0.5em;
	  height: calc(2.5vmax - 4px);
	  outline: none;
	}

	.searchable select#groupBy option:nth-of-type(odd), 
	.searchable select.group option:nth-of-type(odd) {
	  background: var(--even);
	}
	.searchable select#groupBy option::checkmark {
	  order: 1;
	  margin-left: auto;
	  content: "☑️";
	}
	.searchable select#groupBy option:checked,
	.searchable select.group option:checked {
	  font-weight: bold;
	}

	.searchable select#groupBy option:hover,
	.searchable select#groupBy option:focus,
	.searchable select.group option:hover,
	.searchable select.group option:focus {
	  background: var(--hover);
	}
	.searchable select#groupBy {
	  overflow: hidden;
	  transition: height 0.9s, border 0.9s;
	  interpolate-size: allow-keywords;
	}
	.searchable select#groupBy:hover,
	.searchable select#groupBy:has(option:focus) {
	  height: fit-content;
	}
	@supports not (appearance: base-select) {
	  body::before {
		content: "Your browser does not support 'appearance: base-select'.";
		color: black;
		background-color: wheat;
		position: fixed;
		left: 0;
		right: 0;
		top: 40%;
		text-align: center;
		padding: 1rem 0;
		z-index: 1;
	  }
	}
	@media screen and (max-width: 580px) {
		.table {
			display: block;
			width: 100vw;
		}
	}
	@media screen and (max-width: 580px) {
		.row {
			padding: 0.875rem 0 0.4375rem;
			display: block;
		}
		.row.header {
			padding: 0;
			height: 0.375rem;
		}
		.cell {
			padding: 0.125rem 1rem;
			display: block;
		}
		.row .cell {
			font-size: min(1.5vh, 1.5rem);
			text-align: right;
			line-height: 2vh;
		}
		.row .cell::before {
			float: left;
			content: attr(data-title);
			font-size: min(1.5vh, 1.5rem);
			line-height: 2vh;
			font-weight: 700;
			text-transform: uppercase;
			color: #969696;
			display: block;
		}
		.row.header .cell {
			display: none;
		}
		.searchable select#groupBy {
			width: 80px;
			right: 10%;
			top: 2px;
			height: 2.5vh;
		}
		.searchable label {
			font-size: 1.5vh;
			right: calc(11% + 85px);
		}
		.searchable select.group {
			width: 100px;
			right: calc(11% + 135px);
			top: 2px;
			height: 2.5vh;
		}
	}	`;
    Style.append(this.#css);
    this.sRoot.prepend(Style);
  }
  
  #createRow(rowData, isHeader = false) {
    const row = document.createElement('div');
    row.classList.add('row');
    row.setAttribute('role', 'row');
    if (isHeader) {
      row.classList.add('header');
      row.setAttribute('role', 'columnheader');
      row.setAttribute('aria-sort', 'none');
    }
    for (let rowIndex in rowData) {
      if (!this.#isEmpty(this.#extractDataIndex)) {
        if (rowIndex != this.#extractDataIndex) {
          row.appendChild(this.#createCell(rowData[rowIndex], rowIndex, isHeader, rowData[this.#extractDataIndex]));
        }
      } else {
        row.appendChild(this.#createCell(rowData[rowIndex], rowIndex, isHeader, rowData[this.#extractDataIndex]));
      }
    }
    return row;
  }
  
  #toggleHeaders(tableId) {
	  const headers = this.sRoot.querySelectorAll('.row.header .cell');
	  const loader = this.sRoot.querySelector('.loader');
	  headers.forEach((x) => {
		  x.classList.remove('active');
		  x.addEventListener('click',async (e) => {
			  if( loader.classList.contains('hidden')) {
				  loader.classList.remove('hidden');	
			  }
			  e.target.classList.add('active');
			  if(e.target.classList.contains('asc')) {
				  e.target.classList.remove('asc');
				  e.target.classList.add('desc');
				  e.target.setAttribute('aria-sort', 'descending');
				  e.target.setAttribute('aria-label', 'descending order active');
			  } else if(e.target.classList.contains('desc')) {
				  e.target.classList.remove('desc');
				  e.target.classList.add('asc');
				  e.target.setAttribute('aria-sort', 'ascending');
				  e.target.setAttribute('aria-label', 'ascending order active');
			  } else {
				  e.target.classList.add('asc');
				  e.target.setAttribute('aria-sort', 'ascending');
				  e.target.setAttribute('aria-label', 'ascending order active');
			  }	
			  await this.#applySorting();		  
			  await this.#changePage(tableId, 1);
			  window.performance.mark('Module state changed');
			  //console.log(window.performance.measure("Duration to change", 'Module state changed', 'Module state changed'));			  
		  });
		  x.addEventListener('dblclick',async (e) => {
			  if( loader.classList.contains('hidden')) {
				  loader.classList.remove('hidden');	
			  }
			  e.target.classList.remove('active');
			  e.target.classList.remove('asc');
			  e.target.classList.remove('desc');
			  e.target.removeAttribute('aria-sort');
			  e.target.removeAttribute('aria-label');	
			  await this.#applySorting();	
			  await this.#changePage(tableId, 1);
			  window.performance.mark('Module state changed');
			  //console.log(window.performance.measure("Duration to change", 'Module state changed', 'Module state changed'));
		  });
      });
  }
  
  #createCell(cellValue, cellTitle = '', isHeader, dataIndexId) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.textContent = cellValue;
    if (cellTitle.length > 0) {
      cell.dataset.title = cellTitle;
    }
    if (!this.#isEmpty(this.#extractDataIndex) && isHeader == false) {
      cell.dataset.id = dataIndexId;
    }
    return cell;
  }
  
  #createSearch(tableId) {
    const search = document.createElement('div');
    search.classList.add('searchable');
	const btnCont = document.createElement('div');
	btnCont.classList.add('dropdown-container');
	const listCont = document.createElement('div');
	listCont.classList.add('dropdown-list');
	
	const grpBy = document.createElement('select');
	grpBy.setAttribute("multiple", "");
	grpBy.id = "groupBy";
	const grpByLabel = document.createElement('label');
	grpByLabel.textContent = this.#groupByLabel;
	grpByLabel.setAttribute("for", "groupBy");
	
	const input = document.createElement('input');
	
	Object.keys(this.#tableData[0]).forEach((x) => {
		const option = document.createElement("option");
		option.value = x;
		option.textContent = x.toUpperCase().split("_").join(" ");
		grpBy.append(option);
	});
	
	grpBy.addEventListener("change", async () => {	
		if(!this.#isEmpty(input.value)) {
			input.value = "";
		}
		const groupExists = this.sRoot.querySelector("select.group");
		if(groupExists) {
			groupExists.remove();
		}
		const grpdBy = await Array.from(grpBy.selectedOptions).map(x => x.value).filter(x => x);
		const groupByEL = await Object.groupBy(this.#tableData, (item) => {
			const gb = grpdBy.map(x => item[x]).join(' + ');
			return `${gb}`;
		});
		const keys = Object.keys(groupByEL);
		if(!this.#isEmpty(grpdBy)) {
			const group = document.createElement('select');
			group.classList.add("group");
			keys.forEach((x) => {
				const option = document.createElement("option");
				option.value = x;
				option.textContent = x;
				group.append(option);
			});
			group.addEventListener("change", async (e) => {
				this.#filtered = groupByEL[e.target.value];
				this.#totPages = Math.ceil(this.#filtered.length / this.#perPage);
				await this.#changePage(tableId, 1);
			});
			search.appendChild(group);
			const firstOption = group.options[0].value
			this.#filtered = groupByEL[firstOption];
			this.#totPages = Math.ceil(this.#filtered.length / this.#perPage);
			await this.#changePage(tableId, 1);
		} else {
			this.#filtered = this.#tableData;
			this.#totPages = Math.ceil(this.#filtered.length / this.#perPage);
			await this.#changePage(tableId, 1);
		}
	});

	['Excel', 'TSV', 'CSV'].forEach((word) => {
		const item = document.createElement('a');
		item.href = `#${word.toLowerCase()}`;
		item.textContent = word;
		item.title = `Export as ${word}`;
		listCont.appendChild(item);
		item.addEventListener('click',async  (e) => {
		  e.preventDefault();
		  e.stopPropagation();
		  await this.#exportTable(word);
		});
	});
	const btn = document.createElement('button');
	btn.classList.add('btn');
	btn.type = 'button';
	btn.textContent = this.#exportButtonLabel;
	
    input.type = 'search';
    input.placeholder = 'search';
    input.setAttribute('aria-controls', tableId);
    input.setAttribute('role', 'searchbox');
    input.classList.add('search', 'control');
    input.addEventListener('keyup',async  (e) => {
      e.preventDefault();
      e.stopPropagation();
	  const table = this.sRoot.querySelector('.table');
	  const code = e.code.toLowerCase();
	  let loader = this.sRoot.querySelector('.loader');
	  if( loader.classList.contains('hidden')) {
		  loader.classList.remove('hidden');
		  table.classList.add('hidden');		  
	  }
	  if(code === "enter" ||
	  code === "comma" ||
	  code === "semicolon" ||
	  code === "tab" ||
	  code === "space" ) {
		if( table.classList.contains('hidden')) {
			table.classList.remove('hidden');
			loader.classList.add('hidden');
		}
		await this.#filter(tableId, e.target.value);
	  }
    });
	btnCont.appendChild(btn);
	btnCont.appendChild(listCont);
	search.appendChild(btnCont);
    search.appendChild(input);
	search.appendChild(grpByLabel);
	search.appendChild(grpBy);
    return search;
  }
  async #filter(tableId, txt) {	 
	const grouped = this.sRoot.querySelector("select.group");
	const groupBy = this.sRoot.querySelector("select#groupBy");
	if(grouped) {
		grouped.remove();
		groupBy.selectedIndex = -1;
	}
    this.sRoot.querySelectorAll('.row:not(.header)').forEach(x => x.remove());
	let found = false;
    const table = this.sRoot.querySelector('.table');
	const words = txt.split(new RegExp('[\,+\;+\\n+\\s+\\t+]', 'g')).map(x => x.toLowerCase());
    this.#filtered = await this.#tableData.filter((x) => {
	  const rowArray = Array.from(Object.values(x));
	  found = words.every(word => rowArray.join(' ').toLowerCase().includes(word));
	  if(found) {
		  return x;
	  }
    });
    this.#totPages = Math.ceil(this.#filtered.length / this.#perPage);
    await this.#changePage(tableId, 1);
	window.performance.mark('Module state changed');
	//console.log(window.performance.measure("Duration to change", 'Module state changed', 'Module state changed'));
  }
  #createTable(tableId) {
    const table = document.createElement('div');
    table.classList.add('table');
    table.setAttribute('role', 'table');
    table.setAttribute('aria-label', this.#tableLabel);
    table.setAttribute('aria-rowcount', this.#filtered.length);
    table.id = tableId;
    this.#headerTitles = {...this.#filtered[0]};
    for (let headerIndex in this.#headerTitles) {
	  this.#headerTitles[headerIndex] = this.#splitCamelCase(headerIndex).replace('_', ' ').toUpperCase();
    }
    table.appendChild(this.#createRow(this.#headerTitles, true));
    this.#filtered.slice(0, this.#perPage).forEach((rowData) => {
      table.appendChild(this.#createRow(rowData));
    });
    return table;
  }
  #splitCamelCase(camel) {
	return camel.split(/(?<!^)([A-Z][a-z0-9]+|(?<=[a-z0-9])[A-Z]+)|(_)/).filter(e => e).join(' ');
  }
  #createPerPageSelector(tableId) {
    const select = document.createElement('select');
    select.classList.add('select');
    [5, 10, 15, 20, 50, 100].forEach((x) => {
      const option = document.createElement('option');
      option.value = x;
      option.textContent = x;
      if(x == this.#perPage) {
		  option.setAttribute('selected', 'selected');
	  }
      select.appendChild(option);
    });
    select.addEventListener('change',async (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.#perPage = parseInt(e.target.value);
      e.target.querySelectorAll('option').forEach((x) => {
		  x.removeAttribute('selected');
		  if(x.value == this.#perPage) {
		      x.setAttribute('selected', 'selected');
		  }
	  });
      this.#totPages = Math.ceil(this.#filtered.length / this.#perPage);
      await this.#changePage(tableId, 1);
    });
    return select;
  }
  #createRsDisplay() {
    const rsdisplay = document.createElement('div');
    rsdisplay.classList.add('rsdisplay');
    rsdisplay.textContent = this.#rppMessage;
    return rsdisplay;
  }
  #createPgDisplay() {
    let pgdisplay = document.createElement('div');
    pgdisplay.classList.add('pgdisplay');
    this.#setPgMessage(pgdisplay);
    return pgdisplay;
  }
  #createFooter(tableId) {
    const footer = document.createElement('div');
    footer.classList.add('footer');
    footer.appendChild(this.#createPerPageSelector(tableId));
    footer.appendChild(this.#createRsDisplay());
    footer.appendChild(this.#createPgDisplay());
    footer.appendChild(this.#pagination(tableId));
    return footer;
  }
  #setPgMessage(el) {
    let slice_start = this.#perPage * (this.#currPage - 1);
    let slice_end = slice_start + this.#perPage;
    let start = (this.#currPage - 1) * this.#perPage + 1
    let tot = this.#filtered.slice(slice_start, slice_end).length - 1;
    let end = start + tot;
    if (!this.#isEmpty(this.#filtered)) {
      el.textContent = this.#fromTo.replace('{FROM}', start).replace('{TO}', end).replace('{SIZE}', this.#filtered.length);
    } else {
      el.textContent = this.#noResults;
    }
  }
  #createWrapper() {
	const fragment = new DocumentFragment();
    const wrapper = document.createElement('div');
	let tableId = !this.#isEmpty(this.id) ? this.id : 'sortable' ;
	fragment.appendChild(wrapper);
    wrapper.classList.add('wrapper');
	wrapper.innerHTML = '<div class="loader hidden"></div>';
    wrapper.appendChild(this.#createSearch(tableId));
    wrapper.appendChild(this.#createTable(tableId));
    wrapper.appendChild(this.#createFooter(tableId));
    this.sRoot.appendChild(fragment);
    this.#toggleHeaders(tableId);
  }
  #init() {
    const self = this;	
    self.#currPage = 1;
    self.#totPages = Math.ceil(self.#tableData.length / self.#perPage);
    self.sRoot.innerHTML = '';
    self.#filtered = [...self.#tableData];
    self.#createWrapper();
    self.#setStyle();
	window.performance.mark('Init time');
  }
  #createButton(tableId, ariaLabel, btnHTML, classList) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-controls', tableId);
    btn.setAttribute('aria-label', ariaLabel);
    btn.innerHTML = btnHTML;
    btn.classList.add(...classList);
    return btn;
  }
  async #applySorting() {
	const activeHeaders = this.sRoot.querySelectorAll('.row.header .cell.active');
	const args = [];
	if(!this.#isEmpty(activeHeaders)) {
		activeHeaders.forEach((x) => {
			const obj = {};
			if(x.classList.contains('asc')) {
			  obj.name = x.dataset.title;
			  obj.direction = 1;
			  args.push(obj);
			}
			if(x.classList.contains('desc')) {
			  obj.name = x.dataset.title;
			  obj.direction = -1;
			  args.push(obj);
			}
		});
		await this.#objSort(...args);
	} else {
		this.#filtered = [...this.#tableData];
	}
  }
  async #changePage(tableId, page) {
    const table = this.sRoot.querySelector('.table');
	const loader = this.sRoot.querySelector('.loader');
    table.querySelectorAll('.row:not(.header)').forEach(x => x.remove());
    let start = this.#perPage * (page - 1);
    let end = start + this.#perPage;
    this.#filtered.slice(start, end).forEach((rowData) => {
      table.appendChild(this.#createRow(rowData));
    });
    this.#currPage = page;
    await this.#setPgMessage(this.sRoot.querySelector('.pgdisplay'));
    await this.#pagination(tableId);
	loader.classList.add('hidden');
  }
  #pagination(tableId) {
    let list = this.sRoot.querySelector('.pagination');
    if (this.#isEmpty(list)) {
      list = document.createElement('div');
      list.classList.add('pagination');
    }
    list.querySelectorAll('button').forEach(x => x.remove());
    if (this.#currPage > 1) {
      let toFirst = this.#createButton(tableId, 'start', '&#9664;&#9664;', ['btn-char']);
      toFirst.addEventListener('click',async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this.#changePage(tableId, 1)
      });
      list.appendChild(toFirst);
      let toPrev = this.#createButton(tableId, 'previous', '&#9664;', ['btn-char']);
      toPrev.addEventListener('click',async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this.#changePage(tableId, this.#currPage - 1);
		window.performance.mark('Module state changed');
		//console.log(window.performance.measure("Duration to change", 'Module state changed', 'Module state changed'));
      });
      list.appendChild(toPrev);
    }
    for (let i = this.#currPage - 2; i < this.#currPage + 2; i++) {
      if (i < 1 || i > this.#totPages)
        continue;
      let node = this.#createButton(tableId, this.#goTo.replace('{NUM}', i), i, ['btn']);
      if (i == this.#currPage) node.setAttribute('aria-selected', true);
      else node.addEventListener('click',async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this.#changePage(tableId, i);
		window.performance.mark('Module state changed');
		//console.log(window.performance.measure("Duration to change", 'Module state changed', 'Module state changed'));
      });
      list.appendChild(node);
    }
    if (this.#currPage < this.#totPages) {
      let toNext = this.#createButton(tableId, 'next', '&#9654;', ['btn-char']);
      toNext.addEventListener('click',async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this.#changePage(tableId, this.#currPage + 1);
      });
      list.appendChild(toNext);
      let toLast = this.#createButton(tableId, 'last', '&#9654;&#9654;', ['btn-char']);
      toLast.addEventListener('click',async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this.#changePage(tableId, this.#totPages);
		window.performance.mark('Module state changed');
		//console.log(window.performance.measure("Duration to change", 'Module state changed', 'Module state changed'));
      });
      list.appendChild(toLast);
    }
    return list;
  }
  #isDate = (date) => {
	return (new Date(date) !== "Invalid Date") && !isNaN(new Date(date));
  }
  async #objSort() {
    let sortObjects = arguments;
    let keys_length = sortObjects.length - 1;
    let a, b;
	if(this.#isEmpty(sortObjects)) {
		return;
	}
	for(let x of sortObjects) {
		this.#filtered = this.#filtered.sort((obj1, obj2) => {
			a = obj1[x.name];
			b = obj2[x.name];
			if(['undefined', null].includes(a)) {
				a = ''+0;
			}
			if(['undefined', null].includes(b)) {
				b = ''+0;
			}
			if(!['undefined', null].includes(a) && !['undefined', null].includes(b)) {
				if(x.direction == 1) {
					if(this.#isDate(a)) {
						return new Date(a).getTime() - new Date(b).getTime();
					}
					if(typeof a === 'string') {
						if(isNaN(a)) {
							return a.localeCompare(b);
						} else {
							return Number(a) - Number(b);
						}
					}
					if(typeof a === 'number') {
						return a - b;
					}
				}
				if(x.direction == -1) {
					if(this.#isDate(a)) {
						return new Date(b).getTime() - new Date(a).getTime();
					}
					if(typeof a === 'string') {
						if(isNaN(a)) {
							return b.localeCompare(a);
						} else {
							return Number(b) - Number(a);
						}
					}
					if(typeof a === 'number') {
						return b - a;
					}
				} 
			}
			return 0;
		});
    }
  }
  #isEmpty(value) {
    switch (true) {
      case (value == null || value == 'undefined' || value == false || value == ''):
        return true;
      case (Array.isArray(value)):
        return value.length == 0;
      case (typeof value == 'object'):
        return (Object.keys(value).length === 0 && value.constructor === Object);
      case (typeof value == 'string'):
        return value.length == 0;
      case (typeof value == 'number' && !isNaN(value)):
        return value === 0;
      default:
        return false;
    }
  }
  async #exportTable(word) {
	  const workbook = await XLSX.utils.book_new();
	  const worksheet = await XLSX.utils.json_to_sheet(this.#filtered);
	  await XLSX.utils.book_append_sheet(workbook, worksheet, "sheet1");
	  switch(word) {
		  case 'Excel':
			await XLSX.writeFileXLSX(workbook, "data.xlsx");
		  break
		  case 'TSV':
			await XLSX.writeFile(workbook, "data.csv", { bookType: "csv" });
		  break
		  case 'CSV':
			await XLSX.writeFile(workbook, "data.csv", { bookType: "csv" });
		  break
	  }
	  // this.#exportData = '"' + Object.values(this.#headerTitles).join('","') + '"' + '\r\n' + this.#filtered.map(row => '"' + Object.values(row).join('","') + '"').join('\r\n');
	  // console.log(this.#tableData);
	  // return false;
	  // await this.#exportAsFile();
  }
  // async #exportAsFile() {
	  // let fileName = prompt('What will be the name of the downloaded file?').replace(/(<([^>]+)>)/gi, '');
	  // const blob = new Blob([ this.#exportData ], { type: 'text/csv' });
	  // if (window.navigator.msSaveOrOpenBlob) {
		// return window.navigator.msSaveOrOpenBlob(blob, fileName);
	  // }
	  // const link = document.createElement('a');
	  // link.download = fileName + '.csv';
	  // link.href = window.URL.createObjectURL(blob);
	  // link.classList.add('hidden');
	  // link.style.position = 'fixed';
	  // document.body.appendChild(link);
	  // link.click();
	  // await this.#remove(link, 8);
  // }
  async #remove(link, time) {
	  const timeOut = await setTimeout(() => {
		window.URL.revokeObjectURL(link.href);
		clearTimeout(timeOut);
	  }, time*1000);
	  await link.remove();
  }
  connectedCallback() {
    //console.log('component connected.');	
	this.#init();
	window.performance.mark('Module connected');
	//console.log(window.performance.measure("Duration to connect", 'Module initialized', 'Module connected'));
  }

  disconnectedCallback() {
    //console.log('Disconnected.');
  }

  adoptedCallback() {
    //console.log('Adopted.');
  }

  attributeChangedCallback(name, oldValue, newValue) {
	let tableLabel = this.getAttribute('table-label');
	let noResults = this.getAttribute('no-results');
	let fromTo = this.getAttribute('from-to');
	let goTo = this.getAttribute('go-to');
	let rppMessage = this.getAttribute('rpp-message');
	let perPage = this.getAttribute('per-page');
	let noDataMessage = this.getAttribute('nodata-message');
	let tableData = this.getAttribute('table-data');
	let extractDataIndex = this.getAttribute('data-index');	
	let exportButtonLabel = this.getAttribute('export-button');
    if (!this.#isEmpty(tableLabel)) {
      this.#tableLabel = tableLabel.replace(/(<([^>]+)>)/gi, '');
    }
    if (!this.#isEmpty(noResults)) {
      this.#noResults = noResults.replace(/(<([^>]+)>)/gi, '');
    }
    if (!this.#isEmpty(fromTo)) {
      this.#fromTo = fromTo.replace(/(<([^>]+)>)/gi, '');
    }
    if (!this.#isEmpty(goTo)) {
      this.#goTo = goTo.replace(/(<([^>]+)>)/gi, '');
    }
    if (!this.#isEmpty(rppMessage)) {
      this.#rppMessage = rppMessage.replace(/(<([^>]+)>)/gi, '');
    }
    if (!this.#isEmpty(perPage)) {
      this.#perPage = parseInt(perPage);
    }
    if (!this.#isEmpty(noDataMessage)) {
      this.#noDataMessage = noDataMessage.replace(/(<([^>]+)>)/gi, '');
    }
    if (!this.#isEmpty(tableData)) {
      this.#tableData = JSON.parse(tableData);
	}
    if (!this.#isEmpty(extractDataIndex)) {
      this.#extractDataIndex = extractDataIndex.replace(/(<([^>]+)>)/gi, '');
    }
	if(!this.#isEmpty(exportButtonLabel)) {
		this.#exportButtonLabel =  exportButtonLabel.replace(/(<([^>]+)>)/gi, '');
	}
	this.#init();
    window.performance.mark('Module changed');
	//console.log(window.performance.measure("Duration to change", 'Module initialized', 'Module changed'));
  }
}

if (!window.customElements.get('pd-table')) {
  window.pdTable = pdTable;
  window.customElements.define('pd-table', pdTable);
}
