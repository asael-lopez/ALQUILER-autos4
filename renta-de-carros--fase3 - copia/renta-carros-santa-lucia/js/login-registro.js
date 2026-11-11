  // Relleno rápido para pruebas
  function fillLogin(email, pass) {
    showForm('login');
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPass').value = pass;
    hideAuthError();
  }

  function showAuthError(msg) {
    const alertBox = document.getElementById('authErrorAlert');
    alertBox.textContent = msg;
    alertBox.classList.add('is-visible');
  }

  function hideAuthError() {
    const alertBox = document.getElementById('authErrorAlert');
    alertBox.classList.remove('is-visible');
  }

  // ---------- Cambio de pestaña login / registro ----------
  function showForm(which){
    const login = document.getElementById('loginForm');
    const register = document.getElementById('registerForm');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const success = document.getElementById('successBox');

    success.classList.remove('is-visible');
    hideAuthError();

    if(which === 'login'){
      login.classList.remove('hidden');
      register.classList.add('hidden');
      tabLogin.classList.add('active');
      tabLogin.setAttribute('aria-selected', 'true');
      tabRegister.classList.remove('active');
      tabRegister.setAttribute('aria-selected', 'false');
    } else {
      register.classList.remove('hidden');
      login.classList.add('hidden');
      tabRegister.classList.add('active');
      tabRegister.setAttribute('aria-selected', 'true');
      tabLogin.classList.remove('active');
      tabLogin.setAttribute('aria-selected', 'false');
    }
  }

  document.querySelector('.card-auth').addEventListener('click', function(e){
    const action = e.target.closest('[data-auth-action]');
    if (!action) return;

    switch (action.dataset.authAction) {
      case 'show-form':
        showForm(action.dataset.form);
        break;
      case 'fill-login':
        fillLogin(action.dataset.email, action.dataset.password);
        document.getElementById('loginForm').requestSubmit();
        break;
      case 'forgot-password':
        alert('Para recuperar tu acceso, contacta a soporte@santalucia.com o utiliza las cuentas de prueba.');
        break;
    }
  });

  // ---------- Mostrar / ocultar contraseña ----------
  document.querySelectorAll('.pass-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const input = document.getElementById(btn.dataset.target);
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.textContent = isPass ? 'Ocultar' : 'Mostrar';
    });
  });

  function setInvalid(el, invalid){
    el.classList.toggle('is-invalid', invalid);
  }

  function isValidEmail(value){
    return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidPhone(value){
    const digits = value.replace(/[^0-9]/g, '');
    return value.length <= 25 &&
      /^\+?[0-9().\s-]+$/.test(value) &&
      digits.length >= 8 &&
      digits.length <= 15;
  }

  // ---------- Validación + envío: LOGIN (Requisitos 4 y 9) ----------
  document.getElementById('loginForm').addEventListener('submit', function(e){
    e.preventDefault();
    hideAuthError();

    const email = document.getElementById('loginEmail');
    const pass = document.getElementById('loginPass');
    const passWrap = pass.closest('.pass-wrap');

    const emailVal = email.value.trim();
    const passVal = pass.value;

    const emailOk = isValidEmail(emailVal);
    const passOk = passVal.trim().length > 0 && passVal.length >= 6 && passVal.length <= 128;

    setInvalid(email, !emailOk);
    passWrap.classList.toggle('is-invalid', !passOk);

    if(!emailOk || !passOk){
      return;
    }

    // Validación real contra los datos registrados en localStorage
    const authResult = DataManager.authenticateUser(emailVal, passVal);

    if (!authResult.ok) {
      showAuthError(authResult.message);
      return;
    }

    // Autenticación correcta
    const user = authResult.user;

    // Ocultar formulario y mostrar confirmación de éxito
    this.classList.add('hidden');
    document.getElementById('successTitle').textContent = `¡Hola, ${user.name}!`;
    document.getElementById('successMsg').textContent = `Has iniciado sesión correctamente con rol: ${user.role.toUpperCase()}. Redirigiendo...`;
    document.getElementById('successBox').classList.add('is-visible');

    setTimeout(() => {
      // Redirigir según corresponda (si es admin puede ir a dashboard o index)
      window.location.href = user.role === 'admin' ? 'dashboard.html' : 'index.html';
    }, 900);
  });

  // ---------- Validación + envío: REGISTRO (Requisitos 4, 5, 6 y 9) ----------
  document.getElementById('registerForm').addEventListener('submit', function(e){
    e.preventDefault();
    hideAuthError();

    const name = document.getElementById('regName');
    const email = document.getElementById('regEmail');
    const phone = document.getElementById('regPhone');
    const role = document.getElementById('regRole');
    const pass = document.getElementById('regPass');
    const pass2 = document.getElementById('regPass2');
    const terms = document.getElementById('acceptTerms');
    const termsError = document.getElementById('termsError');
    const passWrap = pass.closest('.pass-wrap');
    const pass2Wrap = pass2.closest('.pass-wrap');

    const nameVal = name.value.trim();
    const emailVal = email.value.trim();
    const phoneVal = phone.value.trim();
    const roleVal = role ? role.value : 'cliente';
    const passVal = pass.value;
    const pass2Val = pass2.value;

    const nameOk = nameVal.length >= 3 && nameVal.length <= 80 &&
      nameVal.replace(/[^\p{L}]/gu, '').length >= 3;
    const emailOk = isValidEmail(emailVal);
    const phoneOk = isValidPhone(phoneVal);
    const roleOk = !role || ['cliente', 'admin'].includes(roleVal);
    const passOk = passVal.trim().length > 0 && passVal.length >= 6 && passVal.length <= 128;
    const matchOk = pass2Val === passVal && pass2Val.length > 0 && pass2Val.length <= 128;
    const termsOk = terms.checked;

    setInvalid(name, !nameOk);
    setInvalid(email, !emailOk);
    setInvalid(phone, !phoneOk);
    if (role) setInvalid(role, !roleOk);
    passWrap.classList.toggle('is-invalid', !passOk);
    pass2Wrap.classList.toggle('is-invalid', !matchOk);
    termsError.classList.toggle('is-visible', !termsOk);

    if(!nameOk || !emailOk || !phoneOk || !roleOk || !passOk || !matchOk || !termsOk){
      return;
    }

    // Registro en localStorage a través de DataManager
    const regResult = DataManager.registerUser({
      name: nameVal,
      email: emailVal,
      phone: phoneVal,
      password: passVal,
      role: roleVal
    });

    if (!regResult.ok) {
      showAuthError(regResult.message);
      return;
    }

    // Iniciar sesión automáticamente en localStorage
    DataManager.setSession(emailVal);

    this.classList.add('hidden');
    document.getElementById('successTitle').textContent = '¡Cuenta creada con éxito!';
    document.getElementById('successMsg').textContent = `Bienvenido a Santa Lucía, ${nameVal}. Tu cuenta (${roleVal.toUpperCase()}) está lista. Redirigiendo...`;
    document.getElementById('successBox').classList.add('is-visible');

    setTimeout(() => {
      window.location.href = roleVal === 'admin' ? 'dashboard.html' : 'index.html';
    }, 1100);
  });

  // ---------- Carrusel automático de fotos ----------
  (function(){
    const slides = document.querySelectorAll('.carousel-slide');
    if(!slides || slides.length === 0) return;

    let current = 0;
    const INTERVAL = 2200;

    function render(){
      slides.forEach(function(s, i){ s.classList.toggle('active', i === current); });
    }

    function carouselTo(i){
      current = (i + slides.length) % slides.length;
      render();
    }

    // Cargar imágenes antes de mostrar
    slides.forEach(function(s){
      const bg = getComputedStyle(s).backgroundImage || '';
      const urlMatch = bg.match(/url\(['"]?([^'")]+)['"]?\)/);
      if(urlMatch){
        const img = new Image();
        img.src = urlMatch[1];
      }
    });

    setInterval(function(){ carouselTo(current + 1); }, INTERVAL);
  })();
