(function(){
  if(sessionStorage.getItem('providenceAdminAuth') === 'true'){
    window.location.replace('index.html');
    return;
  }
  var form=document.getElementById('adminLogin');
  var error=document.getElementById('loginError');
  form.addEventListener('submit',function(event){
    event.preventDefault();
    var username=document.getElementById('username').value.trim();
    var password=document.getElementById('password').value;
    if(username==='admin' && password==='Providence@2026'){
      sessionStorage.setItem('providenceAdminAuth','true');
      window.location.replace('index.html');
      return;
    }
    error.classList.add('show');
  });
})();
