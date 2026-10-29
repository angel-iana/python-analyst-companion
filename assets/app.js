(function () {
  'use strict';

  var CONTENT = 'content/';
  var FLASH_KEY = 'pac.flashcards.v1';
  var PATH_KEY = 'pac.path.v1';
  var LEVELS = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };
  var entryIndex = {}; // entry id -> {sectionId, title}

  var searchBoxes = []; // {entryEl, hay, cat, sectionId}
  var sectionUi = {};   // id -> {listEl, countEl, emptyEl, chipsEl, cat, total}
  var query = '';

  /* ---------- helpers ---------- */

  function el(tag, props, kids) {
    var n = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        if (k === 'text') n.textContent = props[k];
        else if (k === 'class') n.className = props[k];
        else n.setAttribute(k, props[k]);
      });
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  // Text with `inline code` between backticks. Uses textContent only.
  function inline(parent, str) {
    String(str).split('`').forEach(function (part, i) {
      if (!part) return;
      if (i % 2 === 1) parent.appendChild(el('code', { text: part }));
      else parent.appendChild(document.createTextNode(part));
    });
  }

  function paragraphs(parent, body) {
    String(body).split(/\n\s*\n/).forEach(function (p) {
      var node = el('p');
      inline(node, p.trim());
      parent.appendChild(node);
    });
  }

  function store(op, key, value) {
    try {
      if (op === 'get') return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { /* storage unavailable: the page works without it */ }
    return null;
  }

  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      return r.ok ? r.json() : null;
    }).catch(function () { return null; });
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- sections ---------- */

  function buildAbout(sec, meta) {
    var s = el('section', { id: sec.id }, [el('h2', { text: sec.title })]);
    s.appendChild(el('p', { text: 'This page was written with Claude (Anthropic) and is published by Angel I. All explanations are written for this page. Every code example is run on the versions below, and the output shown is the real output. Anyone can propose a correction or a new entry; see the repository.' }));
    if (meta && meta.libraries) {
      var table = el('table', { class: 'versions' });
      var rows = [['Python', meta.python]];
      Object.keys(meta.libraries).forEach(function (k) { rows.push([k, meta.libraries[k]]); });
      rows.forEach(function (r) {
        table.appendChild(el('tr', null, [el('th', { scope: 'row', text: r[0] }), el('td', { text: r[1] })]));
      });
      s.appendChild(el('p', { class: 'label', text: 'Versions used for the examples' }));
      s.appendChild(table);
      if (meta.tested_on) s.appendChild(el('p', { class: 'meta', text: 'Last run: ' + meta.tested_on }));
    } else {
      s.appendChild(el('p', { class: 'todo', text: 'Versions used for the examples: to be confirmed.' }));
    }
    return s;
  }

  function buildLicense(sec) {
    var s = el('section', { id: sec.id }, [el('h2', { text: sec.title })]);
    var p = el('p');
    p.appendChild(document.createTextNode('Code and text are released under the MIT License. See '));
    p.appendChild(el('code', { text: 'LICENSE' }));
    p.appendChild(document.createTextNode(' in the repository. Contributions are welcome: see '));
    p.appendChild(el('code', { text: 'CONTRIBUTING.md' }));
    p.appendChild(document.createTextNode('.'));
    s.appendChild(p);
    return s;
  }

  function buildEntry(e, sectionId) {
    var summary = el('summary', null, [document.createTextNode(e.title)]);
    if (e.level) summary.appendChild(el('span', { class: 'tag', text: LEVELS[e.level] || ('Level ' + e.level) }));
    else if (e.category) summary.appendChild(el('span', { class: 'tag', text: e.category }));
    var d = el('details', { class: 'entry', id: sectionId + '-' + e.id }, [summary]);
    var body = el('div', { class: 'entry-body' });
    if (e.body) paragraphs(body, e.body);

    if (e.code) {
      body.appendChild(el('div', { class: 'label', text: 'Code' }));
      var pre = el('pre');
      pre.appendChild(el('code', { text: e.code }));
      var btn = el('button', { type: 'button', class: 'btn copy', text: 'Copy' });
      btn.addEventListener('click', function () {
        var done = function (ok) {
          btn.textContent = ok ? 'Copied' : 'Copy failed';
          setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
        };
        try {
          navigator.clipboard.writeText(e.code).then(function () { done(true); }, function () { done(false); });
        } catch (err) { done(false); }
      });
      body.appendChild(el('div', { class: 'codewrap' }, [pre, btn]));
    }
    if (e.output) {
      body.appendChild(el('div', { class: 'label', text: 'Output' }));
      var out = el('pre');
      out.appendChild(el('code', { text: e.output.replace(/\s+$/, '') }));
      body.appendChild(out);
    }

    var bits = [];
    if (e.tested_with) {
      bits.push('Tested with ' + Object.keys(e.tested_with).map(function (k) { return k + ' ' + e.tested_with[k]; }).join(', '));
    }
    if (e.added) bits.push('Added ' + e.added);
    if (bits.length) body.appendChild(el('p', { class: 'meta', text: bits.join(' · ') }));

    if (e.sources && e.sources.length) {
      var src = el('p', { class: 'meta' });
      src.appendChild(document.createTextNode('Source: '));
      e.sources.forEach(function (s, i) {
        if (i) src.appendChild(document.createTextNode(', '));
        src.appendChild(el('a', { href: s.url, text: s.title }));
      });
      body.appendChild(src);
    }
    d.appendChild(body);
    return d;
  }

  function toolOf(e) { return e.tool || e.category || ''; }

  function buildEntries(sec, data) {
    var s = el('section', { id: sec.id }, [el('h2', { text: sec.title })]);
    var entries = ((data && data.entries) || []).slice();
    if (sec.intro) s.appendChild(el('p', { text: sec.intro }));
    if (!entries.length) {
      s.appendChild(el('p', { class: 'todo', text: 'Content to be added.' }));
      return s;
    }
    entries.sort(function (a, b) { return (a.order || 1e6) - (b.order || 1e6); });

    var ui = { tool: '', level: 0, total: entries.length, blocks: [] };
    var tools = [], levels = [];
    entries.forEach(function (e) {
      var t = toolOf(e);
      if (t && tools.indexOf(t) < 0) tools.push(t);
      if (e.level && levels.indexOf(e.level) < 0) levels.push(e.level);
    });
    levels.sort();

    function chipRow(label, values, fmt, key) {
      var row = el('div', { class: 'chips', role: 'group', 'aria-label': 'Filter ' + sec.title + ' by ' + label });
      function chip(text, value) {
        var b = el('button', { type: 'button', class: 'chip', text: text, 'aria-pressed': ui[key] === value ? 'true' : 'false' });
        b.addEventListener('click', function () {
          ui[key] = value;
          Array.prototype.forEach.call(row.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
          applyFilters();
        });
        return b;
      }
      row.appendChild(chip('All', key === 'level' ? 0 : ''));
      values.forEach(function (v) { row.appendChild(chip(fmt(v), v)); });
      return row;
    }
    if (tools.length > 1) s.appendChild(chipRow('tool', tools, function (v) { return v; }, 'tool'));
    if (levels.length > 1) s.appendChild(chipRow('level', levels, function (v) { return LEVELS[v] || ('Level ' + v); }, 'level'));

    ui.countEl = el('p', { class: 'count' });
    s.appendChild(ui.countEl);
    ui.listEl = el('div');

    var toolBlocks = {}, groupBlocks = {};
    entries.forEach(function (e) {
      var node = buildEntry(e, sec.id);
      var host = ui.listEl;
      if (e.tool) {
        var tb = toolBlocks[e.tool];
        if (!tb) {
          tb = el('div', { class: 'tool-block' }, [el('h3', { text: e.tool })]);
          toolBlocks[e.tool] = tb;
          ui.listEl.appendChild(tb);
          ui.blocks.push(tb);
        }
        host = tb;
        if (e.group) {
          var gk = e.tool + '|' + e.group;
          var gb = groupBlocks[gk];
          if (!gb) {
            gb = el('div', { class: 'group-block' }, [el('h4', { text: e.group })]);
            groupBlocks[gk] = gb;
            tb.appendChild(gb);
            ui.blocks.push(gb);
          }
          host = gb;
        }
      }
      host.appendChild(node);
      var hay = [e.title, e.body, e.code, e.category, e.tool, e.group, e.output].join(' ').toLowerCase();
      searchBoxes.push({ el: node, hay: hay, cat: toolOf(e), level: e.level || 0, sectionId: sec.id });
      entryIndex[e.id] = { sectionId: sec.id, title: e.title };
    });
    s.appendChild(ui.listEl);
    ui.emptyEl = el('p', { class: 'empty', text: 'No entries match.', hidden: 'hidden' });
    s.appendChild(ui.emptyEl);
    sectionUi[sec.id] = ui;
    return s;
  }

  function applyFilters() {
    var q = query.trim().toLowerCase();
    var totalShown = 0, searching = q.length > 0;
    Object.keys(sectionUi).forEach(function (id) {
      var ui = sectionUi[id], shown = 0;
      searchBoxes.forEach(function (b) {
        if (b.sectionId !== id) return;
        var ok = (!ui.tool || b.cat === ui.tool) && (!ui.level || b.level === ui.level) && (!q || b.hay.indexOf(q) >= 0);
        if (ok) { b.el.removeAttribute('hidden'); shown++; } else { b.el.setAttribute('hidden', 'hidden'); }
        if (searching && ok) b.el.setAttribute('open', 'open');
      });
      ui.blocks.forEach(function (blk) {
        if (blk.querySelector('details.entry:not([hidden])')) blk.removeAttribute('hidden'); else blk.setAttribute('hidden', 'hidden');
      });
      ui.countEl.textContent = shown + ' of ' + ui.total + ' entries';
      if (shown === 0) ui.emptyEl.removeAttribute('hidden'); else ui.emptyEl.setAttribute('hidden', 'hidden');
      totalShown += shown;
    });
    document.getElementById('search-status').textContent = searching ? (totalShown + ' matching entries') : '';
  }

  /* ---------- study path ---------- */

  function buildPath(sec, data) {
    var s = el('section', { id: sec.id }, [el('h2', { text: sec.title })]);
    if (sec.intro) s.appendChild(el('p', { text: sec.intro }));
    var mods = (data && data.modules) || [];
    if (!mods.length) {
      s.appendChild(el('p', { class: 'todo', text: 'Content to be added.' }));
      return s;
    }
    var done = {};
    try { done = JSON.parse(store('get', PATH_KEY) || '{}') || {}; } catch (e) { done = {}; }
    var total = el('p', { class: 'count' });
    var counters = [];
    function refresh() {
      var all = 0, got = 0;
      counters.forEach(function (c) {
        var n = 0;
        c.ids.forEach(function (id) { if (done[id]) n++; });
        c.el.textContent = n + ' of ' + c.ids.length + ' done';
        all += c.ids.length; got += n;
      });
      total.textContent = got + ' of ' + all + ' steps done. Progress is saved in this browser only.';
    }
    s.appendChild(total);

    var list = el('ol', { class: 'path' });
    mods.forEach(function (m, i) {
      var head = el('h3');
      head.appendChild(document.createTextNode((i + 1) + '. ' + m.title));
      head.appendChild(el('span', { class: 'tag', text: m.status === 'planned' ? 'Planned' : (LEVELS[m.level] || '') }));
      var li = el('li', { class: 'module', id: 'path-' + m.id }, [head]);
      if (m.goal) li.appendChild(el('p', { text: m.goal }));
      if (m.status === 'planned') {
        var tl = el('ul', { class: 'plain' });
        (m.topics || []).forEach(function (t) { tl.appendChild(el('li', { text: t })); });
        li.appendChild(el('p', { class: 'label', text: 'Planned topics' }));
        li.appendChild(tl);
      } else {
        var ids = (m.steps || []).filter(function (id) { return entryIndex[id]; });
        var cnt = el('p', { class: 'count' });
        counters.push({ ids: ids, el: cnt });
        li.appendChild(cnt);
        var ul = el('ul', { class: 'steps' });
        ids.forEach(function (id) {
          var info = entryIndex[id];
          var cb = el('input', { type: 'checkbox', id: 'step-' + id });
          cb.checked = !!done[id];
          cb.addEventListener('change', function () {
            if (cb.checked) done[id] = true; else delete done[id];
            store('set', PATH_KEY, JSON.stringify(done));
            refresh();
          });
          var lab = el('label', { for: 'step-' + id }, [cb]);
          lab.appendChild(document.createTextNode(' '));
          ul.appendChild(el('li', null, [lab, el('a', { href: '#' + info.sectionId + '-' + id, text: info.title })]));
        });
        li.appendChild(ul);
      }
      list.appendChild(li);
    });
    s.appendChild(list);
    refresh();
    return s;
  }

  /* ---------- sources (collected from entries) ---------- */

  function buildSources(sec, datasets) {
    var s = el('section', { id: sec.id }, [el('h2', { text: sec.title })]);
    var map = {}, order = [];
    datasets.forEach(function (d) {
      ((d && d.entries) || []).forEach(function (e) {
        (e.sources || []).forEach(function (src) {
          if (!map[src.url]) { map[src.url] = { title: src.title, url: src.url, n: 0 }; order.push(src.url); }
          map[src.url].n++;
        });
      });
    });
    s.appendChild(el('p', { text: 'A source is listed here only when an entry above uses it.' }));
    if (!order.length) {
      s.appendChild(el('p', { class: 'todo', text: 'No sources used yet.' }));
      return s;
    }
    var ul = el('ul', { class: 'plain' });
    order.forEach(function (u) {
      var m = map[u];
      var li = el('li');
      li.appendChild(el('a', { href: m.url, text: m.title }));
      li.appendChild(document.createTextNode(' (' + m.n + (m.n === 1 ? ' entry' : ' entries') + ')'));
      ul.appendChild(li);
    });
    s.appendChild(ul);
    return s;
  }

  /* ---------- flashcards ---------- */

  function buildFlashcards(sec, data) {
    var s = el('section', { id: sec.id }, [el('h2', { text: sec.title })]);
    var cards = (data && data.cards) || [];
    if (!cards.length) {
      s.appendChild(el('p', { class: 'todo', text: 'Content to be added.' }));
      return s;
    }

    var progress = {};
    try { progress = JSON.parse(store('get', FLASH_KEY) || '{}') || {}; } catch (e) { progress = {}; }
    var deck = cards.slice(), pos = 0, flipped = false, onlyRepeat = false;

    var card = el('button', { type: 'button', class: 'card', 'aria-live': 'polite' });
    var info = el('p', { class: 'deck-info' });
    var know = el('button', { type: 'button', class: 'btn', text: 'I know it' });
    var again = el('button', { type: 'button', class: 'btn', text: 'Repeat later' });
    var shuf = el('button', { type: 'button', class: 'btn', text: 'Shuffle' });
    var rep = el('button', { type: 'button', class: 'btn', text: 'Only cards to repeat', 'aria-pressed': 'false' });
    var reset = el('button', { type: 'button', class: 'btn', text: 'Reset progress' });

    function rebuild() {
      deck = cards.filter(function (c) { return !onlyRepeat || progress[c.id] === 'repeat'; });
      pos = 0; flipped = false; draw();
    }
    function draw() {
      card.textContent = '';
      var knownCount = cards.filter(function (c) { return progress[c.id] === 'known'; }).length;
      if (!deck.length) {
        card.appendChild(el('div', { class: 'face', text: onlyRepeat ? 'No cards marked to repeat.' : 'No cards.' }));
        info.textContent = knownCount + ' of ' + cards.length + ' known';
        return;
      }
      var c = deck[pos];
      card.appendChild(el('div', { class: 'side', text: flipped ? 'Answer' : 'Question' + (c.category ? ' · ' + c.category : '') }));
      card.appendChild(el('div', { class: 'face', text: flipped ? c.back : c.front }));
      info.textContent = 'Card ' + (pos + 1) + ' of ' + deck.length + ' · ' + knownCount + ' of ' + cards.length + ' known';
    }
    function next() { if (!deck.length) return; pos = (pos + 1) % deck.length; flipped = false; draw(); }
    function mark(v) {
      if (!deck.length) return;
      progress[deck[pos].id] = v;
      store('set', FLASH_KEY, JSON.stringify(progress));
      if (onlyRepeat && v === 'known') { rebuild(); return; }
      next();
    }

    card.addEventListener('click', function () { if (deck.length) { flipped = !flipped; draw(); } });
    know.addEventListener('click', function () { mark('known'); });
    again.addEventListener('click', function () { mark('repeat'); });
    shuf.addEventListener('click', function () { deck = shuffle(deck); pos = 0; flipped = false; draw(); });
    rep.addEventListener('click', function () {
      onlyRepeat = !onlyRepeat;
      rep.setAttribute('aria-pressed', onlyRepeat ? 'true' : 'false');
      rebuild();
    });
    reset.addEventListener('click', function () { progress = {}; store('set', FLASH_KEY, '{}'); rebuild(); });

    s.appendChild(el('p', { text: 'Click the card to flip it. Progress is saved in this browser only.' }));
    s.appendChild(el('div', { class: 'deck' }, [card, info,
      el('div', { class: 'deck-actions' }, [know, again, shuf, rep, reset])]));
    draw();
    return s;
  }

  /* ---------- start ---------- */

  function openHash() {
    if (!location.hash) return;
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    if (target.tagName === 'DETAILS') {
      target.removeAttribute('hidden');
      target.setAttribute('open', 'open');
    }
    target.scrollIntoView();
  }


  function init() {
    var main = document.getElementById('main');
    var searchEl = document.getElementById('search');
    searchEl.addEventListener('input', function () { query = searchEl.value; applyFilters(); });

    getJSON(CONTENT + 'sections.json').then(function (cfg) {
      if (!cfg || !cfg.sections) {
        main.textContent = '';
        main.appendChild(el('p', { class: 'todo', text: 'Content could not be loaded. When opening the page locally, serve the folder with "python -m http.server" instead of opening the file directly.' }));
        return;
      }
      if (cfg.pageTitle) {
        document.title = cfg.pageTitle;
        document.getElementById('page-title').textContent = cfg.pageTitle;
      }
      return Promise.all([getJSON(CONTENT + 'meta.json')].concat(cfg.sections.map(function (sec) {
        return sec.file ? getJSON(CONTENT + sec.file) : Promise.resolve(null);
      }))).then(function (res) {
        var meta = res[0], data = res.slice(1);
        main.textContent = '';
        var nav = document.getElementById('nav-list');
        cfg.sections.forEach(function (sec, i) {
          if (sec.type === 'entries' && data[i] && data[i].entries) {
            data[i].entries.forEach(function (e) { entryIndex[e.id] = { sectionId: sec.id, title: e.title }; });
          }
        });
        var entryDatasets = [];
        cfg.sections.forEach(function (sec, i) {
          nav.appendChild(el('li', null, [el('a', { href: '#' + sec.id, text: sec.title })]));
          var node;
          if (sec.type === 'about') node = buildAbout(sec, meta);
          else if (sec.type === 'entries') { entryDatasets.push(data[i]); node = buildEntries(sec, data[i]); }
          else if (sec.type === 'path') node = buildPath(sec, data[i]);
          else if (sec.type === 'flashcards') node = buildFlashcards(sec, data[i]);
          else if (sec.type === 'license') node = buildLicense(sec);
          else if (sec.type === 'sources') node = { deferred: sec };
          else return;
          main.appendChild(node.deferred ? el('section', { id: sec.id }) : node);
        });
        // Sources need every entries dataset, so they are built last.
        cfg.sections.forEach(function (sec) {
          if (sec.type !== 'sources') return;
          var placeholder = document.getElementById(sec.id);
          main.replaceChild(buildSources(sec, entryDatasets), placeholder);
        });
        applyFilters();
        openHash();
        window.addEventListener('hashchange', openHash);
      });
    });
  }

  init();
})();
