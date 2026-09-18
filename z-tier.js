(function(){
  'use strict';

  /* Row layout: [memberId, name, joinDate, inviterIdx, sponsorIdx, uplineIdx]
     Index -1 means the relationship is unknown for that member.            */
  var INVITER = 3, SPONSOR = 4, UPLINE = 5;

  var byId = new Map();   // memberId -> row
  var people = [];        // shared pool of [id, name] for all three relations
  var buckets = {};       // field -> Map(personId -> [rows])
  var ready = false;

  var $ = function(id){ return document.getElementById(id); };
  var result = $('result');

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* ID normalisation: uppercase, drop spaces / dashes / dots */
  function norm(v){ return String(v || '').toUpperCase().replace(/[\s\-_.]/g, ''); }

  var ID_RE = /^[A-Z]{2}\d{6,9}$/;

  /* full list of announced IDs — ID only, no names */
  function renderAll(d){
    var ids = d.rows.map(function(r){ return r[0]; }).sort();
    $('allIds').innerHTML = ids.map(function(id){
      return '<span data-id="' + esc(norm(id)) + '">' + esc(id) + '</span>';
    }).join('');
  }

  /* highlight one ID inside the full list and bring it into view */
  function highlight(q){
    var prev = $('allIds').querySelector('span.hit');
    if (prev) prev.className = '';
    var cell = $('allIds').querySelector('span[data-id="' + q + '"]');
    if (!cell) return;
    cell.className = 'hit';
    /* scroll the list box only — never move the page away from the result */
    var box = cell.parentNode.parentNode;
    box.scrollTop += cell.getBoundingClientRect().top - box.getBoundingClientRect().top
                     - box.clientHeight / 2 + cell.offsetHeight / 2;
  }

  function build(){
    var d = window.SKINDOX_ZARLAL;
    if (!d || ready) return ready;
    people = d.people;
    [INVITER, SPONSOR, UPLINE].forEach(function(field){ buckets[field] = new Map(); });
    d.rows.forEach(function(r){
      byId.set(norm(r[0]), r);
      [INVITER, SPONSOR, UPLINE].forEach(function(field){
        if (r[field] < 0) return;
        var key = norm(people[r[field]][0]);
        var m = buckets[field];
        if (!m.has(key)) m.set(key, []);
        m.get(key).push(r);
      });
    });
    $('statDate').textContent = String(d.updated).replace(/-/g, '.');
    renderAll(d);
    ready = true;
    return true;
  }

  function whenReady(cb){
    if (build()) { cb(); return; }
    result.innerHTML = '<div class="zs-loading">Жагсаалт ачаалж байна…</div>';
    var tries = 0;
    var t = setInterval(function(){
      if (build()) { clearInterval(t); result.innerHTML = ''; cb(); }
      else if (++tries > 100) {
        clearInterval(t);
        result.innerHTML = '<div class="zs-box danger"><div class="zs-msg">Жагсаалтыг ачаалж чадсангүй. Хуудсаа дахин ачаална уу.</div></div>';
      }
    }, 100);
  }

  /* ── tabs ── */
  var TABS = ['Member', 'Inviter', 'Sponsor', 'Upline'];

  function selectTab(which){
    TABS.forEach(function(name){
      $('tab' + name).setAttribute('aria-selected', name === which ? 'true' : 'false');
      $('pane' + name).hidden = name !== which;
      $('err' + name).className = 'zs-err';
    });
    result.innerHTML = '';
  }
  TABS.forEach(function(name){
    $('tab' + name).addEventListener('click', function(){ selectTab(name); });
  });

  function showErr(el, msg){
    el.textContent = msg;
    el.className = msg ? 'zs-err on' : 'zs-err';
  }

  function person(row, field){
    return row[field] >= 0 ? people[row[field]] : null;
  }

  function personCell(label, p){
    return '<div class="zs-field"><i>' + label + '</i><b>' +
           (p ? esc(p[0]) + '<br><span class="sub">' + esc(p[1] || '—') + '</span>' : '—') +
           '</b></div>';
  }

  /* row[6] is the membership tier ("Full Member", "Start", "Master" …) — present in newer data only */
  function tier(row){ return row.length > 6 && row[6] ? String(row[6]) : ''; }

  function fieldsFor(row){
    return '<div class="zs-grid">' +
      '<div class="zs-field"><i>Гишүүний нэр</i><b>' + esc(row[1]) + '</b></div>' +
      '<div class="zs-field"><i>Элссэн огноо</i><b>' + esc(String(row[2]).replace(/-/g, '.')) + '</b></div>' +
      (tier(row) ? '<div class="zs-field"><i>Ангилал</i><b>' + esc(tier(row)) + '</b></div>' : '') +
      '<div class="zs-field"><i>Статус</i><b>Хасагдах эрсдэлтэй</b></div>' +
      personCell('Шууд уригч', person(row, INVITER)) +
      personCell('Спонсор', person(row, SPONSOR)) +
      personCell('Уригчийн уригч', person(row, UPLINE)) +
      '</div>';
  }

  /* ── search 1: exact member ID ── */
  $('formMember').addEventListener('submit', function(e){
    e.preventDefault();
    var q = norm($('inpMember').value);
    if (!q) { showErr($('errMember'), 'ID дугаараа бичнэ үү.'); return; }
    if (!ID_RE.test(q)) {
      showErr($('errMember'), 'ID дугаараа бүтнээр, зөв хэлбэрээр бичнэ үү (жишээ: MN1234567, KR23030349).');
      result.innerHTML = '';
      return;
    }
    showErr($('errMember'), '');
    whenReady(function(){
      var row = byId.get(q);
      highlight(q);
      if (row) {
        result.innerHTML =
          '<div class="zs-box danger">' +
            '<span class="zs-flag danger">⚠ Хасагдах эрсдэлтэй гишүүн</span>' +
            '<div class="zs-id">' + esc(row[0]) + '</div>' +
            '<div class="zs-name">' + esc(row[1]) + '</div>' +
            '<div class="zs-msg">Энэ ID дугаар <strong>зарлагдсан жагсаалтад байна</strong>. Сүүлийн 6 сарын хугацаанд огт худалдан авалт хийгээгүй тул Гишүүнчлэлийн гэрээний <strong>13.3</strong>-ын дагуу <strong>2026 оны 10 дугаар сарын 1-ний өдрөөс гишүүний эрх цуцлагдах</strong> эрсдэлтэй. Эрхээ хадгалахын тулд яаралтай худалдан авалт хийж идэвхжүүлэлтээ хийнэ үү.</div>' +
            fieldsFor(row) +
          '</div>';
      } else {
        var also = [INVITER, SPONSOR, UPLINE].map(function(f){
          var list = buckets[f].get(q);
          return list ? list.length : 0;
        });
        var hint = '';
        if (also[0]) hint += ' Таны урьсан <strong>' + also[0] + '</strong> гишүүн жагсаалтад байна.';
        if (also[1]) hint += ' Таныг спонсороор бүртгүүлсэн <strong>' + also[1] + '</strong> гишүүн жагсаалтад байна.';
        if (also[2]) hint += ' Уригчийн уригчаар тань бүртгэлтэй <strong>' + also[2] + '</strong> гишүүн жагсаалтад байна.';
        if (hint) hint += ' Дээрх хайлтын хэсгүүдээс шалгана уу.';
        result.innerHTML =
          '<div class="zs-box ok">' +
            '<span class="zs-flag ok">✓ Жагсаалтад алга</span>' +
            '<div class="zs-id">' + esc(q) + '</div>' +
            '<div class="zs-msg">Энэ ID дугаар <strong>зарлагдсан жагсаалтад ороогүй байна</strong>. Танай гишүүнчлэлд одоогоор энэ зарлалын хүрээнд асуудал байхгүй.' + hint + '</div>' +
          '</div>';
      }
    });
  });

  /* ── searches 2-4: by inviter / sponsor / upline ── */
  function relationSearch(cfg){
    $('form' + cfg.name).addEventListener('submit', function(e){
      e.preventDefault();
      var err = $('err' + cfg.name);
      var q = norm($('inp' + cfg.name).value);
      if (!q) { showErr(err, cfg.who + '-ийн ID дугаарыг бичнэ үү.'); return; }
      if (!ID_RE.test(q)) {
        showErr(err, 'ID дугаарыг бүтнээр, зөв хэлбэрээр бичнэ үү (жишээ: MN1234567, KR23030349).');
        result.innerHTML = '';
        return;
      }
      showErr(err, '');
      whenReady(function(){
        var list = buckets[cfg.field].get(q);
        var self = byId.get(q);
        var selfBox = self
          ? '<div class="zs-box danger"><span class="zs-flag danger">⚠ Таны өөрийн ID жагсаалтад байна</span>' +
            '<div class="zs-id">' + esc(self[0]) + '</div><div class="zs-name">' + esc(self[1]) + '</div>' +
            '<div class="zs-msg">Та өөрөө ч мөн эрсдэлтэй гишүүдийн жагсаалтад орсон байна. Гэрээний 13.3-ын дагуу 2026 оны 10 дугаар сарын 1-ний өдрөөс эрх нь цуцлагдах тул яаралтай идэвхжүүлэлтээ хийнэ үү.</div></div>'
          : '';

        if (!list) {
          result.innerHTML = selfBox +
            '<div class="zs-box ok">' +
              '<span class="zs-flag ok">✓ ' + cfg.emptyFlag + '</span>' +
              '<div class="zs-id">' + esc(q) + '</div>' +
              '<div class="zs-msg">' + cfg.emptyMsg + '</div>' +
            '</div>';
          return;
        }

        var who = people[list[0][cfg.field]];
        var rows = list.slice().sort(function(a, b){ return a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0; });
        var hasTier = rows.some(function(r){ return tier(r); });
        result.innerHTML = selfBox +
          '<div class="zs-box neutral">' +
            '<span class="zs-flag danger">⚠ ' + rows.length + ' гишүүн эрсдэлтэй</span>' +
            '<div class="zs-id">' + esc(who[0]) + '</div>' +
            '<div class="zs-name">' + esc(who[1] || '—') + '</div>' +
            '<div class="zs-msg">' + cfg.foundMsg.replace('{n}', '<strong>' + rows.length + '</strong>') + '</div>' +
            '<div class="zs-count">Хасагдах эрсдэлтэй гишүүд</div>' +
            '<div class="zs-tablewrap"><table class="zs-table"><thead><tr>' +
              '<th>#</th><th>Гишүүний ID</th><th>Гишүүний нэр</th>' +
              (hasTier ? '<th>Ангилал</th>' : '') + '<th>Элссэн огноо</th>' +
            '</tr></thead><tbody>' +
            rows.map(function(r, i){
              return '<tr><td>' + (i + 1) + '</td><td class="idcell">' + esc(r[0]) + '</td><td>' +
                esc(r[1]) + '</td>' + (hasTier ? '<td>' + esc(tier(r)) + '</td>' : '') +
                '<td>' + esc(String(r[2]).replace(/-/g, '.')) + '</td></tr>';
            }).join('') +
            '</tbody></table></div>' +
          '</div>';
      });
    });
  }

  relationSearch({
    name: 'Inviter', field: INVITER, who: 'Уригч',
    emptyFlag: 'Урьсан гишүүн алга',
    emptyMsg: 'Энэ ID дугаараар шууд урьсан гишүүдээс <strong>зарлагдсан жагсаалтад орсон нь алга байна</strong>.',
    foundMsg: 'Таны шууд урьсан гишүүдээс {n} гишүүн зарлагдсан жагсаалтад орсон байна. Тэдэнтэй холбогдож идэвхжүүлэлт хийлгэнэ үү.'
  });

  relationSearch({
    name: 'Sponsor', field: SPONSOR, who: 'Спонсор',
    emptyFlag: 'Харьяа гишүүн алга',
    emptyMsg: 'Энэ ID дугаарыг спонсороор бүртгүүлсэн гишүүдээс <strong>зарлагдсан жагсаалтад орсон нь алга байна</strong>.',
    foundMsg: 'Таныг спонсороор бүртгүүлсэн гишүүдээс {n} гишүүн зарлагдсан жагсаалтад орсон байна. Тэдэнтэй холбогдож идэвхжүүлэлт хийлгэнэ үү.'
  });

  relationSearch({
    name: 'Upline', field: UPLINE, who: 'Уригчийн уригч',
    emptyFlag: 'Харьяа гишүүн алга',
    emptyMsg: 'Энэ ID дугаараар уригчийн уригчаар бүртгэлтэй гишүүдээс <strong>зарлагдсан жагсаалтад орсон нь алга байна</strong>.',
    foundMsg: 'Таны урьсан гишүүдийн урьсан гишүүдээс {n} гишүүн зарлагдсан жагсаалтад орсон байна. Багийнхантайгаа холбогдож идэвхжүүлэлт хийлгэнэ үү.'
  });

  /* fill the update date and the full list as soon as the data file lands */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
