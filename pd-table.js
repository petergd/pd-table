export class pdTable extends HTMLElement {
  #tableData;
  #headerTitles;
  #css;
  #currPage;
  #perPage;
  #filtered;
  #extractDataIndex;
  #totPages;
  #tableLabel;
  #noResults;
  #fromTo;
  #goTo;
  #rppMessage;
  #noDataMessage;
  #exportButtonLabel;
  #exportData;
  
  static get observedAttributes() {
    return ['export-button', 'table-label', 'data-index', 'no-results', 'from-to', 'go-to', 'rpp-message', 'per-page', 'table-data', 'nodata-message'];
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
	let noDataMessage = this.getAttribute('nodata-message');
	let tableData = this.getAttribute('table-data');
	let extractDataIndex = this.getAttribute('data-index');
	let exportButtonLabel = this.getAttribute('export-button');
	this.#tableLabel = !this.#isEmpty(tableLabel) ? tableLabel.replace(/(<([^>]+)>)/gi, '') : 'Example Table';
	this.#noResults = !this.#isEmpty(noResults) ? noResults.replace(/(<([^>]+)>)/gi, '') : 'No records were found for the provided keywords';
	this.#fromTo = !this.#isEmpty(fromTo) ? fromTo.replace(/(<([^>]+)>)/gi, '') : 'rows {FROM} to {TO} of {SIZE}';
	this.#goTo = !this.#isEmpty(goTo) ? goTo.replace(/(<([^>]+)>)/gi, '') : 'go to page {NUM}';
	this.#rppMessage = !this.#isEmpty(rppMessage) ? rppMessage.replace(/(<([^>]+)>)/gi, '') : 'rows per page';
	this.#perPage = !this.#isEmpty(perPage) ? parseInt(perPage) : 5;
	this.#noDataMessage = !this.#isEmpty(noDataMessage) ? noDataMessage.replace(/(<([^>]+)>)/gi, '') : 'Data is invalid or empty! Please try again!';
	this.#tableData = !this.#isEmpty(tableData) ? JSON.parse(tableData) : [];
	this.#extractDataIndex = !this.#isEmpty(extractDataIndex) ? extractDataIndex.replace(/(<([^>]+)>)/gi, '') : '';
    this.#exportButtonLabel = !this.#isEmpty(exportButtonLabel) ? exportButtonLabel.replace(/(<([^>]+)>)/gi, '') : 'Export';
	window.performance.mark('Module initialized');
  }
  
  #setStyle() {
    let Style = document.createElement('style');
    this.#css = `:host {
		--main-color: hsl(190, 41%, 33%);
		--odd: hsl(255, 100%, 97%);
		--even: hsl(255, 100%, 100%);
		--hover: hsl(128, 25%, 85%);
	}
	.asc:after {
		content: "▲";
	}
	.desc:after {
		content: "▼";
	}
	.active {
		background-color: var(--hover);
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
		color: var(--main-color);
		height: 3vmax;
		width: 3vmax;
		text-align: center;
		border-radius: 0.25em;
		border: solid 0.01em var(--main-color);
		cursor: pointer;
		padding: 0.5em;
		font-size: min(1vmin, 1rem);
	}
	.pagination > button:first-child {
		margin-left: 0;
	}
	.searchable > button.btn {
		position: fixed;
		right: 0;
		top: 0;
		background-color: var(--main-color);
		height: 3vmax;
		margin: 1vh 1vw;
		text-align: center;
		border-radius: 0.25em;
		border: solid 0.01em var(--main-color);
		cursor: pointer;
		padding: 0.5em;
		font-size: min(1.5vmin, 1.5rem);
		color: var(--even);
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
		position: relative;
		width: auto;
		font-family: inherit;
		border-radius: 0.25em;
		border: solid 0.01em var(--odd);
		padding: 0.5em 1em;
		margin-bottom: 1vh;
		outline: none;
		transition: border 0.9s;
		cursor: text;
	}
	.select {
		font-size: 1vmax;
		position: relative;
		width: 8%;
		height: 3vmax;
		font-family: inherit;
		border-radius: 0.25em;
		border: solid 0.01em var(--odd);
		padding: 0.5em 1em;
		transition: border 0.9s;
		cursor: pointer;
	}
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
		top:0;
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
	@media screen and (max-width: 36.25rem) {
		.table {
			display: block;
			width: 100vw;
		}
	}
	@media screen and (max-width: 36.25rem) {
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
	}`;
    Style.append(this.#css);
    this.sRoot.prepend(Style);
  }
  
  #createRow(rowData, isHeader = false) {
    let row = document.createElement('div');
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
	  let headers = this.sRoot.querySelectorAll('.row.header .cell');
	  let loader = this.sRoot.querySelector('.loader');
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
    let cell = document.createElement('div');
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
    let search = document.createElement('div');
    search.classList.add('searchable');
	let btn = document.createElement('button');
	btn.classList.add('btn');
	btn.type = 'button';
	btn.textContent = this.#exportButtonLabel;
	btn.addEventListener('click',async  (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.#exportTable();
    });
    let input = document.createElement('input');
    input.type = 'search';
    input.placeholder = 'search';
    input.setAttribute('aria-controls', tableId);
    input.setAttribute('role', 'searchbox');
    input.classList.add('search', 'control');
    input.addEventListener('keyup',async  (e) => {
      e.preventDefault();
      e.stopPropagation();
	  let loader = this.sRoot.querySelector('.loader');
	  if( loader.classList.contains('hidden')) {
		  loader.classList.remove('hidden');	
	  }
      await this.#filter(tableId, e.target.value);
    });
	search.appendChild(btn);
    search.appendChild(input);
    return search;
  }
  async #filter(tableId, txt) {
    let table = this.sRoot.querySelector('.table');
    this.sRoot.querySelectorAll('.row:not(.header)').forEach(x => x.remove());
    this.#filtered = await this.#tableData.filter((x) => {
      let found = false;
	  let rowArray = Array.from(Object.values(x));
      txt = txt.replace(/[#--]|[[-^]|[?|{}]/g, '').replace(' ', '*.*');
      let regexp = new RegExp(`(${txt})`, 'gi');
	  let rowString = rowArray.join(' ');
	  let rowStringRev = rowArray.reverse().join(' ');
	  if(!this.#isEmpty(rowString.replace(/[#-.]|[[-^]|[?|{}]/g, '').match(regexp)) ||
		!this.#isEmpty(rowStringRev.replace(/[#-.]|[[-^]|[?|{}]/g, '').match(regexp))) {
		  return x;
	  }
    });
    this.#totPages = Math.ceil(this.#filtered.length / this.#perPage);
    await this.#changePage(tableId, 1);
	window.performance.mark('Module state changed');
	//console.log(window.performance.measure("Duration to change", 'Module state changed', 'Module state changed'));
  }
  #createTable(tableId) {
    let table = document.createElement('div');
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
	return camel.split(/(?<!^)([A-Z][a-z0-9]+|(?<=[a-z0-9])[A-Z]+)/).filter(e => e).join(' ');
  }
  #createPerPageSelector(tableId) {
    let select = document.createElement('select');
    select.classList.add('select');
    [5, 10, 20, 50, 100].forEach((x) => {
      let option = document.createElement('option');
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
    let rsdisplay = document.createElement('div');
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
    let footer = document.createElement('div');
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
	let fragment = new DocumentFragment();
    let wrapper = document.createElement('div');
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
    let self = this;	
    self.#currPage = 1;
    self.#totPages = Math.ceil(self.#tableData.length / self.#perPage);
    self.sRoot.innerHTML = '';
    self.#filtered = [...self.#tableData];
    self.#createWrapper();
    self.#setStyle();
	window.performance.mark('Init time');
	//console.log(window.performance.measure("Duration to change", 'Module initialized', 'Init time'));
  }
  #createButton(tableId, ariaLabel, btnHTML, classList) {
    let btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-controls', tableId);
    btn.setAttribute('aria-label', ariaLabel);
    btn.innerHTML = btnHTML;
    btn.classList.add(...classList);
    return btn;
  }
  async #applySorting() {
	let activeHeaders = this.sRoot.querySelectorAll('.row.header .cell.active');
	let args = [];
	if(!this.#isEmpty(activeHeaders)) {
		activeHeaders.forEach((x) => {
			let obj = {};
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
    let table = this.sRoot.querySelector('.table');
	let loader = this.sRoot.querySelector('.loader');
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
      let toFirst = this.#createButton(tableId, 'start', '◂◂', ['btn-char']);
      toFirst.addEventListener('click',async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this.#changePage(tableId, 1)
      });
      list.appendChild(toFirst);
      let toPrev = this.#createButton(tableId, 'previous', '◂', ['btn-char']);
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
      let toNext = this.#createButton(tableId, 'next', '▸', ['btn-char']);
      toNext.addEventListener('click',async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this.#changePage(tableId, this.#currPage + 1);
      });
      list.appendChild(toNext);
      let toLast = this.#createButton(tableId, 'last', '▸▸', ['btn-char']);
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
  async #exportTable() {
	  this.#exportData = '"' + Object.values(this.#headerTitles).join('","') + '"' + '\r\n' + this.#filtered.map(row => '"' + Object.values(row).join('","') + '"').join('\r\n');
	  await this.#exportAsFile();
  }
  async #exportAsFile() {
	  let fileName = prompt('What will be the name of the downloaded file?').replace(/(<([^>]+)>)/gi, '');
	  let blob = new Blob([ this.#exportData ], { type: 'text/csv' });
	  if (window.navigator.msSaveOrOpenBlob) {
		return window.navigator.msSaveOrOpenBlob(blob, fileName);
	  }
	  let link = document.createElement('a');
	  link.download = fileName + '.csv';
	  link.href = window.URL.createObjectURL(blob);
	  link.classList.add('hidden');
	  link.style.position = 'fixed';
	  document.body.appendChild(link);
	  link.click();
	  await this.#remove(link, 8);
  }
  async #remove(link, time) {
	  let timeOut = await setTimeout(() => {
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
