(function(){
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var preloader = document.getElementById('preloader');
  if(preloader){
    var loadingProgress = 8;
    var progressTimer = setInterval(function(){
      loadingProgress = Math.min(loadingProgress + 3, 88);
      preloader.style.setProperty('--load-progress', loadingProgress + '%');
    }, 180);
    var hidePreloader = function(){
      clearInterval(progressTimer);
      preloader.style.setProperty('--load-progress', '100%');
      if(reduceMotion){
        preloader.classList.add('is-hidden');
      } else {
        setTimeout(function(){ preloader.classList.add('is-hidden'); }, 250);
      }
    };
    preloader.addEventListener('click', hidePreloader);
    preloader.addEventListener('keydown', function(event){
      if(event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        hidePreloader();
      }
    });
    window.addEventListener('load', function(){
      hidePreloader();
    });
  }

  /* nav scroll state */
  var nav = document.getElementById('siteNav');
  var toTop = document.getElementById('toTop');
  if(nav){
    window.addEventListener('scroll', function(){
      var y = window.scrollY;
      nav.classList.toggle('scrolled', y > 40);
      if(toTop) toTop.classList.toggle('show', y > 600);
    });
  }

  /* mobile menu */
  var burger = document.getElementById('burger');
  var primaryNav = document.getElementById('primaryNav');
  if(burger && primaryNav){
    burger.addEventListener('click', function(){
      var open = primaryNav.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
    });
    primaryNav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        primaryNav.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', false);
      });
    });
  }

  /* active nav link = current page (multi-page site, no scrollspy needed) */
  (function(){
    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(function(link){
      var href = link.getAttribute('href');
      if(href === path || (path === '' && href === 'index.html')){
        link.classList.add('active');
      }
    });
  })();

  /* back to top */
  if(toTop){
    toTop.addEventListener('click', function(){
      window.scrollTo({top:0, behavior: reduceMotion ? 'auto' : 'smooth'});
    });
  }

  /* scroll reveal */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold:0.15});
    revealEls.forEach(function(el){ revealObserver.observe(el); });
  }
  if(reduceMotion){ revealEls.forEach(function(el){ el.classList.add('in'); }); }

  /* vehicle category filters */
  var vehicleFilters = document.querySelectorAll('.vehicle-filter');
  var vehicleCards = document.querySelectorAll('.vehicle-card');
  var fleetEmpty = document.querySelector('.fleet-empty');
  if(vehicleFilters.length && vehicleCards.length){
    vehicleFilters.forEach(function(filter){
      filter.addEventListener('click', function(){
        var category = filter.getAttribute('data-filter');
        vehicleFilters.forEach(function(item){
          var selected = item === filter;
          item.classList.toggle('active', selected);
          item.setAttribute('aria-pressed', selected);
        });
        vehicleCards.forEach(function(card){
          var show = category === 'all' || card.getAttribute('data-category') === category;
          card.classList.toggle('is-hidden', !show);
        });
        if(fleetEmpty){
          var hasMatches = Array.prototype.some.call(vehicleCards, function(card){
            return !card.classList.contains('is-hidden');
          });
          fleetEmpty.hidden = hasMatches;
        }
      });
    });
  }

  /* animated counters */
  function formatNum(n){ return n.toLocaleString('en-IN'); }
  function counterText(el, value){
    var suffix = el.getAttribute('data-suffix') || (value >= 100 ? '+' : '');
    return formatNum(value) + suffix;
  }
  var counters = document.querySelectorAll('.num');
  if(counters.length && 'IntersectionObserver' in window){
    var countObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count'), 10);
        countObserver.unobserve(el);
        if(reduceMotion){ el.textContent = counterText(el, target); return; }
        var start = null, duration = 1600;
        function step(ts){
          if(!start) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          var val = Math.floor(eased * target);
          el.textContent = counterText(el, val);
          if(progress < 1) requestAnimationFrame(step);
          else el.textContent = counterText(el, target);
        }
        requestAnimationFrame(step);
      });
    }, {threshold:0.4});
    counters.forEach(function(c){ countObserver.observe(c); });
  }

  /* gauge bars */
  var gaugeRow = document.getElementById('gaugeRow');
  if(gaugeRow && 'IntersectionObserver' in window){
    var gauges = document.querySelectorAll('.gauge');
    var gaugeObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          gauges.forEach(function(g){ g.style.transform = 'scaleY(' + (parseFloat(g.getAttribute('data-h'))/100) + ')'; });
          gaugeObserver.disconnect();
        }
      });
    }, {threshold:0.4});
    gaugeObserver.observe(gaugeRow);
  }

  /* form validation (static demo submit) */
  var form = document.getElementById('quoteForm');
  if(form){
    var msg = document.getElementById('formMsg');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var valid = true;
      var checks = {
        name: function(v){ return v.trim().length > 1; },
        company: function(v){ return v.trim().length > 1; },
        contact: function(v){ return v.trim().length >= 7; },
        message: function(v){ return v.trim().length > 5; }
      };
      Object.keys(checks).forEach(function(key){
        var fieldEl = form.querySelector('[data-field="'+key+'"]');
        var input = fieldEl.querySelector('input,select,textarea');
        var ok = checks[key](input.value);
        fieldEl.classList.toggle('invalid', !ok);
        if(!ok) valid = false;
      });
      if(!valid){ msg.classList.remove('show'); return; }
      var savedData;
      try{ savedData = JSON.parse(localStorage.getItem('providenceAdminData') || '{}'); }catch(error){ savedData = {}; }
      savedData.enquiries = Array.isArray(savedData.enquiries) ? savedData.enquiries : [];
      savedData.enquiries.unshift({
        id:'enq-' + Date.now(),
        name:form.querySelector('[name="company"]').value.trim(),
        contact:form.querySelector('[name="name"]').value.trim() + ' / ' + form.querySelector('[name="contact"]').value.trim(),
        phone:form.querySelector('[name="contact"]').value.trim(),
        service:form.querySelector('[name="role"]').value.trim() || 'General enquiry',
        location:'Website enquiry',
        details:form.querySelector('[name="message"]').value.trim() + ' | ' + form.querySelector('[name="headcount"]').value.trim(),
        received:'Just now',
        status:'New'
      });
      localStorage.setItem('providenceAdminDataVersion', '2');
      localStorage.setItem('providenceAdminData', JSON.stringify(savedData));
      msg.classList.add('show');
      form.reset();
      setTimeout(function(){ msg.classList.remove('show'); }, 5000);
    });
  }

  var vendorForm = document.getElementById('vendorForm');
  if(vendorForm){
    var vendorMsg = document.getElementById('vendorFormMsg');
    vendorForm.addEventListener('submit', function(e){
      e.preventDefault();
      var valid = true;
      var checks = {
        vendorName: function(v){ return v.trim().length > 1; },
        company: function(v){ return v.trim().length > 1; },
        email: function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
        phone: function(v){ return v.trim().length >= 7; },
        fleet: function(v){ return v.trim().length > 1; },
        location: function(v){ return v.trim().length > 1; },
        message: function(v){ return v.trim().length > 5; }
      };
      Object.keys(checks).forEach(function(key){
        var fieldEl = vendorForm.querySelector('[data-field="'+key+'"]');
        var input = fieldEl.querySelector('input,textarea');
        var ok = checks[key](input.value);
        fieldEl.classList.toggle('invalid', !ok);
        if(!ok) valid = false;
      });
      if(!valid){ vendorMsg.classList.remove('show'); return; }
      var savedData;
      try{ savedData = JSON.parse(localStorage.getItem('providenceAdminData') || '{}'); }catch(error){ savedData = {}; }
      savedData.vendors = Array.isArray(savedData.vendors) ? savedData.vendors : [];
      savedData.vendors.unshift({
        id:'ven-' + Date.now(),
        name:vendorForm.querySelector('[name="company"]').value.trim(),
        contact:vendorForm.querySelector('[name="vendorName"]').value.trim() + ' / ' + vendorForm.querySelector('[name="email"]').value.trim(),
        phone:vendorForm.querySelector('[name="phone"]').value.trim(),
        service:vendorForm.querySelector('[name="fleet"]').value.trim(),
        location:vendorForm.querySelector('[name="location"]').value.trim(),
        details:vendorForm.querySelector('[name="message"]').value.trim(),
        received:'Just now',
        status:'New'
      });
      localStorage.setItem('providenceAdminDataVersion', '2');
      localStorage.setItem('providenceAdminData', JSON.stringify(savedData));
      vendorMsg.classList.add('show');
      vendorForm.reset();
      setTimeout(function(){ vendorMsg.classList.remove('show'); }, 5000);
    });
  }

  /* admin enquiry filters and search */
  document.querySelectorAll('[data-filter-group]').forEach(function(group){
    var groupName = group.getAttribute('data-filter-group');
    var table = document.querySelector('[data-admin-table="' + groupName + '"]');
    var search = document.querySelector('[data-table-search="' + groupName + '"]');
    if(!table) return;
    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
    var empty = table.parentElement.querySelector('.admin-empty');
    var activeFilter = 'all';
    function updateRows(){
      var term = search ? search.value.trim().toLowerCase() : '';
      var visible = 0;
      rows.forEach(function(row){
        var matchesFilter = activeFilter === 'all' || row.getAttribute('data-status') === activeFilter;
        var matchesSearch = !term || row.textContent.toLowerCase().indexOf(term) !== -1;
        var show = matchesFilter && matchesSearch;
        row.style.display = show ? '' : 'none';
        if(show) visible += 1;
      });
      if(empty) empty.style.display = visible ? 'none' : 'block';
    }
    group.querySelectorAll('.admin-filter').forEach(function(button){
      button.addEventListener('click', function(){
        activeFilter = button.getAttribute('data-filter');
        group.querySelectorAll('.admin-filter').forEach(function(item){ item.classList.toggle('active', item === button); });
        updateRows();
      });
    });
    if(search) search.addEventListener('input', updateRows);
  });
})();
