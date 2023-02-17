const queryString = window.location.search;
document.getElementById("token").value=new URLSearchParams(queryString).get('code');
document.querySelector("form").addEventListener("submit",function(event){
  console.log("sub");
  event.preventDefault();
  const pass = document.getElementById('password').value.trim();
  const conf = document.getElementById('confirm_password').value.trim();
  const token = document.getElementById("token").value.trim();
  const send = {
    password:pass,
    passwordConfirmation: conf,
    code:token
  };
  if(conf === pass && conf.length > 6) {
    fetch(this.action,
    {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(send)
    }).then(res=>res.json()).then(data=>{
      location.href = 'https://dsuapp.igsu.ro/uploads/multumim.html'
    }).catch(err=>{
      console.log(err)
    })
  } else {
     alert("Parola si confiramrea trebuie sa coincida si sa aiba minim 7 caractere");
  }

})
