(()=>{(function(){if(!window.location.href.includes("work-efforts"))return;console.log("[Lazy Worker] job-room.ch form filler loaded"),setTimeout(C,2e3);function C(){W()}function W(){const e=document.getElementById("lw-float-btn");e&&e.remove();const l=document.createElement("div");l.id="lw-float-btn",l.innerHTML=`
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
    `,document.body.appendChild(l),document.getElementById("lw-trigger").addEventListener("click",S),document.getElementById("lw-panel-close").addEventListener("click",k)}function S(){const e=document.getElementById("lw-panel");e.classList.toggle("active"),e.classList.contains("active")&&q()}function k(){document.getElementById("lw-panel").classList.remove("active")}async function q(){const e=document.getElementById("lw-panel-content");try{if(!chrome?.storage?.local)throw new Error("Chrome storage not available");console.log("[Lazy Worker] Loading applications from storage...");const l=await chrome.storage.local.get("applications");console.log("[Lazy Worker] Storage result:",l);const i=l.applications||[];if(i.length===0){e.innerHTML='<div class="lw-empty">Keine Bewerbungen gespeichert.<br>Erfasse zuerst Jobs!</div>';return}i.sort((a,n)=>new Date(n.appliedAt)-new Date(a.appliedAt)),e.innerHTML=i.map(a=>`
        <div class="lw-app-item" data-id="${a.id}">
          <div class="lw-app-company">${a.company||"Unbekannt"}</div>
          <div class="lw-app-position">${a.position||"-"}</div>
          <div class="lw-app-meta">${T(a.appliedAt)} \u2022 ${a.location?.plz||""} ${a.location?.city||""}</div>
        </div>
      `).join(""),e.querySelectorAll(".lw-app-item").forEach(a=>{a.addEventListener("click",()=>{const n=i.find(c=>c.id===a.dataset.id);n&&(A(n),k())})})}catch(l){console.error("[Lazy Worker] Error loading applications:",l),console.error("[Lazy Worker] Error details:",l.message,l.stack),e.innerHTML=`<div class="lw-empty">Fehler beim Laden<br><small>${l.message||"Unbekannter Fehler"}</small></div>`}}function T(e){if(!e)return"";const[l,i,a]=e.split("-");return`${a}.${i}.${l}`}function b(e,l){return!e||l===void 0||l===null?!1:(e.focus(),e.value="",e.value=l,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),e.dispatchEvent(new KeyboardEvent("keyup",{bubbles:!0})),e.dispatchEvent(new Event("blur",{bubbles:!0})),console.log("[Lazy Worker] Set value:",e.placeholder||e.name,"=",l),!0)}function B(e){return e?(e.focus(),e.click(),e.checked=!0,e.dispatchEvent(new Event("change",{bubbles:!0})),e.dispatchEvent(new Event("click",{bubbles:!0})),console.log("[Lazy Worker] Clicked:",e.id||e.name||e.value),!0):!1}function p(e){const l=e.toLowerCase(),i=document.querySelectorAll("input");for(const c of i)if((c.placeholder||"").toLowerCase().includes(l))return c;const a=document.querySelectorAll("mat-label, label, .mat-form-field-label, span");for(const c of a)if((c.textContent||"").toLowerCase().trim().includes(l)){const w=c.closest("mat-form-field, .mat-form-field, .form-group, .field");if(w){const f=w.querySelector("input");if(f)return f}const m=c.parentElement;if(m){const f=m.querySelector("input");if(f)return f}}const n=document.querySelectorAll('input[type="text"], input:not([type])');for(const c of n){const u=c.closest(".mat-form-field, mat-form-field, .form-field, .form-group");if(u&&u.textContent.toLowerCase().includes(l))return c}return null}function I(e){const l=document.querySelectorAll("label");for(const n of l)if(n.textContent.toLowerCase().includes(e.toLowerCase())){const c=n.querySelector('input[type="checkbox"]');if(c)return c;if(n.htmlFor){const u=document.getElementById(n.htmlFor);if(u&&u.type==="checkbox")return u}}const i=document.body.innerText,a=document.querySelectorAll('input[type="checkbox"]');for(const n of a){const c=n.closest("label, div, span, li");if(c&&c.textContent.toLowerCase().includes(e.toLowerCase()))return n}return null}function $(e){const l=document.querySelectorAll("label");for(const a of l)if(a.textContent.trim().toLowerCase()===e.toLowerCase()){const n=a.querySelector('input[type="radio"]');if(n)return n;if(a.htmlFor){const c=document.getElementById(a.htmlFor);if(c&&c.type==="radio")return c}}const i=document.querySelectorAll('input[type="radio"]');for(const a of i){const n=a.closest("label, div, li");if(n&&n.textContent.trim().toLowerCase()===e.toLowerCase())return a}return null}async function A(e){console.log("[Lazy Worker] Filling form with:",e),console.log("[Lazy Worker] Scanning page for form elements...");const l=document.querySelectorAll("input");console.log("[Lazy Worker] Found",l.length,"input elements"),l.forEach((t,o)=>{const s=t.closest("mat-form-field")||t.parentElement,r=s?.querySelector("mat-label, label");console.log(`[Lazy Worker] Input ${o}:`,{type:t.type,id:t.id,name:t.name,placeholder:t.placeholder,label:r?.textContent?.trim(),parentText:s?.textContent?.substring(0,50)})});let i=0;await new Promise(t=>setTimeout(t,500));const a=document.querySelectorAll("mat-form-field");console.log("[Lazy Worker] Found",a.length,"mat-form-field elements");const n={};a.forEach(t=>{const o=t.querySelector("mat-label, label, .mat-form-field-label"),s=t.querySelector("input, textarea");if(o&&s){const r=o.textContent.trim().toLowerCase();n[r]=s,console.log("[Lazy Worker] Mapped field:",r,"\u2192",s.tagName)}});const c=n.date||n.datum||p("date")||p("datum");if(c&&e.appliedAt){const[t,o,s]=e.appliedAt.split("-");b(c,`${s}.${o}.${t}`)&&i++}else console.log("[Lazy Worker] Date field not found");let u=!1;async function w(t){console.log("[Lazy Worker] Attempting to click mat-checkbox...");const o=t.querySelector('input[type="checkbox"]'),s=t.querySelector("label");if(s){const r=new MouseEvent("mousedown",{bubbles:!0,cancelable:!0,view:window}),d=new MouseEvent("mouseup",{bubbles:!0,cancelable:!0,view:window}),F=new MouseEvent("click",{bubbles:!0,cancelable:!0,view:window});s.dispatchEvent(r),s.dispatchEvent(d),s.dispatchEvent(F),console.log("[Lazy Worker] Dispatched mouse events on label")}if(await new Promise(r=>setTimeout(r,50)),o&&!o.checked){const r=t.querySelector(".mat-mdc-checkbox-touch-target, .mdc-checkbox__native-control");r&&(r.click(),console.log("[Lazy Worker] Clicked touch target"))}if(await new Promise(r=>setTimeout(r,50)),o&&!o.checked){const r=t.querySelector(".mat-mdc-checkbox-ripple, .mat-checkbox-inner-container, .mdc-checkbox");r&&(r.click(),console.log("[Lazy Worker] Clicked ripple container"))}if(await new Promise(r=>setTimeout(r,50)),o&&!o.checked&&(o.focus(),o.click(),o.checked=!0,["change","input","click"].forEach(r=>{o.dispatchEvent(new Event(r,{bubbles:!0}))}),t.dispatchEvent(new Event("change",{bubbles:!0})),console.log("[Lazy Worker] Set input directly with events")),await new Promise(r=>setTimeout(r,50)),o&&!o.checked){o.checked=!0,t.classList.add("mat-mdc-checkbox-checked","mat-checkbox-checked"),t.setAttribute("aria-checked","true");const r=t.querySelector("[formcontrolname], [ng-reflect-model]");r&&r.dispatchEvent(new Event("change",{bubbles:!0})),console.log("[Lazy Worker] Forced checked state via classes")}setTimeout(()=>{o&&console.log("[Lazy Worker] Checkbox final state:",o.checked)},200)}const m=document.querySelectorAll("mat-checkbox");console.log("[Lazy Worker] Found",m.length,"mat-checkbox elements");for(const t of m){const o=t.textContent?.toLowerCase()||"";if(console.log("[Lazy Worker] mat-checkbox text:",o.substring(0,50)),o.includes("elektron")||o.includes("electronic")){await w(t),i++,u=!0,console.log("[Lazy Worker] Processed elektronisch checkbox");break}}if(!u){const t=document.querySelectorAll('mat-checkbox, .mat-checkbox, [type="checkbox"]');for(const o of t){const s=o.closest("div, label, span, li")||o.parentElement;if(s&&(s.textContent?.toLowerCase().includes("elektron")||s.textContent?.toLowerCase().includes("electronic"))){const r=o.querySelector?o.querySelector('input[type="checkbox"]'):o;if(r){r.click(),r.checked=!0,r.dispatchEvent(new Event("change",{bubbles:!0})),i++,u=!0,console.log("[Lazy Worker] Found checkbox via fallback");break}}}}u||console.log("[Lazy Worker] Elektronisch checkbox not found");const f=n.business||n.unternehmen||n.firma||p("business")||p("unternehmen");f&&e.company?b(f,e.company)&&i++:console.log("[Lazy Worker] Business/Company field not found");let g=null;for(const[t,o]of Object.entries(n))if(t.includes("postal")||t.includes("city")||t.includes("plz")||t.includes("ort")){g=o,console.log("[Lazy Worker] Found PLZ/City field with label:",t);break}if(g||(g=p("postal")||p("plz")||p("city")),g){const t=[e.location?.plz,e.location?.city].filter(Boolean).join(" ");t&&b(g,t)&&i++}else console.log("[Lazy Worker] PLZ/City field not found. Available fields:",Object.keys(n));const L=n["job title"]||n.stellenbezeichnung||n.stelle||p("job title")||p("stelle");L&&e.position?b(L,e.position)&&i++:console.log("[Lazy Worker] Job title field not found");const z=n["link to online form"]||n["link zum online-formular"]||n.link||p("link")||p("online");z&&e.sourceUrl?b(z,e.sourceUrl)&&i++:console.log("[Lazy Worker] Link field not found");const E=document.querySelectorAll('mat-radio-button, input[type="radio"]');console.log("[Lazy Worker] Found",E.length,"radio elements");let h=!1,y=!1,x=!1;for(const t of E){const o=t.textContent?.trim().toLowerCase()||"",r=(t.closest("label")||t.parentElement)?.textContent?.trim().toLowerCase()||"",d=o+" "+r;console.log("[Lazy Worker] Radio:",t.tagName,d.substring(0,50)),!h&&(d==="no"||d==="nein"||d.includes("no")&&!d.includes("noch")||d.includes("nein")&&!d.includes("noch"))&&(t.click(),i++,h=!0,console.log("[Lazy Worker] Clicked No/Nein")),!y&&(d.includes("full-time")||d.includes("full time")||d.includes("vollzeit"))&&(t.click(),i++,y=!0,console.log("[Lazy Worker] Clicked Vollzeit")),!x&&(d.includes("still open")||d.includes("noch offen")||d.includes("pending")||d.includes("ausstehend"))&&(t.click(),i++,x=!0,console.log("[Lazy Worker] Clicked Noch offen"))}h||console.log("[Lazy Worker] Nein radio not found"),y||console.log("[Lazy Worker] Vollzeit radio not found"),x||console.log("[Lazy Worker] Noch offen radio not found"),console.log("[Lazy Worker] Total fields filled:",i),i>0?v(`\u2713 ${i} Felder ausgef\xFCllt!`):v("\u26A0 Keine Felder gefunden - bitte manuell ausf\xFCllen")}function v(e){const l=document.querySelector(".lw-toast");l&&l.remove();const i=document.createElement("div");i.className="lw-toast",i.textContent=e,document.body.appendChild(i),setTimeout(()=>i.remove(),3500)}})();})();
