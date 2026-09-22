(function(){
  if(sessionStorage.getItem('providenceAdminAuth') !== 'true'){window.location.replace('login.html');return;}

  var emptyData={enquiries:[],vendors:[],clients:[],approvedVendors:[],rejected:[]};
  var dataVersion='2';
  function getData(){
    if(localStorage.getItem('providenceAdminDataVersion') !== dataVersion){
      localStorage.setItem('providenceAdminDataVersion',dataVersion);
      localStorage.setItem('providenceAdminData',JSON.stringify(emptyData));
    }
    try{
      var data=JSON.parse(localStorage.getItem('providenceAdminData') || '{}');
      return Object.assign({},emptyData,data);
    }catch(error){return Object.assign({},emptyData);}
  }
  function saveData(data){localStorage.setItem('providenceAdminData',JSON.stringify(data));}
  function esc(value){return String(value == null ? '' : value).replace(/[&<>\"]/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char];});}
  function icon(name){
    if(name==='edit')return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13 6l4 4"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 11v6M14 11v6M8 7l1 13h6l1-13M9 7l1-3h4l1 3"/></svg>';
  }
  function moveRequest(type,id,decision){
    var data=getData(),source=type==='enquiry'?'enquiries':'vendors',target=decision==='approve'?(type==='enquiry'?'clients':'approvedVendors'):'rejected';
    var index=data[source].findIndex(function(item){return item.id===id;});
    if(index<0)return;
    var record=data[source].splice(index,1)[0];
    record.status=decision==='approve'?'Approved':'Rejected';
    record.requestType=type;
    data[target].push(record);
    saveData(data);render();showToast(decision==='approve'?'Request approved':'Request rejected','success');
  }
  function closeModal(){var modal=document.querySelector('.admin-modal-backdrop');if(modal)modal.remove();document.body.classList.remove('admin-modal-open');}
  function showModal(title,content,submitLabel,onSubmit){
    closeModal();
    var backdrop=document.createElement('div');
    backdrop.className='admin-modal-backdrop';
    backdrop.innerHTML='<section class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="adminModalTitle"><button class="admin-modal-close" type="button" aria-label="Close">&times;</button><h2 id="adminModalTitle">'+title+'</h2>'+content+'<div class="admin-modal-actions"><button class="admin-modal-cancel" type="button">Cancel</button><button class="admin-modal-submit" type="button">'+submitLabel+'</button></div></section>';
    document.body.appendChild(backdrop);document.body.classList.add('admin-modal-open');
    var modal=backdrop.querySelector('.admin-modal'),form=modal.querySelector('form');
    if(form)form.addEventListener('submit',function(event){event.preventDefault();if(onSubmit(form))closeModal();});
    modal.querySelector('.admin-modal-submit').addEventListener('click',function(){if(form&&!form.reportValidity())return;if(onSubmit(form))closeModal();});
    backdrop.querySelector('.admin-modal-close').addEventListener('click',closeModal);
    backdrop.querySelector('.admin-modal-cancel').addEventListener('click',closeModal);
    backdrop.addEventListener('click',function(event){if(event.target===backdrop)closeModal();});
    modal.querySelector('input,textarea')?.focus();
  }
  function showToast(message,type){
    var toast=document.createElement('div');toast.className='admin-toast '+(type||'success');toast.setAttribute('role','status');toast.textContent=message;
    document.body.appendChild(toast);requestAnimationFrame(function(){toast.classList.add('is-visible');});
    setTimeout(function(){toast.classList.remove('is-visible');setTimeout(function(){toast.remove();},220);},2800);
  }
  function editRecord(kind,id){
    var data=getData(),records=data[kind],record=records.find(function(item){return item.id===id;});
    if(!record)return;
    var label=kind==='approvedVendors'?'Fleet offered':'Service';
    showModal('Edit '+(kind==='clients'?'client':'vendor'),'<form class="admin-edit-form"><label>Name<input name="name" value="'+esc(record.name)+'" required></label><label>Contact<input name="contact" value="'+esc(record.contact)+'" required></label><label>'+label+'<input name="service" value="'+esc(record.service)+'" required></label><label>Location<input name="location" value="'+esc(record.location)+'" required></label></form>','Save changes',function(form){
      var values=form.elements;
      if(!values.name.value.trim()||!values.contact.value.trim()||!values.service.value.trim()||!values.location.value.trim())return false;
      record.name=values.name.value.trim();record.contact=values.contact.value.trim();record.service=values.service.value.trim();record.location=values.location.value.trim();
      saveData(data);render();showToast('Changes saved','success');return true;
    });
  }
  function deleteRecord(kind,id){
    var data=getData(),record=data[kind].find(function(item){return item.id===id;});
    if(!record)return;
    showModal('Delete record','<div class="admin-delete-message">Delete <strong>'+esc(record.name)+'</strong>? This action cannot be undone.</div>','Delete record',function(){
      data[kind]=data[kind].filter(function(item){return item.id!==id;});
      saveData(data);render();showToast('Record deleted','success');return true;
    });
  }
  function recordActions(kind,id){
    return '<div class="actions"><button class="action icon-action" type="button" data-action="edit" data-kind="'+kind+'" data-id="'+esc(id)+'" aria-label="Edit record" title="Edit record">'+icon('edit')+'</button><button class="action icon-action danger" type="button" data-action="delete" data-kind="'+kind+'" data-id="'+esc(id)+'" aria-label="Delete record" title="Delete record">'+icon('delete')+'</button></div>';
  }
  function render(){
    var data=getData();
    var date=document.querySelector('[data-date]');
    if(date)date.textContent=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
    ['enquiries','vendors','clients','approvedVendors'].forEach(function(key){var node=document.querySelector('[data-summary="'+key+'"]');if(node)node.textContent=String(data[key].length).padStart(2,'0');});
    var queue=document.querySelector('[data-dashboard-queue]');
    if(queue)queue.innerHTML=data.enquiries.length?data.enquiries.slice(0,3).map(function(item){return '<div class="queue-item"><span><b>'+esc(item.name)+'</b><small>'+esc(item.service)+' · '+esc(item.location)+'</small></span><time>'+esc(item.received)+'</time></div>';}).join(''):'<span class="empty-title">No activity yet</span><span>Website submissions will appear in the live queue.</span>';
    var rejectedTable=document.querySelector('[data-rejected-table]');
    if(rejectedTable){
      rejectedTable.querySelector('tbody').innerHTML=data.rejected.length?data.rejected.map(function(item){return '<tr><td><span class="person">'+esc(item.name)+'</span><span class="meta">'+esc(item.contact)+'</span></td><td>'+esc(item.requestType || 'Request')+'</td><td>'+esc(item.service)+'</td><td>'+esc(item.location)+'</td><td><span class="status rejected">Rejected</span></td></tr>';}).join(''):'<tr><td colspan="5" class="empty">No rejected requests.</td></tr>';
    }
    var table=document.querySelector('[data-request-table]');
    if(!table)return;
    var kind=table.getAttribute('data-request-table');
    var records=kind==='enquiries'?data.enquiries:kind==='vendors'?data.vendors:kind==='clients'?data.clients:data.approvedVendors;
    var archive=kind==='clients'||kind==='approved-vendors';
    var body=table.querySelector('tbody');
    body.innerHTML=records.length?records.map(function(item){
      var actions=archive?recordActions(kind==='clients'?'clients':'approvedVendors',item.id):'<div class="actions"><button class="action approve" type="button" data-action="approve" data-id="'+esc(item.id)+'" aria-label="Approve '+esc(item.name)+'" title="Approve">&#10003;</button><button class="action reject" type="button" data-action="reject" data-id="'+esc(item.id)+'" aria-label="Reject '+esc(item.name)+'" title="Reject">&#10005;</button></div>';
      return '<tr><td><span class="person">'+esc(item.name)+'</span><span class="meta">'+esc(item.contact)+'</span></td><td>'+esc(item.service)+'</td><td>'+esc(item.location)+'</td><td>'+esc(item.received)+'</td><td><span class="status '+(archive?'approved':'new')+'">'+(archive?'Approved':'Pending')+'</span></td><td>'+actions+'</td></tr>';
    }).join(''):'<tr><td colspan="6" class="empty">No requests in this view.</td></tr>';
    table.querySelectorAll('[data-action]').forEach(function(button){button.addEventListener('click',function(){var action=button.getAttribute('data-action'),id=button.getAttribute('data-id');if(action==='approve'||action==='reject')moveRequest(kind==='enquiries'?'enquiry':'vendor',id,action);else if(action==='edit')editRecord(button.getAttribute('data-kind'),id);else deleteRecord(button.getAttribute('data-kind'),id);});});
    var count=document.querySelector('[data-count]');if(count)count.textContent=records.length;
  }
  function addAccountNav(){
    var main=document.querySelector('.content');
    if(!main)return;
    var nav=document.querySelector('.admin-topnav');
    if(!nav){nav=document.createElement('nav');nav.className='admin-topnav';main.insertBefore(nav,main.firstChild);}
    nav.setAttribute('aria-label','Workspace navigation');
    nav.innerHTML='<a class="admin-topnav-brand" href="../index.html"><img src="../images/image.png" alt=""><span>Providence</span></a><span class="topnav-context">Operations workspace</span><button class="mobile-menu-toggle" type="button" aria-expanded="false" aria-controls="adminSidebar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span>Menu</span></button>';
  }
  function setupMobileNav(){
    var sidebar=document.querySelector('.sidebar'),nav=document.querySelector('.admin-topnav');
    if(!sidebar||!nav)return;
    sidebar.id='adminSidebar';
    var toggle=nav.querySelector('.mobile-menu-toggle'),overlay=document.createElement('button');
    overlay.className='admin-menu-overlay';overlay.type='button';overlay.setAttribute('aria-label','Close navigation');
    document.body.appendChild(overlay);
    function closeMenu(){sidebar.classList.remove('is-open');document.body.classList.remove('admin-menu-open');toggle.setAttribute('aria-expanded','false');}
    toggle.addEventListener('click',function(){var open=sidebar.classList.toggle('is-open');document.body.classList.toggle('admin-menu-open',open);toggle.setAttribute('aria-expanded',open);});
    overlay.addEventListener('click',closeMenu);
    sidebar.querySelectorAll('a').forEach(function(link){link.addEventListener('click',closeMenu);});
  }
  function addSidebarAccount(){
    var sidebar=document.querySelector('.sidebar');
    if(!sidebar||sidebar.querySelector('.sidebar-account'))return;
    var account=document.createElement('div');
    account.className='sidebar-account';
    account.innerHTML='<button class="sidebar-profile" type="button"><span class="profile-avatar">A</span><span><strong>Admin Profile</strong><small>Control room access</small></span></button><button class="sidebar-signout" type="button" data-signout><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10"/></svg><span>Sign out</span></button>';
    sidebar.appendChild(account);
  }
  addAccountNav();
  addSidebarAccount();
  setupMobileNav();
  var signout=document.querySelector('[data-signout]');
  if(signout)signout.addEventListener('click',function(){sessionStorage.removeItem('providenceAdminAuth');window.location.replace('login.html');});
  render();
})();
