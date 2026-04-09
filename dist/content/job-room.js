(()=>{(function(){if(!window.location.href.includes("work-efforts"))return;console.log("[Lazy Worker] job-room.ch form filler loaded"),setTimeout(W,2e3);function W(){S()}function S(){const e=document.getElementById("lw-float-btn");e&&e.remove();const n=document.createElement("div");n.id="lw-float-btn",n.innerHTML=`
      <style>
        #lw-float-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 99999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        #lw-float-btn .lw-btn {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          padding: 14px 22px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4), 0 0 40px rgba(99, 102, 241, 0.2);
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: -0.01em;
        }

        #lw-float-btn .lw-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(99, 102, 241, 0.5), 0 0 60px rgba(99, 102, 241, 0.3);
        }

        #lw-float-btn .lw-btn:active {
          transform: translateY(0);
        }

        #lw-float-btn .lw-btn svg {
          width: 20px;
          height: 20px;
        }

        #lw-panel {
          display: none;
          position: fixed;
          bottom: 90px;
          right: 24px;
          width: 340px;
          max-height: 420px;
          background: #141417;
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1);
          z-index: 99998;
          overflow: hidden;
        }

        #lw-panel.active {
          display: block;
          animation: lw-slide-up 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes lw-slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        #lw-panel-header {
          background: linear-gradient(180deg, #1c1c21 0%, #141417 100%);
          color: white;
          padding: 16px 18px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        #lw-panel-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        #lw-panel-header-title svg {
          width: 20px;
          height: 20px;
          color: #6366f1;
        }

        #lw-panel-close {
          background: transparent;
          border: none;
          color: #71717a;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }

        #lw-panel-close:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        #lw-panel-close svg {
          width: 16px;
          height: 16px;
        }

        #lw-panel-content {
          padding: 12px;
          max-height: 340px;
          overflow-y: auto;
        }

        #lw-panel-content::-webkit-scrollbar {
          width: 6px;
        }

        #lw-panel-content::-webkit-scrollbar-track {
          background: transparent;
        }

        #lw-panel-content::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }

        .lw-app-item {
          padding: 14px 16px;
          background: #1c1c21;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .lw-app-item:hover {
          border-color: #6366f1;
          background: #232329;
          transform: translateX(2px);
        }

        .lw-app-item:last-child {
          margin-bottom: 0;
        }

        .lw-app-company {
          font-weight: 600;
          font-size: 14px;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .lw-app-position {
          font-size: 13px;
          color: #a1a1aa;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lw-app-meta {
          font-size: 12px;
          color: #71717a;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lw-app-meta::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 4px;
          background: #6366f1;
          border-radius: 50%;
        }

        .lw-empty {
          text-align: center;
          padding: 32px 20px;
          color: #71717a;
          font-size: 14px;
        }

        .lw-empty-icon {
          width: 40px;
          height: 40px;
          margin: 0 auto 12px;
          opacity: 0.4;
        }

        .lw-toast {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          background: #232329;
          color: white;
          padding: 12px 20px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 500;
          z-index: 999999;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.1);
          animation: lw-toast 3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .lw-toast.success {
          background: #10b981;
          border-color: #10b981;
        }

        @keyframes lw-toast {
          0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
          10% { opacity: 1; transform: translateX(-50%) translateY(0); }
          90% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
      </style>
      <button class="lw-btn" id="lw-trigger">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <span>Formular ausf\xFCllen</span>
      </button>
      <div id="lw-panel">
        <div id="lw-panel-header">
          <div id="lw-panel-header-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="12" y2="17"/>
            </svg>
            <span>Bewerbung ausw\xE4hlen</span>
          </div>
          <button id="lw-panel-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div id="lw-panel-content">
          <div class="lw-empty">
            <svg class="lw-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            Lade...
          </div>
        </div>
      </div>
    `,document.body.appendChild(n),document.getElementById("lw-trigger").addEventListener("click",q),document.getElementById("lw-panel-close").addEventListener("click",v)}function q(){const e=document.getElementById("lw-panel");e.classList.toggle("active"),e.classList.contains("active")&&T()}function v(){document.getElementById("lw-panel").classList.remove("active")}async function T(){const e=document.getElementById("lw-panel-content");try{if(!chrome?.storage?.local)throw new Error("Chrome storage not available");console.log("[Lazy Worker] Loading applications from storage...");const n=await chrome.storage.local.get("applications");console.log("[Lazy Worker] Storage result:",n);const l=n.applications||[];if(l.length===0){e.innerHTML='<div class="lw-empty">Keine Bewerbungen gespeichert.<br>Erfasse zuerst Jobs!</div>';return}l.sort((a,o)=>new Date(o.appliedAt)-new Date(a.appliedAt)),e.innerHTML=l.map(a=>`
        <div class="lw-app-item" data-id="${a.id}">
          <div class="lw-app-company">${a.company||"Unbekannt"}</div>
          <div class="lw-app-position">${a.position||"-"}</div>
          <div class="lw-app-meta">${A(a.appliedAt)} \u2022 ${a.location?.postalCode||a.location?.plz||""} ${a.location?.city||""}</div>
        </div>
      `).join(""),e.querySelectorAll(".lw-app-item").forEach(a=>{a.addEventListener("click",()=>{const o=l.find(i=>i.id===a.dataset.id);o&&(B(o),v())})})}catch(n){console.error("[Lazy Worker] Error loading applications:",n),console.error("[Lazy Worker] Error details:",n.message,n.stack),e.innerHTML=`<div class="lw-empty">Fehler beim Laden<br><small>${n.message||"Unbekannter Fehler"}</small></div>`}}function A(e){if(!e)return"";const[n,l,a]=e.split("-");return`${a}.${l}.${n}`}function m(e,n){return!e||n===void 0||n===null?!1:(e.focus(),e.value="",e.value=n,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),e.dispatchEvent(new KeyboardEvent("keyup",{bubbles:!0})),e.dispatchEvent(new Event("blur",{bubbles:!0})),console.log("[Lazy Worker] Set value:",e.placeholder||e.name,"=",n),!0)}function I(e){return e?(e.focus(),e.click(),e.checked=!0,e.dispatchEvent(new Event("change",{bubbles:!0})),e.dispatchEvent(new Event("click",{bubbles:!0})),console.log("[Lazy Worker] Clicked:",e.id||e.name||e.value),!0):!1}function p(e){const n=e.toLowerCase(),l=document.querySelectorAll("input");for(const i of l)if((i.placeholder||"").toLowerCase().includes(n))return i;const a=document.querySelectorAll("mat-label, label, .mat-form-field-label, span");for(const i of a)if((i.textContent||"").toLowerCase().trim().includes(n)){const h=i.closest("mat-form-field, .mat-form-field, .form-group, .field");if(h){const f=h.querySelector("input");if(f)return f}const g=i.parentElement;if(g){const f=g.querySelector("input");if(f)return f}}const o=document.querySelectorAll('input[type="text"], input:not([type])');for(const i of o){const u=i.closest(".mat-form-field, mat-form-field, .form-field, .form-group");if(u&&u.textContent.toLowerCase().includes(n))return i}return null}function $(e){const n=document.querySelectorAll("label");for(const o of n)if(o.textContent.toLowerCase().includes(e.toLowerCase())){const i=o.querySelector('input[type="checkbox"]');if(i)return i;if(o.htmlFor){const u=document.getElementById(o.htmlFor);if(u&&u.type==="checkbox")return u}}const l=document.body.innerText,a=document.querySelectorAll('input[type="checkbox"]');for(const o of a){const i=o.closest("label, div, span, li");if(i&&i.textContent.toLowerCase().includes(e.toLowerCase()))return o}return null}function M(e){const n=document.querySelectorAll("label");for(const a of n)if(a.textContent.trim().toLowerCase()===e.toLowerCase()){const o=a.querySelector('input[type="radio"]');if(o)return o;if(a.htmlFor){const i=document.getElementById(a.htmlFor);if(i&&i.type==="radio")return i}}const l=document.querySelectorAll('input[type="radio"]');for(const a of l){const o=a.closest("label, div, li");if(o&&o.textContent.trim().toLowerCase()===e.toLowerCase())return a}return null}async function B(e){console.log("[Lazy Worker] Filling form with:",e),console.log("[Lazy Worker] Scanning page for form elements...");const n=document.querySelectorAll("input");console.log("[Lazy Worker] Found",n.length,"input elements"),n.forEach((t,r)=>{const c=t.closest("mat-form-field")||t.parentElement,s=c?.querySelector("mat-label, label");console.log(`[Lazy Worker] Input ${r}:`,{type:t.type,id:t.id,name:t.name,placeholder:t.placeholder,label:s?.textContent?.trim(),parentText:c?.textContent?.substring(0,50)})});let l=0;await new Promise(t=>setTimeout(t,500));const a=document.querySelectorAll("mat-form-field");console.log("[Lazy Worker] Found",a.length,"mat-form-field elements");const o={};a.forEach(t=>{const r=t.querySelector("mat-label, label, .mat-form-field-label"),c=t.querySelector("input, textarea");if(r&&c){const s=r.textContent.trim().toLowerCase();o[s]=c,console.log("[Lazy Worker] Mapped field:",s,"\u2192",c.tagName)}});const i=o.date||o.datum||p("date")||p("datum");if(i&&e.appliedAt){const[t,r,c]=e.appliedAt.split("-");m(i,`${c}.${r}.${t}`)&&l++}else console.log("[Lazy Worker] Date field not found");let u=!1;async function h(t){console.log("[Lazy Worker] Attempting to click mat-checkbox...");const r=t.querySelector('input[type="checkbox"]'),c=()=>r&&r.checked;if(t.click(),console.log("[Lazy Worker] Strategy 1: clicked mat-checkbox element"),await new Promise(b=>setTimeout(b,100)),c()){console.log("[Lazy Worker] Checkbox checked via strategy 1");return}const s=t.querySelector("label");if(s&&(s.dispatchEvent(new MouseEvent("mousedown",{bubbles:!0,cancelable:!0,view:window})),s.dispatchEvent(new MouseEvent("mouseup",{bubbles:!0,cancelable:!0,view:window})),s.dispatchEvent(new MouseEvent("click",{bubbles:!0,cancelable:!0,view:window})),console.log("[Lazy Worker] Strategy 2: full mouse sequence on label")),await new Promise(b=>setTimeout(b,100)),c()){console.log("[Lazy Worker] Checkbox checked via strategy 2");return}if(r&&(r.focus(),r.click(),console.log("[Lazy Worker] Strategy 3: clicked input directly")),await new Promise(b=>setTimeout(b,100)),c()){console.log("[Lazy Worker] Checkbox checked via strategy 3");return}const d=t.querySelectorAll(".mat-mdc-checkbox-touch-target, .mdc-checkbox, .mdc-checkbox__native-control, .mat-checkbox-inner-container");for(const b of d)if(b.click(),console.log("[Lazy Worker] Strategy 4: clicked",b.className),await new Promise(F=>setTimeout(F,50)),c()){console.log("[Lazy Worker] Checkbox checked via strategy 4");return}r&&!c()&&(r.checked=!0,r.dispatchEvent(new Event("change",{bubbles:!0})),r.dispatchEvent(new Event("input",{bubbles:!0})),t.classList.add("mat-mdc-checkbox-checked","mat-checkbox-checked"),t.dispatchEvent(new Event("change",{bubbles:!0})),console.log("[Lazy Worker] Strategy 5: forced checked state")),console.log("[Lazy Worker] Checkbox final state:",c())}const g=document.querySelectorAll("mat-checkbox");console.log("[Lazy Worker] Found",g.length,"mat-checkbox elements");for(const t of g){const r=t.textContent?.toLowerCase()||"";if(console.log("[Lazy Worker] mat-checkbox text:",r.substring(0,50)),r.includes("elektron")||r.includes("electronic")){await h(t),l++,u=!0,console.log("[Lazy Worker] Processed elektronisch checkbox");break}}if(!u){const t=document.querySelectorAll('mat-checkbox, .mat-checkbox, [type="checkbox"]');for(const r of t){const c=r.closest("div, label, span, li")||r.parentElement;if(c&&(c.textContent?.toLowerCase().includes("elektron")||c.textContent?.toLowerCase().includes("electronic"))){const s=r.querySelector?r.querySelector('input[type="checkbox"]'):r;if(s){s.click(),s.checked=!0,s.dispatchEvent(new Event("change",{bubbles:!0})),l++,u=!0,console.log("[Lazy Worker] Found checkbox via fallback");break}}}}u||console.log("[Lazy Worker] Elektronisch checkbox not found");const f=o.business||o.unternehmen||o.firma||p("business")||p("unternehmen");f&&e.company?m(f,e.company)&&l++:console.log("[Lazy Worker] Business/Company field not found");let y=null;for(const[t,r]of Object.entries(o))if(t.includes("postal")||t.includes("city")||t.includes("plz")||t.includes("ort")){y=r,console.log("[Lazy Worker] Found PLZ/City field with label:",t);break}if(y||(y=p("postal")||p("plz")||p("city")),y){const t=[e.location?.postalCode||e.location?.plz,e.location?.city].filter(Boolean).join(" ");t&&m(y,t)&&l++}else console.log("[Lazy Worker] PLZ/City field not found. Available fields:",Object.keys(o));const z=o["job title"]||o.stellenbezeichnung||o.stelle||p("job title")||p("stelle");z&&e.position?m(z,e.position)&&l++:console.log("[Lazy Worker] Job title field not found");const C=o["link to online form"]||o["link zum online-formular"]||o.link||p("link")||p("online");C&&e.sourceUrl?m(C,e.sourceUrl)&&l++:console.log("[Lazy Worker] Link field not found");const E=document.querySelectorAll('mat-radio-button, input[type="radio"]');console.log("[Lazy Worker] Found",E.length,"radio elements");let w=!1,x=!1,k=!1;for(const t of E){const r=t.textContent?.trim().toLowerCase()||"",s=(t.closest("label")||t.parentElement)?.textContent?.trim().toLowerCase()||"",d=r+" "+s;console.log("[Lazy Worker] Radio:",t.tagName,d.substring(0,50)),!w&&(d==="no"||d==="nein"||d.includes("no")&&!d.includes("noch")||d.includes("nein")&&!d.includes("noch"))&&(t.click(),l++,w=!0,console.log("[Lazy Worker] Clicked No/Nein")),!x&&(d.includes("full-time")||d.includes("full time")||d.includes("vollzeit"))&&(t.click(),l++,x=!0,console.log("[Lazy Worker] Clicked Vollzeit")),!k&&(d.includes("still open")||d.includes("noch offen")||d.includes("pending")||d.includes("ausstehend"))&&(t.click(),l++,k=!0,console.log("[Lazy Worker] Clicked Noch offen"))}w||console.log("[Lazy Worker] Nein radio not found"),x||console.log("[Lazy Worker] Vollzeit radio not found"),k||console.log("[Lazy Worker] Noch offen radio not found"),console.log("[Lazy Worker] Total fields filled:",l),l>0?L(`\u2713 ${l} Felder ausgef\xFCllt!`):L("\u26A0 Keine Felder gefunden - bitte manuell ausf\xFCllen")}function L(e){const n=document.querySelector(".lw-toast");n&&n.remove();const l=document.createElement("div");l.className="lw-toast",l.textContent=e,document.body.appendChild(l),setTimeout(()=>l.remove(),3500)}})();})();
