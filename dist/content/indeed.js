(()=>{function f(){let e=document.querySelectorAll('script[type="application/ld+json"]');for(let o of e)try{let t=JSON.parse(o.textContent),n=Array.isArray(t)?t:[t];for(let r of n){if(r["@type"]==="JobPosting")return m(r);if(r["@graph"]){for(let i of r["@graph"])if(i["@type"]==="JobPosting")return m(i)}}}catch{continue}return null}function m(e){let o={company:"",position:"",location:{street:"",number:"",postalCode:"",city:"",country:"Schweiz"},workload:"vollzeit"};if(e.hiringOrganization&&(o.company=e.hiringOrganization.name||e.hiringOrganization.legalName||(typeof e.hiringOrganization=="string"?e.hiringOrganization:"")),o.position=e.title||e.name||"",e.jobLocation){let t=Array.isArray(e.jobLocation)?e.jobLocation[0]:e.jobLocation;if(t.address){let n=t.address;o.location.street=n.streetAddress||"",o.location.postalCode=n.postalCode||"",o.location.city=n.addressLocality||"",o.location.country=n.addressCountry||"Schweiz",o.location.country==="CH"&&(o.location.country="Schweiz"),o.location.country==="DE"&&(o.location.country="Deutschland")}}if(e.employmentType){let t=Array.isArray(e.employmentType)?e.employmentType[0]:e.employmentType;t&&(t.toLowerCase().includes("part")||t.toLowerCase().includes("teil"))&&(o.workload="teilzeit")}return o}function z(e,o=document){let t=o.querySelector(e);return t?t.textContent.trim():""}function s(e,o=document){for(let t of e){let n=z(t,o);if(n)return n}return""}function y(e){if(!e)return{postalCode:"",city:"",country:"Schweiz"};let o=e.replace(/\s*\(.*?\)\s*/g,"").replace(/,\s*(CH|Schweiz|Switzerland)\s*$/i,"").replace(/,\s*[A-Z]{2}\s*$/i,"").trim(),t=o.match(/^(\d{4})\s+(.+)$/);if(t)return{postalCode:t[1],city:t[2].trim(),country:"Schweiz"};let n=o.match(/^(.+?),?\s+(\d{4})$/);return n?{postalCode:n[2],city:n[1].trim(),country:"Schweiz"}:{postalCode:"",city:o,country:"Schweiz"}}function b(e){return e?e.replace(/\s+/g," ").replace(/[\n\r\t]/g," ").replace(/\s*\|\s*.*/g,"").replace(/\s*-\s*Jobs?.*/gi,"").replace(/\s*Karriere.*$/gi,"").replace(/^Jobs?\s*(bei|at|@)\s*/gi,"").trim().substring(0,100):""}function h(e){return e?e.replace(/\s+/g," ").replace(/[\n\r\t]/g," ").replace(/\s*\([mwfd/]+\)\s*/gi,"").replace(/\s*\d+%.*$/g,"").replace(/\s*-\s*\d+%.*$/g,"").trim().substring(0,100):""}async function g(e){if(!chrome?.runtime?.sendMessage)throw new Error("Extension wurde aktualisiert. Bitte Seite neu laden (Ctrl+R).");return new Promise((o,t)=>{try{chrome.runtime.sendMessage({action:"saveApplication",data:e},n=>{chrome.runtime.lastError?t(new Error(chrome.runtime.lastError.message||"Extension-Verbindung verloren. Bitte Seite neu laden.")):n&&n.success?o(n.application):t(new Error(n?.error||"Failed to save"))})}catch{t(new Error("Extension-Verbindung verloren. Bitte Seite neu laden (Ctrl+R)."))}})}function p(e,o="info"){let t=document.querySelector(".lw-capture-notification");t&&t.remove();let n=document.createElement("div");if(n.className=`lw-capture-notification lw-capture-notification-${o}`,n.innerHTML=`
    <span class="lw-capture-icon">\u{1F9A5}</span>
    <span class="lw-capture-message">${e}</span>
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
    `,document.head.appendChild(r)}document.body.appendChild(n),setTimeout(()=>{n.style.opacity="0",n.style.transform="translateX(100px)",n.style.transition="all 0.3s ease",setTimeout(()=>n.remove(),300)},4e3)}function w(e,o){let t;return function(...r){let i=()=>{clearTimeout(t),e(...r)};clearTimeout(t),t=setTimeout(i,o)}}var x=new Set,l=!1;function C(){console.log("[Lazy Worker] Indeed scraper initialized"),S(),j()}function S(){document.addEventListener("click",L,!0)}function L(e){let o=e.target;k(o)&&!l&&(console.log("[Lazy Worker] Indeed Apply button clicked"),T())}function k(e){let o=e;for(let t=0;t<6&&o;t++){if(v(o))return o;o=o.parentElement}return null}function v(e){if(!e)return!1;let o=e.tagName?.toLowerCase();if(o!=="button"&&o!=="a"&&o!=="span")return!1;let t=(e.textContent||"").toLowerCase().trim(),n=(e.className||"").toLowerCase(),r=(e.id||"").toLowerCase();return!!(["apply","jetzt bewerben","bewerben","apply now","apply on company site","auf unternehmenswebsite bewerben"].some(a=>t.includes(a))||n.includes("apply")||n.includes("bewerbung")||r.includes("apply")||(e.dataset?.tnElement||"").toLowerCase().includes("apply"))}function j(){new MutationObserver(w(()=>{},500)).observe(document.body,{childList:!0,subtree:!0})}async function T(){let e=window.location.href,o=A(e);if(o&&x.has(o)){console.log("[Lazy Worker] Already captured this job");return}l=!0;try{let t=f();if((!t||!t.company)&&(t=I()),!t||!t.company){console.log("[Lazy Worker] Could not extract job data"),l=!1;return}let n={appliedAt:new Date().toISOString().split("T")[0],company:t.company,position:t.position||"Position nicht angegeben",location:t.location||{street:"",number:"",postalCode:"",city:"",country:"Schweiz"},method:"elektronisch",workload:t.workload||"vollzeit",ravAssignment:!1,result:"offen",sourceUrl:e,sourceSite:"indeed"};await g(n),o&&x.add(o),p(`Bewerbung erfasst: ${n.company}`,"success"),console.log("[Lazy Worker] Indeed application captured:",n)}catch(t){console.error("[Lazy Worker] Error capturing application:",t),p("Fehler beim Erfassen der Bewerbung","error")}finally{l=!1}}function A(e){let o=e.match(/[?&]jk=([^&]+)/);if(o)return o[1];let t=e.match(/\/viewjob.*[?&]jk=([^&]+)/);return t?t[1]:null}function I(){let e={company:"",position:"",location:{street:"",number:"",postalCode:"",city:"",country:"Schweiz"},workload:"vollzeit"},o=['[data-testid="inlineHeader-companyName"] a','[data-testid="inlineHeader-companyName"]','[data-company-name="true"]',".jobsearch-InlineCompanyRating-companyHeader a",".jobsearch-InlineCompanyRating-companyHeader",".icl-u-lg-mr--sm a",".jobsearch-CompanyInfoContainer a",".jobsearch-JobInfoHeader-companyNameLink",'div[data-testid="job-header"] a',".css-1h46us2",'[class*="CompanyName"]'];e.company=b(s(o));let t=['[data-testid="jobsearch-JobInfoHeader-title"]',".jobsearch-JobInfoHeader-title","h1.jobsearch-JobInfoHeader-title",".icl-u-xs-mb--xs h1",'h1[class*="JobTitle"]',".jobsearch-JobComponent-title","h1"];e.position=h(s(t));let r=s(['[data-testid="inlineHeader-companyLocation"]','[data-testid="job-location"]',".jobsearch-JobInfoHeader-subtitle > div:last-child",".icl-u-lg-mr--sm + div",'.jobsearch-CompanyInfoContainer [class*="Location"]','[class*="location"]']);if(r){let a=y(r);e.location={...e.location,...a}}let i=document.querySelector("#jobDetailsSection, .jobsearch-JobDescriptionSection");if(i){let a=i.textContent||"";a.match(/teilzeit|part[\s-]?time/i)&&(e.workload="teilzeit");let c=a.match(/(\d{2,3})\s*%/);if(c){let d=parseInt(c[1]);d<100&&d>=10&&(e.workload="teilzeit")}}let u=document.querySelectorAll('[class*="JobType"], [class*="job-type"], .metadata');for(let a of u){let c=a.textContent.toLowerCase();if(c.includes("teilzeit")||c.includes("part-time")||c.includes("part time")){e.workload="teilzeit";break}}return e}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",C):C();})();
