/* Pengganti layanan claude.ai agar aplikasi jalan sendiri di browser:
   - db: tidak dipakai (data disimpan di localStorage browser ini)
   - downloads: unduh biasa lewat browser
   - mcp: Google Drive lewat Google Drive API + Google Identity Services */
(function(){
  const CFG = window.APP_CONFIG || {};
  const SCOPE = 'https://www.googleapis.com/auth/drive';
  const KEY = 'pt-gtoken';
  const err = (code, message) => Object.assign(new Error(message || code), {code, message: message || ''});

  /* ---------- unduhan ---------- */
  const downloads = {
    save: async ({filename, data}) => {
      const blob = data instanceof Blob ? data : new Blob([data]);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
      return {status:'saved'};
    }
  };

  /* ---------- token Google ---------- */
  let tokenClient = null, pending = null;
  function stored(){ try{ const t = JSON.parse(localStorage.getItem(KEY) || 'null'); return t && t.exp > Date.now() + 60000 ? t.token : ''; }catch(e){ return ''; } }
  function ready(){
    return new Promise((res, rej) => {
      let n = 0;
      (function w(){ if(window.google && google.accounts && google.accounts.oauth2) return res(); if(++n > 100) return rej(err('needs_reauth')); setTimeout(w, 100); })();
    });
  }
  async function connect(interactive){
    if(!CFG.GOOGLE_CLIENT_ID) throw err('not_configured');
    const have = stored(); if(have) return have;
    await ready();
    return new Promise((res, rej) => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CFG.GOOGLE_CLIENT_ID, scope: SCOPE,
        callback: r => {
          if(r && r.access_token){
            try{ localStorage.setItem(KEY, JSON.stringify({token:r.access_token, exp:Date.now() + (+r.expires_in || 3600) * 1000})); }catch(e){}
            res(r.access_token);
          }else rej(err('needs_reauth'));
        },
        error_callback: () => rej(err('needs_reauth'))
      });
      tokenClient.requestAccessToken({prompt: interactive ? 'consent' : ''});
    });
  }
  window.PT_connectDrive = async function(){
    const t = await connect(true); owner = ''; await who(t); return owner || 'terhubung';
  };

  /* ---------- Drive REST ---------- */
  let owner = '';
  async function api(url, opt){
    const token = await connect(false);
    const r = await fetch(url, Object.assign({}, opt, {headers: Object.assign({Authorization:'Bearer ' + token}, (opt && opt.headers) || {})}));
    if(r.status === 401){ try{ localStorage.removeItem(KEY); }catch(e){} throw err('needs_reauth'); }
    if(r.status === 429) throw err('rate_limited');
    if(!r.ok){ let m = ''; try{ m = (await r.json()).error.message; }catch(e){} throw err('tool_error', m); }
    return r.json();
  }
  async function who(){
    if(owner) return owner;
    try{ const j = await api('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)'); owner = (j.user && j.user.emailAddress) || ''; }catch(e){}
    return owner;
  }
  const FIELDS = 'id,name,mimeType,webViewLink,parents';
  const shape = f => ({id:f.id, title:f.name, mimeType:f.mimeType, parentId:(f.parents || [])[0] || '', owner, viewUrl:f.webViewLink || ''});

  async function searchFiles(input){
    // bentuk: title = '…' and mimeType = '…' and parentId = '…'
    const q = input.query || '';
    const m = q.match(/^title = '((?:[^'\\]|\\.)*)' and mimeType = '([^']*)' and parentId = '([^']*)'$/);
    if(!m) throw err('bad_request');
    const dq = "name = '" + m[1] + "' and mimeType = '" + m[2] + "' and '" + m[3] + "' in parents and trashed = false";
    await who();
    const j = await api('https://www.googleapis.com/drive/v3/files?pageSize=5&fields=files(' + FIELDS + ')&q=' + encodeURIComponent(dq));
    return j.files && j.files.length ? {files:j.files.map(shape)} : {};
  }
  async function createFile(input){
    await who();
    const meta = {name:input.title, mimeType:input.mimeType || input.contentMimeType || 'application/octet-stream'};
    if(input.parentId) meta.parents = [input.parentId];
    const b = input.base64Content;
    if(b === undefined){
      const f = await api('https://www.googleapis.com/drive/v3/files?fields=' + FIELDS, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(meta)});
      return shape(f);
    }
    let blob;
    if(b && b.$file) blob = b.$file.data;
    else{ const bin = atob(b); const u = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); blob = new Blob([u]); }
    meta.mimeType = input.contentMimeType || meta.mimeType;
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(meta)], {type:'application/json'}));
    form.append('file', new Blob([blob], {type:meta.mimeType}));
    const f = await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=' + FIELDS, {method:'POST', body:form});
    return shape(f);
  }
  const mcp = {
    listTools: async () => ({servers:[], fileArgs:true}),
    callTool: async (srv, tool, input) => {
      if(tool === 'search_files') return {payload: await searchFiles(input)};
      if(tool === 'create_file') return {payload: await createFile(input)};
      throw err('bad_request');
    }
  };

  window.claude = {use: async name => name === 'downloads' ? downloads : name === 'mcp' ? mcp : null};

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-gconnect'), msg = document.getElementById('drive-msg');
    if(!btn) return;
    btn.addEventListener('click', async () => {
      msg.className = 'msg'; msg.textContent = 'Membuka jendela masuk Google…';
      try{ const who = await window.PT_connectDrive(); msg.className = 'msg good'; msg.textContent = 'Terhubung ke Google Drive' + (who && who !== 'terhubung' ? ' (' + who + ').' : '.'); }
      catch(e){ msg.className = 'msg bad'; msg.textContent = e.code === 'not_configured' ? 'Isi GOOGLE_CLIENT_ID di config.js dahulu (lihat README).' : 'Gagal terhubung. Izinkan jendela pop-up lalu coba lagi.'; }
    });
  });
})();
