// ==UserScript==
// @name         MG Controller
// @namespace    https://magicgarden.gg
// @version      1.0.0
// @description  Full controller (Xbox/PS) support for Magic Garden
// @author       you
// @match        *://magicgarden.gg/r/*
// @match        *://magiccircle.gg/r/*
// @match        *://starweaver.org/r/*
// @match        *://*.discordsays.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

"use strict";(()=>{var E=null;function R(){try{return typeof unsafeWindow<"u"?unsafeWindow:window}catch{return window}}function D(t){if(typeof t!="object"||t===null)return!1;let e=t;return typeof e.get=="function"&&typeof e.set=="function"&&typeof e.sub=="function"}function Se(t){let e=t;for(;e;){let n=e.memoizedState;if(Array.isArray(n)&&n.length===3&&D(n[1]))return n[1];e=e.next}return null}function J(){let e=R().__REACT_DEVTOOLS_GLOBAL_HOOK__;if(typeof e!="object"||e===null)return null;let n=e;if(!(n.renderers instanceof Map))return null;for(let[o]of n.renderers){let r=n.getFiberRoots;if(typeof r!="function")continue;let s=r(o);if(s)for(let i of s){let a=[i.current],d=new Set;for(;a.length>0;){let l=a.pop();if(!l||d.has(l))continue;d.add(l);let c=l;for(let p of["pendingProps","memoizedProps"]){let m=c[p];if(m){let b=m.value;if(D(b))return b}}let u=Se(c.memoizedState);if(u)return u;c.child&&a.push(c.child),c.sibling&&a.push(c.sibling)}}}return null}function O(){if(E)return Promise.resolve(E);let t=J();return t?(E=t,Promise.resolve(t)):new Promise((e,n)=>{let o=Date.now()+15e3,r=setInterval(()=>{let s=J();if(s){clearInterval(r),E=s,e(s);return}Date.now()>o&&(clearInterval(r),n(new Error("[MG-Controller] Could not find Jotai store after waiting.")))},250)})}function Z(t){let e=ke(t);return e!==null?e:Ae(t)}function ke(t){let n=R().jotaiAtomCache;if(typeof n!="object"||n===null)return null;let o=n.cache;if(!(o instanceof Map))return null;for(let[r]of o.entries()){if(typeof r!="object"||r===null)continue;let s=r,i=s.debugLabel,a=typeof s.toString=="function"?s.toString():void 0;if(i===t||a===t)return r}return null}function Ae(t){let n=R().__REACT_DEVTOOLS_GLOBAL_HOOK__;if(typeof n!="object"||n===null)return null;let o=n;if(!(o.renderers instanceof Map))return null;for(let[r]of o.renderers){let s=o.getFiberRoots;if(typeof s!="function")continue;let i=s(r);if(i)for(let a of i){let d=[a.current],l=new Set;for(;d.length>0;){let c=d.pop();if(!c||l.has(c))continue;l.add(c);let u=c,p=Ce(u.memoizedState,t);if(p!==null)return p;u.child&&d.push(u.child),u.sibling&&d.push(u.sibling)}}}return null}function Ce(t,e){let n=t;for(;n;){let o=n.memoizedState;if(Array.isArray(o)&&o.length===3){let r=o[2];if(Y(r,e))return r}if(Y(o,e))return o;n=n.next}return null}function Y(t,e){if(typeof t!="object"||t===null)return!1;let n=t;return n.debugLabel===e||typeof n.toString=="function"&&n.toString()===e}function B(t,e=1){let n=new Map,r=R().__REACT_DEVTOOLS_GLOBAL_HOOK__;if(typeof r!="object"||r===null)return null;let s=r;if(!(s.renderers instanceof Map))return null;for(let[d]of s.renderers){let l=s.getFiberRoots;if(typeof l!="function")continue;let c=l(d);if(c)for(let u of c){let p=[u.current],m=new Set;for(;p.length>0;){let b=p.pop();if(!b||m.has(b))continue;m.add(b);let y=b;Ee(y.memoizedState,t,n),y.child&&p.push(y.child),y.sibling&&p.push(y.sibling)}}}if(e<=1){for(let[d,{value:l}]of n)return{atom:d,value:l};return null}let i=null,a=0;for(let[d,{count:l,value:c}]of n)l>=e&&l>a&&(i={atom:d,value:c},a=l);return i}function Ee(t,e,n){let o=t;for(;o;){let r=o.memoizedState;if(Array.isArray(r)&&r.length===3&&D(r[1])){let[s,,i]=r;if(e(s,i)){let a=n.get(i);n.set(i,{count:(a?.count??0)+1,value:s})}}o=o.next}}var G=null,Re="activeModalAtom",f=null,h=null,Pe=new Set(["seedShop","eggShop","toolShop","inventory","leaderboard","journal","decorShop","stats","petHutch","decorShed","activityLog","destroyCelestialConfirmation","seedSilo","newspaper","billboard","feedingTrough"]);function Le(t){return!!t&&typeof t=="object"&&"worldTextureCache"in t&&"itemSpriteCache"in t}var Q=!1,ee=!1;function te(t){ee||!f||(ee=!0,Q=t.get(f)!==null,t.sub(f,()=>{Q=t.get(f)!==null}))}function N(){return document.querySelector('button[aria-label="Previous [x]"]')!==null}function Me(){f||(f=Z(Re))}function H(){if(h)return;let t=B(e=>Le(e),3);t&&(h=t.atom)}function Te(){if(f)return;let t=B((e,n)=>!("init"in n)&&typeof e=="string"&&Pe.has(e));t&&(f=t.atom)}var Ie=6e4,_e=1e3;async function ne(){let t=await O();if(G=t,console.log("[MG-Controller] Jotai store connected."),Me(),f&&te(t),H(),h){console.log("[MG-Controller] Pet slot atoms ready (immediate scan).");return}return new Promise(e=>{let n=Date.now()+Ie,o=()=>{if(H(),Te(),f&&te(t),h){console.log("[MG-Controller] Pet slot atoms ready (fiber scan)."),e();return}if(Date.now()>=n){console.warn("[MG-Controller] Pet slot atom discovery timed out \u2014 RT/LT cycling disabled."),e();return}setTimeout(o,_e)};o()})}function oe(t,e){if("selectedPetSlotId"in t&&"localPetSlots"in t)return t;if(e<=0)return null;for(let n of Object.keys(t)){let o=t[n];if(!o||typeof o!="object"||Array.isArray(o)||o instanceof Map)continue;let r=oe(o,e-1);if(r)return r}return null}function De(t){for(let e of Object.keys(t)){let n=t[e];if(!(n instanceof Map))continue;let o=n.get("petSlots");if(!o||typeof o!="object")continue;let r=oe(o,2);if(r)return r}return null}async function z(t){if(H(),!h){console.warn("[MG-Controller] RT/LT: game engine atom not yet discovered.");return}try{let n=(await O()).get(h);if(!n||typeof n!="object"){console.warn("[MG-Controller] RT/LT: QuinoaEngine not yet initialized.");return}let o=De(n);if(!o){console.warn("[MG-Controller] RT/LT: PetSlotsView not accessible \u2014 property names may be mangled.");return}let r=o.localPetSlots;if(!Array.isArray(r)||r.length===0)return;let s=r.filter(m=>typeof m?.id=="string").map(m=>m.id);if(s.length===0)return;let i=o.selectedPetSlotId,a=[null,...s],d=i==null?0:a.indexOf(i),l=d===-1?0:d,c=t==="next"?(l+1)%a.length:(l-1+a.length)%a.length,u=a[c];if(typeof o.handleItemSelect!="function"){console.warn("[MG-Controller] RT/LT: handleItemSelect not accessible \u2014 property may be mangled.");return}let p=o.handleItemSelect;u===null?i!=null&&p.call(o,i):p.call(o,u)}catch(e){console.error("[MG-Controller] cyclePetSlot failed:",e)}}function re(){if(!h||!G)return[];let t=G.get(h);if(!t||typeof t!="object")return[];let e=t.app;if(!e||typeof e!="object")return[];let n=e.canvas??e.view,o=e.stage;if(!o||!n)return[];let r=n.getBoundingClientRect(),s=[];return ie(o,r,s),s}function ie(t,e,n){if(t.visible===!1||typeof t.alpha=="number"&&t.alpha<=0)return;if(t.eventMode==="static"&&t.cursor==="pointer")try{let r=t.getBounds();if(r.width>0&&r.height>0){let s=r.x+r.width/2+e.left,i=r.y+r.height/2+e.top;s>=0&&s<=window.innerWidth&&i>=0&&i<=window.innerHeight&&n.push({x:s,y:i})}}catch{}let o=t.children;if(Array.isArray(o))for(let r of o)r&&typeof r=="object"&&ie(r,e,n)}var S={primaryAction:"Primary Action",back:"Close / Back",inventory:"Toggle Inventory",rotateDecor:"Rotate Decor",prevHotbarSlot:"Prev Hotbar / Grow Slot",nextHotbarSlot:"Next Hotbar / Grow Slot",prevPetSlot:"Prev Pet Slot",nextPetSlot:"Next Pet Slot",zoomIn:"Zoom In",zoomOut:"Zoom Out",cursorClick:"Cursor Click",openSettings:"Controller Settings",deselectSlot:"Deselect Hotbar Slot",nextGrowSlot:"Next Grow Slot (dedicated)",prevGrowSlot:"Prev Grow Slot (dedicated)"},x={0:"primaryAction",1:"back",2:"rotateDecor",3:"inventory",4:"prevHotbarSlot",5:"nextHotbarSlot",6:"prevPetSlot",7:"nextPetSlot",9:"openSettings",10:"zoomOut",11:"zoomIn"},se="gemini:controller:bindings";function le(){try{let t=GM_getValue(se,null);if(!t)return{...x};let e=JSON.parse(t),n={...x};for(let[o,r]of Object.entries(e)){let s=parseInt(o,10);!isNaN(s)&&Be(r)&&(n[s]=r)}return n}catch{return{...x}}}function $(t){try{GM_setValue(se,JSON.stringify(t))}catch(e){console.warn("[MG-Controller] Failed to save bindings:",e)}}var Oe=new Set(Object.keys(S));function Be(t){return Oe.has(t)}var ce="gemini:controller:cursorSpeed",F={slow:400,medium:700,fast:1100};function ae(){let t=GM_getValue(ce,"medium");return t==="slow"||t==="medium"||t==="fast"?t:"medium"}function de(t){try{GM_setValue(ce,t)}catch(e){console.warn("[MG-Controller] Failed to save cursor speed:",e)}}var Ge={ArrowUp:{key:"ArrowUp",code:"ArrowUp",keyCode:38},ArrowDown:{key:"ArrowDown",code:"ArrowDown",keyCode:40},ArrowLeft:{key:"ArrowLeft",code:"ArrowLeft",keyCode:37},ArrowRight:{key:"ArrowRight",code:"ArrowRight",keyCode:39}," ":{key:" ",code:"Space",keyCode:32},Escape:{key:"Escape",code:"Escape",keyCode:27},e:{key:"e",code:"KeyE",keyCode:69},r:{key:"r",code:"KeyR",keyCode:82},x:{key:"x",code:"KeyX",keyCode:88},c:{key:"c",code:"KeyC",keyCode:67},"-":{key:"-",code:"Minus",keyCode:189},"=":{key:"=",code:"Equal",keyCode:187},1:{key:"1",code:"Digit1",keyCode:49},2:{key:"2",code:"Digit2",keyCode:50},3:{key:"3",code:"Digit3",keyCode:51},4:{key:"4",code:"Digit4",keyCode:52},5:{key:"5",code:"Digit5",keyCode:53},6:{key:"6",code:"Digit6",keyCode:54},7:{key:"7",code:"Digit7",keyCode:55},8:{key:"8",code:"Digit8",keyCode:56},9:{key:"9",code:"Digit9",keyCode:57}};function ue(t){return Ge[t]??{key:t,code:`Key${t.toUpperCase()}`}}function pe(t){window.dispatchEvent(new KeyboardEvent("keydown",{...ue(t),bubbles:!0,cancelable:!0}))}function j(t){window.dispatchEvent(new KeyboardEvent("keyup",{...ue(t),bubbles:!0,cancelable:!0}))}function g(t){pe(t),requestAnimationFrame(()=>j(t))}var v=1;function ge(){g(String(v))}function K(t){t==="next"?v=v>=9?1:v+1:v=v<=1?9:v-1,g(String(v))}var V={up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight"},w=new Set;function me(t,e){let o={up:e<-.25,down:e>.25,left:t<-.25,right:t>.25};for(let r of Object.keys(o)){let s=o[r];s&&!w.has(r)?(w.add(r),pe(V[r])):!s&&w.has(r)&&(w.delete(r),j(V[r]))}}function W(){for(let t of w)j(V[t]);w.clear()}function fe(t,e){let n=document.elementFromPoint(t,e);if(!n)return;let o={clientX:t,clientY:e,bubbles:!0,cancelable:!0};n.dispatchEvent(new PointerEvent("pointerdown",{...o,pointerId:1})),n.dispatchEvent(new PointerEvent("pointerup",{...o,pointerId:1})),n.dispatchEvent(new MouseEvent("mousedown",o)),n.dispatchEvent(new MouseEvent("mouseup",o)),n.dispatchEvent(new MouseEvent("click",o))}var P=32,be=400,He=2500,Ne=`
<svg xmlns="http://www.w3.org/2000/svg" width="${P}" height="${P}" viewBox="0 0 20 20">
  <polygon points="2,2 2,16 6,12 9,18 11,17 8,11 14,11"
    fill="white" stroke="#222" stroke-width="1.0"/>
</svg>`.trim(),L=class{constructor(e){this.x=window.innerWidth/2;this.y=window.innerHeight/2;this.visible=!1;this.forceVisible=!1;this.hideTimer=null;this.speedPxPerSec=e,this.el=this.createElement(),document.documentElement.appendChild(this.el),this.observer=new MutationObserver(()=>{document.documentElement.lastChild!==this.el&&document.documentElement.appendChild(this.el)}),this.observer.observe(document.documentElement,{childList:!0})}createElement(){let e=document.createElement("div");return e.id="mg-controller-cursor",e.innerHTML=Ne,Object.assign(e.style,{position:"fixed",left:"0px",top:"0px",width:`${P}px`,height:`${P}px`,pointerEvents:"none",zIndex:"2147483647",transform:"translate(-2px, -2px)",display:"none"}),e}update(e,n,o){(Math.abs(e)>.12||Math.abs(n)>.12)&&(this.x=Math.max(0,Math.min(window.innerWidth-1,this.x+e*this.speedPxPerSec*o)),this.y=Math.max(0,Math.min(window.innerHeight-1,this.y+n*this.speedPxPerSec*o)),this.el.style.left=`${this.x}px`,this.el.style.top=`${this.y}px`,this.show(),this.resetHideTimer(be))}setModalOpen(e){this.forceVisible=e,e?(this.show(),this.hideTimer!==null&&(clearTimeout(this.hideTimer),this.hideTimer=null)):!e&&this.visible&&this.hideTimer===null&&this.resetHideTimer(be)}warpTo(e,n){this.x=Math.max(0,Math.min(window.innerWidth-1,e)),this.y=Math.max(0,Math.min(window.innerHeight-1,n)),this.el.style.left=`${this.x}px`,this.el.style.top=`${this.y}px`,this.show(),this.resetHideTimer(He)}click(){fe(this.x,this.y)}getPosition(){return{x:this.x,y:this.y}}setSpeed(e){this.speedPxPerSec=e}isVisible(){return this.visible}show(){this.visible||(this.visible=!0,this.el.style.display="block")}hide(){this.forceVisible||(this.visible=!1,this.el.style.display="none")}resetHideTimer(e){this.hideTimer!==null&&clearTimeout(this.hideTimer),this.hideTimer=setTimeout(()=>{this.hideTimer=null,this.hide()},e)}destroy(){this.hideTimer!==null&&clearTimeout(this.hideTimer),this.observer.disconnect(),this.el.remove()}};var ze={0:"A",1:"B",2:"X",3:"Y",4:"LB",5:"RB",6:"LT",7:"RT",8:"View",9:"Menu",10:"L3",11:"R3",12:"\u2191",13:"\u2193",14:"\u2190",15:"\u2192"},$e={0:"\xD7",1:"\u25CB",2:"\u25A1",3:"\u25B3",4:"L1",5:"R1",6:"L2",7:"R2",8:"Select",9:"Options",10:"L3",11:"R3",12:"\u2191",13:"\u2193",14:"\u2190",15:"\u2192"},Fe={0:"B",1:"A",2:"Y",3:"X",4:"L",5:"R",6:"ZL",7:"ZR",8:"\u2212",9:"+",10:"LS",11:"RS",12:"\u2191",13:"\u2193",14:"\u2190",15:"\u2192"},he={0:"Button 0",1:"Button 1",2:"Button 2",3:"Button 3",4:"L Bumper",5:"R Bumper",6:"L Trigger",7:"R Trigger",8:"Select",9:"Start",10:"L3",11:"R3",12:"\u2191",13:"\u2193",14:"\u2190",15:"\u2192"},Ve={xbox:{name:"Xbox",labels:ze},playstation:{name:"PlayStation",labels:$e},nintendo:{name:"Nintendo",labels:Fe},generic:{name:"Generic",labels:he}};function k(t){let e=je(t.id),n=t.mapping==="standard",{name:o,labels:r}=Ve[e];return{brand:e,name:o,isStandard:n,buttonLabels:n?r:he}}function je(t){let e=t.toLowerCase();return e.includes("054c")||e.includes("dualshock")||e.includes("dualsense")||e.includes("wireless controller")?"playstation":e.includes("045e")||e.includes("xbox")?"xbox":e.includes("057e")||e.includes("pro controller")||e.includes("joy-con")?"nintendo":"generic"}var Ke=["button:not([disabled])","input:not([disabled])","select:not([disabled])",'[tabindex]:not([tabindex="-1"])',"a[href]",'[role="button"]:not([disabled])','[role="menuitem"]:not([disabled])','[role="option"]','[role="tab"]','[role="radio"]','[role="checkbox"]'].join(", ");function ve(t,e,n,o=[]){let r=n.getPosition(),i=[...Array.from(document.querySelectorAll(Ke)).filter(c=>{let u=c.getBoundingClientRect();return u.width>0&&u.height>0}).map(We),...o];if(i.length===0)return!1;let a=0,d=0,l=1/0;for(let c of i){let u=c.x-r.x,p=c.y-r.y;if(u*t+p*e<=0)continue;let b=Math.hypot(u,p),y=Math.abs(u*e-p*t),q=b+y*2;q<l&&(l=q,a=c.x,d=c.y)}return l===1/0?!1:(n.warpTo(a,d),!0)}function We(t){let e=t.getBoundingClientRect();return{x:e.left+e.width/2,y:e.top+e.height/2}}var Xe=0,Ue=1,qe=2,Je=3,A={up:12,down:13,left:14,right:15},Ye=[["up",0,-1],["down",0,1],["left",-1,0],["right",1,0]],Ze=.5,M=.15,X=4,U=5;function ye(){return"getGamepads"in navigator?navigator.getGamepads():[]}var I=class{constructor(e,n,o,r){this.rafId=null;this.prevButtons=new Map;this.prevDpad=new Map;this.lastTimestamp=0;this.connectedGamepadIndex=null;this.currentProfile=null;this.onConnect=e=>{this.connectedGamepadIndex===null&&(this.connectedGamepadIndex=e.gamepad.index,this.currentProfile=k(e.gamepad),this.onProfileChange(this.currentProfile),console.log(`[MG-Controller] Gamepad connected: ${e.gamepad.id}`))};this.onDisconnect=e=>{e.gamepad.index===this.connectedGamepadIndex&&(this.connectedGamepadIndex=null,this.currentProfile=null,this.prevButtons.clear(),this.prevDpad.clear(),W(),this.onProfileChange(null),console.log("[MG-Controller] Gamepad disconnected."))};this.frame=e=>{let n=this.lastTimestamp>0?Math.min((e-this.lastTimestamp)/1e3,.1):.016;this.lastTimestamp=e;let o=this.getActiveGamepad();o&&this.processGamepad(o,n),this.scheduleFrame()};this.bindings=e,this.cursor=n,this.onAction=o,this.onProfileChange=r}updateBindings(e){this.bindings=e}start(){if(this.rafId===null){window.addEventListener("gamepadconnected",this.onConnect),window.addEventListener("gamepaddisconnected",this.onDisconnect);for(let e of ye())if(e){this.connectedGamepadIndex=e.index,this.currentProfile=k(e),this.onProfileChange(this.currentProfile);break}this.scheduleFrame()}}stop(){this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null),window.removeEventListener("gamepadconnected",this.onConnect),window.removeEventListener("gamepaddisconnected",this.onDisconnect),W()}scheduleFrame(){this.rafId=requestAnimationFrame(this.frame)}getActiveGamepad(){return this.connectedGamepadIndex===null?null:ye()[this.connectedGamepadIndex]??null}processGamepad(e,n){e.buttons.length&&(this.processMoveAxes(e),this.processMoveButtons(e),this.processCursorAxes(e,n),this.processActionButtons(e))}processMoveAxes(e){let n=T(e.axes[Xe]??0,M),o=T(e.axes[Ue]??0,M);me(n,o)}processMoveButtons(e){for(let[n,o,r]of Ye){let s=A[n],i=e.buttons[s]?.pressed??!1,a=this.prevDpad.get(s)??!1;i&&!a&&ve(o,r,this.cursor,re()),this.prevDpad.set(s,i)}}processCursorAxes(e,n){let o=T(e.axes[qe]??0,M),r=T(e.axes[Je]??0,M);this.cursor.update(o,r,n)}processActionButtons(e){let n=e.buttons[X]?.pressed??!1,o=e.buttons[U]?.pressed??!1,r=this.prevButtons.get(X)??!1,s=this.prevButtons.get(U)??!1;n&&o&&(!r||!s)&&(this.onAction("deselectSlot"),this.prevButtons.set(X,!0),this.prevButtons.set(U,!0));for(let i=0;i<e.buttons.length;i++){if(i===A.up||i===A.down||i===A.left||i===A.right)continue;let a=e.buttons[i];if(!a)continue;let d=i===6||i===7?a.value>Ze:a.pressed,l=this.prevButtons.get(i)??!1;if(d&&!l){let c=this.bindings[i];c&&this.onAction(c)}this.prevButtons.set(i,d)}}};function T(t,e){return Math.abs(t)<e?0:(t-Math.sign(t)*e)/(1-e)}var we=new Set(["prevHotbarSlot","nextHotbarSlot"]),Qe="deselectSlot",_=class{constructor(e,n,o,r,s){this.panel=null;this.open=!1;this.captureAbort=null;this.bindings={...e},this.currentSpeed=n,this.currentProfile=o,this.onSpeedChange=r,this.onBindingsChange=s,this.host=document.createElement("div"),this.host.id="mg-controller-settings-host",this.shadow=this.host.attachShadow({mode:"open"}),this.shadow.innerHTML=tt+et,document.body.appendChild(this.host),this.shadow.getElementById("mg-ctrl-toggle").addEventListener("click",()=>this.toggle())}toggle(){this.open?this.close():this.openPanel()}openPanel(){this.open||(this.open=!0,this.renderPanel())}close(){this.open&&(this.open=!1,this.captureAbort?.(),this.panel?.remove(),this.panel=null)}setProfile(e){this.currentProfile=e,this.open&&(this.panel?.remove(),this.renderPanel())}refreshBindings(e){this.bindings={...e},this.open&&(this.panel?.remove(),this.renderPanel())}renderPanel(){this.panel?.remove();let e=document.createElement("div");e.id="mg-ctrl-panel";let n=this.currentProfile?`${this.currentProfile.name} \xB7 Connected`:"No controller",o=this.currentProfile?"connected":"none";e.innerHTML=`
      <div class="mg-ctrl-header">
        <span class="mg-ctrl-title">\u{1F3AE} Controller Settings</span>
        <span class="mg-ctrl-badge mg-ctrl-badge--${o}">${n}</span>
        <button id="mg-ctrl-close" aria-label="Close">\u2715</button>
      </div>

      <div class="mg-ctrl-section">
        <div class="mg-ctrl-section-label">Cursor Speed</div>
        <div class="mg-ctrl-speed-row">
          ${["slow","medium","fast"].map(i=>`
            <button class="mg-ctrl-speed-btn${i===this.currentSpeed?" active":""}"
                    data-speed="${i}">${nt(i)}</button>
          `).join("")}
        </div>
      </div>

      ${this.renderFixed()}
      ${this.renderBindings()}

      <div class="mg-ctrl-footer">
        <button id="mg-ctrl-reset">Reset to Defaults</button>
      </div>
    `,this.shadow.appendChild(e),this.panel=e,e.querySelector("#mg-ctrl-close").addEventListener("click",()=>this.close()),e.querySelectorAll(".mg-ctrl-speed-btn").forEach(i=>{i.addEventListener("click",()=>{let a=i.dataset.speed;this.currentSpeed=a,de(a),this.onSpeedChange(a),e.querySelectorAll(".mg-ctrl-speed-btn").forEach(d=>d.classList.remove("active")),i.classList.add("active")})}),e.querySelectorAll("[data-action]").forEach(i=>{i.addEventListener("click",()=>{this.startCapture(i.dataset.action,i)})});let r=e.querySelector("#mg-ctrl-unbound-toggle"),s=e.querySelector("#mg-ctrl-unbound-body");r&&s&&r.addEventListener("click",()=>{let i=s.style.display!=="none";s.style.display=i?"none":"",r.textContent=i?"Show \u25BE":"Hide \u25B4",r.setAttribute("aria-expanded",String(!i))}),e.querySelector("#mg-ctrl-reset").addEventListener("click",()=>{this.captureAbort?.(),this.bindings={...x},$(this.bindings),this.onBindingsChange(this.bindings),this.panel?.remove(),this.renderPanel()})}renderFixed(){let e=this.btnLabel(4),n=this.btnLabel(5);return`
      <div class="mg-ctrl-section">
        <div class="mg-ctrl-section-label">Fixed Controls</div>
        <table class="mg-ctrl-table">
          <tbody>
            <tr>
              <td class="mg-ctrl-input-col"><span class="mg-ctrl-input-text">Left Stick</span></td>
              <td class="mg-ctrl-desc-col">Move character</td>
            </tr>
            <tr>
              <td class="mg-ctrl-input-col"><span class="mg-ctrl-input-text">Right Stick</span></td>
              <td class="mg-ctrl-desc-col">Move cursor</td>
            </tr>
            <tr>
              <td class="mg-ctrl-input-col"><span class="mg-ctrl-input-text">D-Pad</span></td>
              <td class="mg-ctrl-desc-col">Snap cursor to nearest</td>
            </tr>
            <tr>
              <td class="mg-ctrl-input-col">
                ${this.pill(e)}
                <span class="mg-ctrl-chord-plus">+</span>
                ${this.pill(n)}
              </td>
              <td class="mg-ctrl-desc-col">Deselect hotbar slot</td>
            </tr>
          </tbody>
        </table>
      </div>
    `}renderBindings(){let e=this.currentProfile!==null&&!this.currentProfile.isStandard?'<div class="mg-ctrl-warn">\u26A0 Non-standard controller \u2014 button numbers may vary</div>':"",n=Object.entries(this.bindings).map(([l,c])=>[parseInt(l,10),c]).sort((l,c)=>l[0]-c[0]),o=new Set(n.map(([,l])=>l)),r=Object.keys(S).filter(l=>!o.has(l)),s=n.some(([,l])=>we.has(l)),i=n.map(([l,c])=>{let u=S[c],p=we.has(c)?'<span class="mg-ctrl-ctx-marker" title="Context-sensitive">\u2020</span>':"";return`
        <tr>
          <td class="mg-ctrl-input-col">${this.pill(this.btnLabel(l))}</td>
          <td class="mg-ctrl-action-cell" data-action="${c}">${u}${p}</td>
        </tr>
      `}).join(""),a=s?'<div class="mg-ctrl-footnote">\u2020 On multi-harvest plants, LB/RB cycle grow slots instead of hotbar</div>':"",d=r.map(l=>{let c=S[l],p=l===Qe?`<span class="mg-ctrl-subnote">Also active as ${this.btnLabel(4)} + ${this.btnLabel(5)} chord</span>`:"";return`
        <tr>
          <td class="mg-ctrl-input-col">${this.pill("\u2014",!0)}</td>
          <td class="mg-ctrl-action-cell mg-ctrl-action-unbound" data-action="${l}">
            ${c}${p}
          </td>
        </tr>
      `}).join("");return`
      <div class="mg-ctrl-section">
        ${e}
        <div class="mg-ctrl-section-header">
          <span class="mg-ctrl-section-label">Button Bindings</span>
          <span class="mg-ctrl-hint">Click an action to rebind</span>
        </div>
        <table class="mg-ctrl-table">
          <tbody>${i}</tbody>
        </table>
        ${a}
        ${d?`
          <div class="mg-ctrl-section-header mg-ctrl-section-header--sub">
            <span class="mg-ctrl-section-label mg-ctrl-section-label--dim">Unbound</span>
            <button class="mg-ctrl-collapse-btn" id="mg-ctrl-unbound-toggle" aria-expanded="false">Show \u25BE</button>
          </div>
          <div id="mg-ctrl-unbound-body" style="display:none">
            <table class="mg-ctrl-table">
              <tbody>${d}</tbody>
            </table>
          </div>
        `:""}
      </div>
    `}btnLabel(e){return this.currentProfile?.buttonLabels[e]??`Btn ${e}`}pill(e,n=!1){return`<span class="mg-ctrl-pill${n?" mg-ctrl-pill--unbound":""}">${e}</span>`}startCapture(e,n){this.captureAbort?.();let o=n.innerHTML;n.textContent="Press a button\u2026",n.classList.add("capturing");let r=null,s=!1,i=()=>{s||(s=!0,r!==null&&clearInterval(r),n.innerHTML=o,n.classList.remove("capturing"),this.captureAbort=null)};this.captureAbort=i;let a=new Map;for(let d of navigator.getGamepads())if(d){d.buttons.forEach((l,c)=>a.set(c,l.pressed));break}r=setInterval(()=>{for(let d of navigator.getGamepads())if(d){d.buttons.forEach((l,c)=>{l.pressed&&!(a.get(c)??!1)&&!s&&(clearInterval(r),this.applyRebind(e,c,n),s=!0,this.captureAbort=null)});break}},50),setTimeout(()=>{s||i()},5e3)}applyRebind(e,n,o){for(let[r,s]of Object.entries(this.bindings))if(s===e){delete this.bindings[parseInt(r,10)];break}delete this.bindings[n],this.bindings[n]=e,o.classList.remove("capturing"),$(this.bindings),this.onBindingsChange(this.bindings),this.panel?.remove(),this.renderPanel()}destroy(){this.captureAbort?.(),this.host.remove()}},et='<button id="mg-ctrl-toggle" title="Controller Settings">\u{1F3AE}</button>',tt=`
<style>
  :host {
    all: initial;
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483646;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    color: #e0e0e0;
  }

  /* \u2500\u2500 Toggle button \u2500\u2500 */
  #mg-ctrl-toggle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.25);
    background: rgba(10,10,18,0.85);
    color: white;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    line-height: 1;
    backdrop-filter: blur(4px);
  }

  /* \u2500\u2500 Panel \u2500\u2500 */
  #mg-ctrl-panel {
    position: fixed;
    bottom: 70px;
    right: 20px;
    width: 340px;
    max-height: 76vh;
    overflow-y: auto;
    overflow-x: hidden;
    background: rgba(14, 14, 22, 0.97);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.7);
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.15) transparent;
  }

  /* \u2500\u2500 Header \u2500\u2500 */
  .mg-ctrl-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 13px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    position: sticky;
    top: 0;
    background: rgba(14,14,22,0.97);
    z-index: 1;
  }
  .mg-ctrl-title {
    font-weight: 600;
    font-size: 14px;
    flex: 1;
    white-space: nowrap;
  }
  #mg-ctrl-close {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 15px;
    padding: 0 2px;
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.15s;
  }
  #mg-ctrl-close:hover { color: #ccc; }

  /* \u2500\u2500 Badge \u2500\u2500 */
  .mg-ctrl-badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 20px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .mg-ctrl-badge--connected {
    background: rgba(60,200,100,0.15);
    border: 1px solid rgba(60,200,100,0.35);
    color: #70e090;
  }
  .mg-ctrl-badge--none {
    background: rgba(120,120,120,0.12);
    border: 1px solid rgba(120,120,120,0.2);
    color: #777;
  }

  /* \u2500\u2500 Sections \u2500\u2500 */
  /* All horizontal padding lives here \u2014 avoids specificity fights on child elements */
  .mg-ctrl-section {
    padding: 12px 16px 4px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .mg-ctrl-section:last-child { border-bottom: none; }

  .mg-ctrl-section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #555;
    padding-bottom: 8px;
  }
  .mg-ctrl-section-label--dim { color: #444; }

  .mg-ctrl-section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .mg-ctrl-section-header--sub {
    margin-top: 10px;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 10px;
  }

  .mg-ctrl-hint {
    font-size: 11px;
    color: #444;
    font-style: italic;
  }

  .mg-ctrl-collapse-btn {
    background: none;
    border: none;
    color: #484848;
    font-size: 11px;
    font-style: italic;
    font-family: inherit;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s;
  }
  .mg-ctrl-collapse-btn:hover { color: #777; }

  /* \u2500\u2500 Cursor speed \u2500\u2500 */
  .mg-ctrl-speed-row {
    display: flex;
    gap: 6px;
    padding-bottom: 8px;
  }
  .mg-ctrl-speed-btn {
    flex: 1;
    padding: 5px 4px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    color: #888;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .mg-ctrl-speed-btn:hover { background: rgba(255,255,255,0.08); color: #bbb; }
  .mg-ctrl-speed-btn.active {
    background: rgba(90,150,255,0.22);
    border-color: rgba(90,150,255,0.5);
    color: #c0d8ff;
  }

  /* \u2500\u2500 Table \u2500\u2500 */
  .mg-ctrl-table {
    width: 100%;
    border-collapse: collapse;
  }
  .mg-ctrl-table tr:hover td { background: rgba(255,255,255,0.03); }
  .mg-ctrl-table td {
    padding: 5px 8px 5px 0;
    vertical-align: middle;
  }

  /* Input column \u2014 button pills / control names */
  .mg-ctrl-input-col {
    padding-left: 16px;
    width: 1%;            /* shrink to content */
    white-space: nowrap;
  }
  .mg-ctrl-desc-col {
    padding-right: 16px;
    color: #666;
    font-size: 12px;
  }

  /* Plain text input labels (Left Stick / D-Pad etc.) */
  .mg-ctrl-input-text {
    font-size: 12px;
    color: #666;
    font-style: italic;
  }

  /* \u2500\u2500 Button pill \u2500\u2500 */
  .mg-ctrl-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    padding: 2px 7px;
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.22);
    background: rgba(255,255,255,0.09);
    font-size: 12px;
    font-weight: 500;
    color: #d8d8d8;
    white-space: nowrap;
    line-height: 1.5;
    vertical-align: middle;
  }
  .mg-ctrl-pill--unbound {
    border-color: rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    color: #444;
  }
  .mg-ctrl-chord-plus {
    font-size: 11px;
    color: #555;
    margin: 0 3px;
    vertical-align: middle;
  }

  /* \u2500\u2500 Action cell (rebindable) \u2500\u2500 */
  .mg-ctrl-action-cell {
    cursor: pointer;
    color: #8ab4f8;
    padding-right: 16px;
    font-size: 13px;
    transition: color 0.15s;
  }
  .mg-ctrl-action-cell:hover { color: #b8d0ff; }
  .mg-ctrl-action-cell.capturing {
    color: #f0a040;
    font-style: italic;
    cursor: default;
  }
  .mg-ctrl-action-unbound .mg-ctrl-action-cell,
  .mg-ctrl-action-cell.mg-ctrl-action-unbound {
    color: #555;
  }
  .mg-ctrl-action-cell.mg-ctrl-action-unbound:hover { color: #7a9acc; }

  /* \u2500\u2500 Context-sensitive marker \u2500\u2500 */
  .mg-ctrl-ctx-marker {
    font-size: 10px;
    color: #666;
    margin-left: 4px;
    vertical-align: super;
    line-height: 0;
  }

  /* \u2500\u2500 Sub-note (chord note under unbound deselectSlot) \u2500\u2500 */
  .mg-ctrl-subnote {
    display: block;
    font-size: 11px;
    color: #444;
    font-style: italic;
    margin-top: 1px;
  }

  /* \u2500\u2500 Footnote \u2500\u2500 */
  .mg-ctrl-footnote {
    font-size: 11px;
    color: #484848;
    font-style: italic;
    padding: 4px 0 8px;
  }

  /* \u2500\u2500 Non-standard controller warning \u2500\u2500 */
  .mg-ctrl-warn {
    margin-bottom: 8px;
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(255,160,50,0.1);
    border: 1px solid rgba(255,160,50,0.2);
    color: #c8882a;
    font-size: 11px;
  }

  /* \u2500\u2500 Footer \u2500\u2500 */
  .mg-ctrl-footer {
    padding: 10px 16px 14px;
    display: flex;
    justify-content: flex-end;
  }
  #mg-ctrl-reset {
    background: rgba(220,60,60,0.12);
    border: 1px solid rgba(220,60,60,0.28);
    color: #cc7070;
    padding: 5px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.15s;
  }
  #mg-ctrl-reset:hover { background: rgba(220,60,60,0.22); }
</style>
`;function nt(t){return t.charAt(0).toUpperCase()+t.slice(1)}var C=null,xe=null;async function ot(t){switch(t){case"primaryAction":{C?.isVisible()?C.click():g(" ");break}case"back":g("Escape");break;case"inventory":g("e");break;case"rotateDecor":g("r");break;case"prevHotbarSlot":N()?g("x"):K("prev");break;case"nextHotbarSlot":N()?g("c"):K("next");break;case"prevPetSlot":await z("prev");break;case"nextPetSlot":await z("next");break;case"zoomIn":g("=");break;case"zoomOut":g("-");break;case"cursorClick":C?.click();break;case"openSettings":xe?.();break;case"deselectSlot":ge();break;case"nextGrowSlot":g("c");break;case"prevGrowSlot":g("x");break}}function rt(){if(!("getGamepads"in navigator))return null;for(let t of navigator.getGamepads())if(t)return k(t);return null}async function it(){console.log("[MG-Controller] Booting\u2026"),ne();let t=le(),e=ae(),n=new L(F[e]);C=n;let o=rt(),r=new _(t,e,o,i=>{n.setSpeed(F[i])},i=>{s.updateBindings(i)});xe=()=>r.toggle();let s=new I(t,n,ot,i=>r.setProfile(i));s.start(),window.__mgController={destroy(){s.stop(),n.destroy(),r.destroy(),C=null,delete window.__mgController,console.log("[MG-Controller] Destroyed.")}},console.log("[MG-Controller] Ready. Press Start / Options to open settings.")}it();})();
