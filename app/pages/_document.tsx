import { Html, Head, Main, NextScript } from "next/document";

const ANIMATIONS_CSS = `
.nm-section-reveal{opacity:0;transform:translateY(20px);transition:opacity 500ms ease-out,transform 500ms ease-out}
.nm-section-revealed{opacity:1;transform:translateY(0)}
@media(prefers-reduced-motion:reduce){.nm-section-reveal{opacity:1;transform:none;transition:none}}
@keyframes nm-dot-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:0.7}}
.nm-dot-pulse{animation:nm-dot-pulse 2.5s ease-in-out infinite}
@media(prefers-reduced-motion:reduce){.nm-dot-pulse{animation:none}}
.nm-navbar-scrolled{border-bottom-color:#d5d7db!important;background-color:var(--nm-bg-scrolled);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:border-bottom-color 250ms ease,background-color 250ms ease}
@media(prefers-reduced-motion:reduce){.nm-navbar-scrolled{backdrop-filter:none;-webkit-backdrop-filter:none;transition:none}}
`;

const ANIMATIONS_JS = `
(function(){
  var reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  function initSectionReveals(){
    var sections=document.querySelectorAll('section.nm-section-reveal');
    if(reduced){
      sections.forEach(function(el){el.classList.add('nm-section-revealed');});
      return;
    }
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting)return;
        entry.target.classList.add('nm-section-revealed');
        entry.target.querySelectorAll('.nm-card').forEach(function(card,i){
          card.style.transitionDelay=(i*120)+'ms';
        });
        observer.unobserve(entry.target);
      });
    },{threshold:0.15});
    sections.forEach(function(el){observer.observe(el);});
  }

  function initNavbarScroll(){
    var header=document.querySelector('header.nm-navbar');
    if(!header)return;
    function update(){
      if(window.scrollY>80){header.classList.add('nm-navbar-scrolled');}
      else{header.classList.remove('nm-navbar-scrolled');}
    }
    var timer=null;
    window.addEventListener('scroll',function(){
      if(timer)return;
      timer=setTimeout(function(){update();timer=null;},100);
    },{passive:true});
    update();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){
      initSectionReveals();
      initNavbarScroll();
    });
  }else{
    initSectionReveals();
    initNavbarScroll();
  }
})();
`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('nm-theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;var t=s==='dark'||(!s&&d)?'dark':'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();` }} />
        <style dangerouslySetInnerHTML={{ __html: ANIMATIONS_CSS }} />
      </Head>
      <body>
        <Main />
        <NextScript />
        <script dangerouslySetInnerHTML={{ __html: ANIMATIONS_JS }} />
      </body>
    </Html>
  );
}
