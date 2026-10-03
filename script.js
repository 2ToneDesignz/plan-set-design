const menu = document.querySelector('.menu-button');
menu?.addEventListener('click', () => {
 const expanded = menu.getAttribute('aria-expanded') === 'true';
 menu.setAttribute('aria-expanded', String(!expanded));
 document.querySelector('nav').classList.toggle('open', !expanded);
});
const form = document.getElementById('inquiry');
if(form){
 const selected = new URLSearchParams(location.search).get('service');
 if(selected && [...form.elements.service.options].some(o=>o.value===selected)) form.elements.service.value=selected;
 let draftUrl;
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const result=document.getElementById('form-result');
  const button=form.querySelector('button[type="submit"]');
  const files=[...document.getElementById('drawings').files];
  result.hidden=false;
  if(files.reduce((n,f)=>n+f.size,0)>15*1024*1024){result.textContent='Please keep the total attachment size under 15 MB, or send large drawings separately by email.';result.focus();return;}
  if(files.some(f=>! /\.(pdf|dwg|rvt)$/i.test(f.name))){result.textContent='Please choose PDF, DWG, or RVT files.';result.focus();return;}
  button.disabled=true;result.textContent='Preparing your email draft…';
  try{
   const entries=[...new FormData(form).entries()].map(([key,value])=>key+': '+(key==='Service'?form.elements.service.selectedOptions[0].textContent:value));
   const body='Project inquiry — Plan Set Design\n\n'+entries.join('\n\n');
   const boundary='PlanSetBoundary'+Date.now();
   let eml='To: tom@plansetdesign.com\r\nSubject: New residential project inquiry\r\nX-Unsent: 1\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="'+boundary+'"\r\n\r\n';
   const encode=text=>btoa(String.fromCharCode(...new TextEncoder().encode(text)));
   eml+='--'+boundary+'\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n'+encode(body)+'\r\n';
   for(const file of files){
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});
    const name=file.name.replace(/[^a-zA-Z0-9._ -]/g,'_');
    eml+='--'+boundary+'\r\nContent-Type: application/octet-stream; name="'+name+'"\r\nContent-Disposition: attachment; filename="'+name+'"\r\nContent-Transfer-Encoding: base64\r\n\r\n'+data.match(/.{1,76}/g).join('\r\n')+'\r\n';
   }
   eml+='--'+boundary+'--\r\n';
   if(draftUrl) URL.revokeObjectURL(draftUrl);
   draftUrl=URL.createObjectURL(new Blob([eml],{type:'message/rfc822'}));
   result.replaceChildren();
   const p=document.createElement('p');p.textContent='Your draft is ready. Download it, open it in an email application that supports .eml drafts, then review and send. For Gmail, open the email link below and attach your files manually.';
   const download=document.createElement('a');download.className='btn secondary';download.href=draftUrl;download.download='Plan-Set-Design-Project-Inquiry.eml';download.textContent='Download Email Draft';
   const mail=document.createElement('a');mail.className='link';mail.style.display='block';mail.style.marginTop='15px';mail.href='mailto:tom@plansetdesign.com?subject='+encodeURIComponent('New residential project inquiry')+'&body='+encodeURIComponent(body);mail.textContent='Open Email App';
   result.append(p,download,mail);result.focus();
  }catch(e){result.textContent='The draft could not be prepared. Please email your project details and files to tom@plansetdesign.com.';result.focus();}
  finally{button.disabled=false;}
 });
}
