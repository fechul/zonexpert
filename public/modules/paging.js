var PAGING = {
	init: function(pagingData) {
		var target = pagingData.target;
		var totalPage = pagingData.totalPage;
		var pageNo = pagingData.pageNo;

		var btnNum = 5;

		var idx = Math.floor(pageNo/btnNum);
		if(pageNo % btnNum == 0) {
			idx--;
		}
		var start = (idx*btnNum) + 1;
		var end = start + (btnNum-1);
		var targetIdx = pageNo%btnNum;

		var prevDone = false;
		var nextDone = false;

		if(pageNo == 1) {
			prevDone = true;
		}

		if(pageNo == totalPage) {
			nextDone = true;
		}

		var pagingHtml = ''
		pagingHtml += '<div id="paging_numbers">';

		if(prevDone) {
			pagingHtml += '<button class="btn btn-default" id="paging_firstPage" disabled><<</button>';
			pagingHtml += '<button class="btn btn-default" id="paging_prevPage" disabled><</button>';
		} else {
			pagingHtml += '<button class="btn btn-default" id="paging_firstPage"><<</button>';
			pagingHtml += '<button class="btn btn-default" id="paging_prevPage"><</button>';
		}
		
		var btnClass = 1;
		for(var i = start; i <= end; i++) {
			var pageText = parseInt((pageNo-targetIdx)+btnClass, 10);

			if(pageText > totalPage) {
				break;
			} else {
				if(pageText == pageNo) {
					pagingHtml += '<button class="btn btn-primary paging_number page_' + btnClass + '" value="' + pageText + '">' + pageText + '</button>';
				} else {
					pagingHtml += '<button class="btn btn-default paging_number page_' + btnClass + '" value="' + pageText + '">' + pageText + '</button>';
				}
			}

			btnClass++;
		}

		if(nextDone) {
			pagingHtml += '<button class="btn btn-default" id="paging_nextPage" disabled>></button>';
			pagingHtml += '<button class="btn btn-default" id="paging_lastPage" disabled>>></button>';
		} else {
			pagingHtml += '<button class="btn btn-default" id="paging_nextPage">></button>';
			pagingHtml += '<button class="btn btn-default" id="paging_lastPage">>></button>';
		}

		pagingHtml += '</div>';

		if($('#paging_numbers').length) {
			$('#paging_numbers').remove();
		}
		target.after(pagingHtml);
	}
};