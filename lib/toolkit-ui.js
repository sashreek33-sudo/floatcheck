// Shared mobile nav toggle - loaded by every page alongside toolkit-ui.css.
// Turns the burger button into a dropdown for .toolkit-nav-tools/.toolkit-nav-actions
// by toggling a `.nav-open` class on the containing `.toolkit-nav`.
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.toolkit-nav-burger').forEach(function(btn){
    btn.addEventListener('click', function(){
      var nav = btn.closest('.toolkit-nav');
      if (!nav) return;
      var open = nav.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  document.querySelectorAll('.toolkit-nav-tool, .toolkit-nav-login, .toolkit-nav-cta').forEach(function(el){
    el.addEventListener('click', function(){
      var nav = el.closest('.toolkit-nav');
      if (nav) nav.classList.remove('nav-open');
    });
  });
});
