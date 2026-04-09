(()=>{function m(){let t=document.querySelectorAll('script[type="application/ld+json"]');for(let e of t)try{let o=JSON.parse(e.textContent),n=Array.isArray(o)?o:[o];for(let r of n){if(r["@type"]==="JobPosting")return d(r);if(r["@graph"]){for(let c of r["@graph"])if(c["@type"]==="JobPosting")return d(c)}}}catch{continue}return null}function d(t){let e={company:"",position:"",location:{street:"",number:"",postalCode:"",city:"",country:"Schweiz"},workload:"vollzeit"};if(t.hiringOrganization&&(e.company=t.hiringOrganization.name||t.hiringOrganization.legalName||(typeof t.hiringOrganization=="string"?t.hiringOrganization:"")),e.position=t.title||t.name||"",t.jobLocation){let o=Array.isArray(t.jobLocation)?t.jobLocation[0]:t.jobLocation;if(o.address){let n=o.address;e.location.street=n.streetAddress||"",e.location.postalCode=n.postalCode||"",e.location.city=n.addressLocality||"",e.location.country=n.addressCountry||"Schweiz",e.location.country==="CH"&&(e.location.country="Schweiz"),e.location.country==="DE"&&(e.location.country="Deutschland")}}if(t.employmentType){let o=Array.isArray(t.employmentType)?t.employmentType[0]:t.employmentType;o&&(o.toLowerCase().includes("part")||o.toLowerCase().includes("teil"))&&(e.workload="teilzeit")}return e}function z(t,e=document){let o=e.querySelector(t);return o?o.textContent.trim():""}function i(t,e=document){for(let o of t){let n=z(o,e);if(n)return n}return""}function f(t){if(!t)return{postalCode:"",city:"",country:"Schweiz"};let e=t.replace(/\s*\(.*?\)\s*/g,"").replace(/,\s*(CH|Schweiz|Switzerland)\s*$/i,"").replace(/,\s*[A-Z]{2}\s*$/i,"").trim(),o=e.match(/^(\d{4})\s+(.+)$/);if(o)return{postalCode:o[1],city:o[2].trim(),country:"Schweiz"};let n=e.match(/^(.+?),?\s+(\d{4})$/);return n?{postalCode:n[2],city:n[1].trim(),country:"Schweiz"}:{postalCode:"",city:e,country:"Schweiz"}}function y(t){if(!t)return"vollzeit";let e=t.toLowerCase(),o=e.match(/(\d{1,3})\s*%/);return o&&parseInt(o[1])<100||["teilzeit","part-time","part time","parttime","pensum"].some(r=>e.includes(r))?"teilzeit":"vollzeit"}function w(t){return t?t.replace(/\s+/g," ").replace(/[\n\r\t]/g," ").replace(/\s*\|\s*.*/g,"").replace(/\s*-\s*Jobs?.*/gi,"").replace(/\s*Karriere.*$/gi,"").replace(/^Jobs?\s*(bei|at|@)\s*/gi,"").trim().substring(0,100):""}function g(t){return t?t.replace(/\s+/g," ").replace(/[\n\r\t]/g," ").replace(/\s*\([mwfd/]+\)\s*/gi,"").replace(/\s*\d+%.*$/g,"").replace(/\s*-\s*\d+%.*$/g,"").trim().substring(0,100):""}async function b(t){return new Promise((e,o)=>{chrome.runtime.sendMessage({action:"saveApplication",data:t},n=>{chrome.runtime.lastError?o(chrome.runtime.lastError):n&&n.success?e(n.application):o(new Error(n?.error||"Failed to save"))})})}function l(t,e="info"){let o=document.querySelector(".lw-capture-notification");o&&o.remove();let n=document.createElement("div");if(n.className=`lw-capture-notification lw-capture-notification-${e}`,n.innerHTML=`
    <span class="lw-capture-icon">\u{1F9A5}</span>
    <span class="lw-capture-message">${t}</span>
  `,!document.getElementById("lw-capture-styles")){let r=document.createElement("style");r.id="lw-capture-styles",r.textContent=`
      .lw-capture-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1f2937;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: lw-slideIn 0.3s ease;
      }

      .lw-capture-notification-success {
        background: #16a34a;
      }

      .lw-capture-notification-error {
        background: #dc2626;
      }

      .lw-capture-icon {
        font-size: 20px;
      }

      @keyframes lw-slideIn {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `,document.head.appendChild(r)}document.body.appendChild(n),setTimeout(()=>{n.style.opacity="0",n.style.transform="translateX(100px)",n.style.transition="all 0.3s ease",setTimeout(()=>n.remove(),300)},4e3)}var h=new Set,a=!1;function x(){console.log("[Lazy Worker] jobs.ch scraper initialized"),S(),T()}function S(){document.addEventListener("click",k,!0)}function k(t){let e=t.target;C(e)&&!a&&(console.log("[Lazy Worker] Apply button clicked"),A())}function C(t){let e=t;for(let o=0;o<5&&e;o++){if(L(e))return e;e=e.parentElement}return null}function L(t){if(!t)return!1;let e=t.tagName?.toLowerCase();if(e!=="button"&&e!=="a"&&!t.getAttribute("role")?.includes("button"))return!1;let o=(t.textContent||"").toLowerCase();if(["bewerben","jetzt bewerben","apply","apply now","quick apply","bewerbung","zur bewerbung"].some(s=>o.includes(s)))return!0;let r=(t.className||"").toLowerCase();return!!(r.includes("apply")||r.includes("bewerbung")||(t.dataset?.action||"").toLowerCase().includes("apply"))}function T(){let t=window.location.href,e=()=>{window.location.href!==t&&(t=window.location.href,a=!1)};setInterval(e,1e3),window.addEventListener("popstate",e)}async function A(){let t=window.location.href;if(h.has(t)){console.log("[Lazy Worker] Already captured this URL");return}a=!0;try{let e=m();if(e||(e=j()),!e||!e.company){console.log("[Lazy Worker] Could not extract job data"),a=!1;return}let o={appliedAt:new Date().toISOString().split("T")[0],company:e.company,position:e.position||"Position nicht angegeben",location:e.location||{street:"",number:"",postalCode:"",city:"",country:"Schweiz"},method:"elektronisch",workload:e.workload||"vollzeit",ravAssignment:!1,result:"offen",sourceUrl:t,sourceSite:v()};await b(o),h.add(t),l(`Bewerbung erfasst: ${o.company}`,"success"),console.log("[Lazy Worker] Application captured:",o)}catch(e){console.error("[Lazy Worker] Error capturing application:",e),l("Fehler beim Erfassen der Bewerbung","error")}finally{a=!1}}function j(){let t={company:"",position:"",location:{street:"",number:"",postalCode:"",city:"",country:"Schweiz"},workload:"vollzeit"},e=['[data-cy="company-name"]','[data-testid="company-name"]',".company-name",".employer-name",'a[href*="/firma/"]',".job-company","h2.company",'[class*="CompanyName"]','[class*="company-name"]',".job-header .subtitle",'span[itemprop="hiringOrganization"]'];t.company=w(i(e));let o=['[data-cy="job-title"]','[data-testid="job-title"]',"h1.job-title",'h1[class*="JobTitle"]','h1[class*="title"]',".job-title","h1",'[itemprop="title"]','[class*="job-title"]'];t.position=g(i(o));let r=i(['[data-cy="job-location"]','[data-testid="location"]',".job-location",".location",'[itemprop="jobLocation"]','[class*="Location"]','[class*="location"]','.job-header [class*="location"]']);if(r){let u=f(r);t.location={...t.location,...u}}let s=i(['[data-cy="job-workload"]','[data-testid="workload"]',".workload",".pensum",'[class*="workload"]','[class*="Workload"]','[class*="employment"]']);t.workload=y(s);let p=(document.body.innerText||"").match(/(\d{2,3})\s*%\s*(Pensum|Arbeitszeit)?/i);return p&&parseInt(p[1])<100&&(t.workload="teilzeit"),t}function v(){let t=window.location.hostname.toLowerCase();return t.includes("jobup")?"jobup.ch":t.includes("jobs.ch")?"jobs.ch":t}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",x):x();})();
