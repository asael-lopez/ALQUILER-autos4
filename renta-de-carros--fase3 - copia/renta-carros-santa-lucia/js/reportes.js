document.addEventListener('DOMContentLoaded', function () {
    const sessionEmail = (typeof DataManager !== 'undefined' && DataManager.getCurrentUserEmail()) || localStorage.getItem('usuario') || sessionStorage.getItem('usuario');

    if (!sessionEmail) {
        window.location.replace('login-registro.html');
        return;
    }

    const userData = (typeof DataManager !== 'undefined' && DataManager.getCurrentUserData()) || {};
    document.getElementById('reportUserDisplay').textContent = userData.name || sessionEmail;

    // Año dinámico en el pie de página
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    document.getElementById('reportLogoutBtn').addEventListener('click', function () {
        if (typeof DataManager !== 'undefined') {
            DataManager.logout();
        } else {
            sessionStorage.removeItem('usuario');
            localStorage.removeItem('usuario');
        }
        window.location.replace('login-registro.html');
    });

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    mobileMenuBtn.addEventListener('click', function () {
        const isOpen = mobileMenu.classList.toggle('open');
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
        mobileMenuBtn.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');

        const icon = mobileMenuBtn.querySelector('i');
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-times', isOpen);
    });

    document.querySelectorAll('.dropdown-toggle').forEach(function (toggle) {
        toggle.addEventListener('click', function (event) {
            event.preventDefault();
            const dropdown = toggle.closest('.dropdown');
            const isOpen = dropdown.classList.contains('active');

            document.querySelectorAll('.dropdown').forEach(function (item) {
                item.classList.remove('active');
            });

            if (!isOpen) {
                dropdown.classList.add('active');
            }
        });
    });

    const chartCanvas = document.getElementById('monthlyRentalsChart');
    const chartError = document.getElementById('chartError');

    if (typeof Chart === 'undefined') {
        chartError.textContent = 'No se pudo cargar Chart.js. Comprueba tu conexión e inténtalo de nuevo.';
        chartError.hidden = false;
        return;
    }

    const context = chartCanvas.getContext('2d');
    const barGradient = context.createLinearGradient(0, 0, 0, 400);
    barGradient.addColorStop(0, 'rgba(220, 38, 38, 0.95)');
    barGradient.addColorStop(1, 'rgba(185, 28, 28, 0.35)');

    new Chart(context, {
        type: 'bar',
        data: {
            labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
            datasets: [{
                label: 'Vehículos alquilados',
                data: [18, 24, 21, 32, 28, 40],
                backgroundColor: barGradient,
                borderColor: '#dc2626',
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 52
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#111111',
                    borderColor: '#333333',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            return ' ' + context.parsed.y + ' vehículos alquilados';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#d4d4d4'
                    },
                    border: {
                        color: '#333333'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: '#a3a3a3',
                        stepSize: 10
                    },
                    title: {
                        display: true,
                        text: 'Cantidad de vehículos',
                        color: '#a3a3a3'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.08)'
                    },
                    border: {
                        display: false
                    }
                }
            }
        }
    });
});
