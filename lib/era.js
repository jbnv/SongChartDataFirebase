module.exports =  function(pDefaultSlug,options) {

	if (!options) options = {};

	var _digits = [0,1,2,3,4,5,6,7,8,9];
	var _monthSlugs = ["01","02","03","04","05","06","07","08","09","10","11","12"];
	var _monthNames = [
		"January","February","March","April","May","June",
		"July","August","September","October","November","December"
	];

	function _monthSlug(year,month) {
		return ""+year+"-"+(month < 10 ? "0" : "")+month;
	}

	function _decadeTitle(slug) {
		if (/^\d\d\d0s$/.test(slug)) { return slug; }
		if (/^\d\d\d0$/.test(slug)) { return ""+slug+"s"; }
		return null;
	}

	function _yearTitle(slug) {
		if (!slug) return null;
		return ""+slug;
	}

	function _monthTitle(slug,month) {
		if (!slug) return null;
		if (/^\d\d\d\d-\d\d$/.test(slug) && !month) {
			numbers = slug.match(/\d+/g);
      year = parseInt(numbers[0]);
			month = parseInt(numbers[1]);
		} else {
			year = slug;
		}
		return _monthNames[month-1]+" "+year;
	}

	function _entity(slug,titleFn) {
		return { slug: slug, title: titleFn(slug) };
	}

	this.fromSlug = function(slug) {

		this.slug = slug;
		this.title = slug;

		if (/^\d\d\d0s$/.test(slug)) {

			this.type = "decade";
			decade = parseInt(slug.match(/\d\d\d0/)[0]);
			this.decade = decade;
			this.years = _digits.map(function(d) {
				return decade+d;
			});
			this.previous = _entity(""+(decade-10)+"s",_decadeTitle);
			this.next = _entity(""+(decade+10)+"s",_decadeTitle);

		} else if (/^\d\d\d\d$/.test(slug)) {

			this.type = "year";
      year = parseInt(slug);
      this.decade = year - (year%10);
			this.year = year;
			this.months = _monthSlugs.map(function(s) {
				return ""+year+"-"+s;
			});
			this.previous = _entity(year-1,_yearTitle);
			this.next = _entity(year+1,_yearTitle);

		} else if (/^\d\d\d\d-\d\d$/.test(slug)) {

			this.type = "month";
			numbers = slug.match(/\d+/g);
      year = parseInt(numbers[0]);
			month = parseInt(numbers[1]);
			this.title = _monthTitle(year,month);
      this.decade = year - (year%10);
			this.year = year;
			this.month = month;
			previous = month == 1 ? _monthSlug(year-1,12) : _monthSlug(year,month-1);
			next = month == 12 ? _monthSlug(year+1,1) : _monthSlug(year,month+1);
			this.previous = _entity(previous,_monthTitle);
			this.next = _entity(next,_monthTitle);

		}
	}

	if (pDefaultSlug) {
		this.fromSlug(pDefaultSlug);
	}

	// Return a shallow clone with a limited set of properties.
	this.clone = function() {
		if (!this.type) return {};
		return {
			slug: this.slug,
			title:this.title,
			type:this.type,
			decade:this.decade || null,
			year:this.year || null,
			month:this.month || null
		};
	};

}
