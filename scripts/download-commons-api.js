#!/usr/bin/env node
/**
 * download-commons-api.js
 *
 * Robust downloader that fetches full‑size images for every card by asking
 * the Wikimedia Commons API for the canonical file URL.  Works even when
 * thumb links are stale.  Updates js/card-data.js so target_img &
 * local_target_img point to the downloaded file.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// --- tiny helper -----------------------------------------------------------
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function fmt(bytes){return bytes<1024?`${bytes} B`:bytes<1048576?`${(bytes/1024).toFixed(1)} KB`:`${(bytes/1048576).toFixed(1)} MB`;}

// --- configuration ---------------------------------------------------------
const CONFIG = {
  cardDataPath: path.join(__dirname,'../js/card-data.js'),
  imgDir: path.join(__dirname,'../images/cards/local'),
  minSize: 5000,          // bytes – smaller considered broken
  throttleMs: 700,        // delay between API calls to avoid 429
  userAgent: 'TabooDownloader/1.0 (https://github.com/gabe/taboo)',
};

if(!fs.existsSync(CONFIG.imgDir)) fs.mkdirSync(CONFIG.imgDir,{recursive:true});

// --- load card data --------------------------------------------------------
const jsText = fs.readFileSync(CONFIG.cardDataPath,'utf8');
const match = jsText.match(/const\s+tabooCards\s*=\s*(\[[\s\S]*?\]);/);
if(!match){console.error('❌ Could not parse tabooCards');process.exit(1);} 
const cards = eval(match[1]);

// --- helpers ---------------------------------------------------------------
function extractFilename(url){
  try{
    const u = new URL(url);
    let file = decodeURIComponent(u.pathname.split('/').pop());
    // If this is a thumb URL the actual file may be the segment before /thumb/ or after size prefix
    if(file === '' || file.match(/^(\d+|\d+px-).*$/)){
      // Previous segment often holds the real filename when last is size-spec
      const parts = u.pathname.split('/');
      file = decodeURIComponent(parts[parts.length-2] || parts.pop());
    }
    // Strip leading size qualifiers like "800px-" or "1024px-"
    file = file.replace(/^(\d+px-)/,'');
    // Replace underscores with spaces for API titles
    return file.replace(/_/g,' ');
  }catch(e){
    return url.split('/').pop().replace(/^(\d+px-)/,'').replace(/_/g,' ');
  }
}

function commonsAPIUrl(filename){
  return `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
}

function fetchJSON(url){
  return new Promise((res,rej)=>{
    https.get(url,{headers:{'User-Agent':CONFIG.userAgent}},r=>{
      let data='';
      r.on('data',d=>data+=d);
      r.on('end',()=>{
        try{res(JSON.parse(data));}catch(e){rej(e);}  });
    }).on('error',rej);
  });
}

function download(url,dest){
  return new Promise((resolve,reject)=>{
    https.get(url,{headers:{'User-Agent':CONFIG.userAgent}},res=>{
      if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){
        return download(res.headers.location,dest).then(resolve).catch(reject);
      }
      if(res.statusCode!==200) return reject(new Error(`HTTP ${res.statusCode}`));
      const file=fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish',()=>{
        file.close();
        const s=fs.statSync(dest).size;
        if(s<CONFIG.minSize){fs.unlinkSync(dest);return reject(new Error('too small'));}
        resolve(s);
      });
    }).on('error',reject);
  });
}

async function getCanonicalUrl(remote){
  const filename = extractFilename(remote);
  // 1. Try Commons API first
  try{
    const json = await fetchJSON(commonsAPIUrl(filename));
    const page = json.query.pages[Object.keys(json.query.pages)[0]];
    if(page && page.imageinfo) return page.imageinfo[0].url;
  }catch(e){ /* ignore, fallback below */ }

  // 2. Try Special:FilePath redirect (works even when page title casing is off)
  const filePathUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename.replace(/ /g,'_'))}`;
  try{
    await headOK(filePathUrl);
    return filePathUrl;
  }catch(e){ /* ignore */ }

  // 3. Fallback: attempt to clean remote thumb → original path
  try{
    const cleaned = remote.replace(/\/thumb\//,'/').replace(/\/\d+px-.*/,`/${encodeURIComponent(filename.replace(/ /g,'_'))}`);
    await headOK(cleaned);
    return cleaned;
  }catch(e){ /* ignore */ }

  throw new Error('no downloadable url');
}

function headOK(url){
  return new Promise((resolve,reject)=>{
    https.get(url,{method:'HEAD',headers:{'User-Agent':CONFIG.userAgent}},res=>{
      if(res.statusCode>=200 && res.statusCode<400) resolve();
      else reject(new Error('HEAD '+res.statusCode));
    }).on('error',reject);
  });
}

// additional helper: search Commons for similar image titles
async function searchCommons(term){
  const url=`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srnamespace=6&format=json&srlimit=10`;
  try{
    const json=await fetchJSON(url);
    const results=json.query.search||[];
    const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp']);
    for(const r of results){
      const title=r.title.replace(/^File:/,'');
      const ext = path.extname(title).toLowerCase();
      if (!imageExtensions.has(ext)) continue; // Skip non-image files
      try{
        const apiJson=await fetchJSON(commonsAPIUrl(title));
        const page=apiJson.query.pages[Object.keys(apiJson.query.pages)[0]];
        if(page&&page.imageinfo) return page.imageinfo[0].url;
      }catch(e){/*continue*/}
    }
  }catch(e){/* ignore */}
  return null;
}

function findLocalMatch(term){
  const files=fs.readdirSync(CONFIG.imgDir);
  term=term.toLowerCase().replace(/[^a-z0-9]/g,'');
  for(const f of files){
    if(f.toLowerCase().replace(/[^a-z0-9]/g,'').includes(term)){
      const p=path.join(CONFIG.imgDir,f);
      if(fs.statSync(p).size>=CONFIG.minSize) return p;
    }
  }
  return null;
}

const IMAGE_EXTENSIONS = new Set(['.jpg','.jpeg','.png','.gif','.svg','.webp']);
const MIN_SCORE = 40;
const SECOND_PASS_SCORE = 25;
const SEARCH_LIMIT = 40;
const SYNONYMS = {
  // Example expansions (add more as needed)
  1: ['morison pouch', 'hepatorenal', 'ruq', 'right upper quadrant'],
  2: ['splenorenal', 'luq', 'left upper quadrant', 'spleen', 'kidney'],
  4: ['subxiphoid', 'subcostal', 'heart', 'cardiac', 'four chamber'],
  5: ['parasternal', 'long axis', 'plax', 'heart', 'cardiac'],
  7: ['ivc', 'inferior vena cava', 'cava', 'vein'],
  10: ['lung', 'diaphragm', 'plaps', 'base'],
  11: ['portal vein', 'liver', 'hepatic', 'vein'],
  12: ['aorta', 'abdominal aorta', 'aneurysm'],
  13: ['parasternal', 'short axis', 'aortic valve', 'heart'],
  14: ['popliteal', 'vein', 'thrombosis', 'leg'],
  15: ['mitral valve', 'parasternal', 'short axis', 'heart'],
  16: ['brachial plexus', 'nerve', 'c5', 'c6'],
  17: ['gallbladder', 'long axis', 'liver'],
  18: ['gallbladder', 'short axis', 'liver'],
  19: ['bile duct', 'gallbladder', 'liver'],
  20: ['kidney', 'long axis', 'renal'],
  21: ['bladder', 'volume', 'urine'],
  22: ['papillary muscle', 'parasternal', 'short axis', 'heart'],
  23: ['apical', 'two chamber', 'heart'],
  24: ['thyroid', 'transverse'],
  25: ['thyroid', 'longitudinal'],
  26: ['jugular', 'carotid', 'vein', 'artery'],
  27: ['glenohumeral', 'shoulder', 'joint'],
  28: ['biceps', 'tendon', 'transverse'],
  29: ['subcostal', 'short axis', 'heart'],
  30: ['spleen', 'long axis'],
  31: ['a-lines', 'lung', 'normal'],
  32: ['psoas', 'muscle'],
  33: ['rectus sheath', 'block', 'ultrasound'],
  34: ['parasternal', 'long axis', 'heart'],
  35: ['jugular', 'vein', 'cannulation'],
};

function buildKeywords(card){
  return [...new Set(
    (card.targetWord||'')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g,'')
      .split(/\s+/)
      .filter(Boolean)
      .concat(['ultrasound'])
      .concat(SYNONYMS[card.id]||[])
  )];
}

function commonsAPIInfoUrl(filename){
  return `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url|extmetadata|mime&format=json`;
}

function scoreHit(meta, kws){
  const title = (meta.title||'').toLowerCase();
  const desc = (meta.extmetadata?.ImageDescription?.value||'').toLowerCase();
  const cats = (meta.extmetadata?.Categories?.value||'').toLowerCase();
  const mime = (meta.imageinfo?.[0]?.mime||'');
  let s=0;
  kws.forEach(k=>{
    if(title.includes(k)) s+=30/kws.length;
    if(desc.includes(k)) s+=25/kws.length;
    if(cats.includes(k)) s+=10/kws.length;
  });
  if(!mime.startsWith('image/')) s-=25;
  return s;
}

async function bestMatch(card, minScore=MIN_SCORE, logArr=null){
  const kws = buildKeywords(card);
  const url=`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(kws.join(' '))}&srnamespace=6&format=json&srlimit=${SEARCH_LIMIT}`;
  try{
    const json=await fetchJSON(url);
    const results=json.query.search||[];
    for(const r of results){
      const title=r.title.replace(/^File:/,'');
      const ext = path.extname(title).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) continue;
      try{
        const apiJson=await fetchJSON(commonsAPIInfoUrl(title));
        const page=apiJson.query.pages[Object.keys(apiJson.query.pages)[0]];
        if(page&&page.imageinfo){
          const score = scoreHit(page, kws);
          if(logArr) logArr.push({cardId: card.id, title, score});
          if(score >= minScore && page.imageinfo[0].mime.startsWith('image/'))
            return page.imageinfo[0].url;
        }
      }catch(e){/*continue*/}
    }
  }catch(e){/* ignore */}
  return null;
}

// --- main loop -------------------------------------------------------------
(async()=>{
  let good=0,bad=0,skip=0,missing=[], logMatches=[];
  for(const card of cards){
    const id=card.id;
    const targetPath=card.target_img || card.local_target_img || card.remote_target_img;
    const filenameBase=extractFilename(targetPath);
    const localName=`${id}_target_${filenameBase}`.replace(/[^a-zA-Z0-9._-]/g,'_');
    const localPath=path.join(CONFIG.imgDir,localName);
    const webPath=`images/cards/local/${localName}`;

    // if already exists and fine
    if(fs.existsSync(localPath) && fs.statSync(localPath).size>=CONFIG.minSize){
      card.target_img=webPath; card.local_target_img=webPath; skip++; continue; }

    console.log(`\n🖼️  Card ${id}: fetching image…`);

    try{
      const url=await getCanonicalUrl(card.remote_target_img);
      console.log('   ↪',url); await download(url,localPath);
      console.log('   ✅ saved',localName,'(',fmt(fs.statSync(localPath).size),')');
      card.target_img=webPath; card.local_target_img=webPath; good++;
    }catch(err){
      console.warn('   ❌',err.message);
      // ----- fallback: relevance engine (first pass) ----------------------
      try{
        const altUrl = await bestMatch(card, MIN_SCORE, logMatches);
        if(altUrl){
          console.log('   🤖 found relevant alt:',altUrl);
          await download(altUrl,localPath);
          console.log('   ✅ saved',localName,'(',fmt(fs.statSync(localPath).size),')');
          card.target_img=webPath; card.local_target_img=webPath; good++; continue;
        }
      }catch(e2){ console.warn('   ⚠️  search failed:',e2.message); }
      // ----- fallback: relevance engine (second pass, lower threshold) ----
      try{
        const altUrl2 = await bestMatch(card, SECOND_PASS_SCORE, logMatches);
        if(altUrl2){
          console.log('   🤖 found lower-score alt:',altUrl2);
          await download(altUrl2,localPath);
          console.log('   ✅ saved',localName,'(',fmt(fs.statSync(localPath).size),')');
          card.target_img=webPath; card.local_target_img=webPath; good++; continue;
        }
      }catch(e3){ console.warn('   ⚠️  second search failed:',e3.message); }
      // ----- fallback 2: existing local similar ---------------------------
      const localMatch = findLocalMatch(card.targetWord || filenameBase);
      if(localMatch){
        console.log('   ♻️  reusing similar local image',path.basename(localMatch));
        fs.copyFileSync(localMatch,localPath);
        card.target_img=webPath; card.local_target_img=webPath; good++;
      }else{
        bad++;
        missing.push({id:card.id, targetWord:card.targetWord});
      }
    }
    await sleep(CONFIG.throttleMs);
  }

  // write back card-data.js
  const updated=jsText.replace(/const tabooCards = \[[\s\S]*?\];/,`const tabooCards = ${JSON.stringify(cards,null,2)};`);
  fs.writeFileSync(CONFIG.cardDataPath,updated,'utf8');
  console.log(`\nDone. success:${good}  failed:${bad}  skipped(existing):${skip}`);

  // Write missing report
  if(missing.length){
    const html = `<html><body><h2>Cards missing relevant images</h2><ul>`+
      missing.map(m=>`<li>Card ${m.id}: ${m.targetWord}<br>
        <a href='https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(m.targetWord+' ultrasound')}&title=Special:MediaSearch&go=Go&type=image' target='_blank'>Search Commons</a> |
        <a href='https://www.google.com/search?tbm=isch&q=${encodeURIComponent(m.targetWord+' ultrasound')}' target='_blank'>Google Images</a> |
        <a href='https://radiopaedia.org/search?utf8=✓&q=${encodeURIComponent(m.targetWord+' ultrasound')}' target='_blank'>Radiopaedia</a><br>
        <b>Manual upload:</b> Place a relevant image in <code>images/cards/local/</code> named <code>${m.id}_target_[yourfilename].jpg/png</code> and rerun the script.
      </li>`).join('')+
      `</ul><p>For best results, use public domain or open-license images. After manual upload, rerun <code>node scripts/download-commons-api.js</code> to update the card data.</p></body></html>`;
    fs.writeFileSync(path.join(CONFIG.imgDir,'missing-images.html'), html, 'utf8');
    console.log(`See missing-images.html for unresolved cards.`);
  }
  // Write log of all attempted matches and scores
  if(logMatches.length){
    fs.writeFileSync(path.join(CONFIG.imgDir,'match-log.json'), JSON.stringify(logMatches, null, 2), 'utf8');
    console.log('See match-log.json for all attempted matches and scores.');
  }
})(); 