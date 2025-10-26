<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nómada - Gestor de Pedidos e Inventarios</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    @vite(['resources/css/app.css'])
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>
<body class="bg-[#1B1B1B] text-[#FEE8D0]">
    <!-- Header -->
    <header class="bg-[#323232] py-4 px-6 sticky top-0 z-50 shadow-lg">
        <div class="container mx-auto flex justify-between items-center">
            <div class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-[#FC6F20] flex items-center justify-center mr-3">
                    <i class="fas fa-map-marker-alt text-white"></i>
                </div>
                <h1 class="text-2xl font-bold">Nómada</h1>
            </div>
            
            <nav class="hidden md:flex space-x-8">
                <a href="#caracteristicas" class="hover:text-[#FC6F20] transition-colors">Características</a>
                <a href="#planes" class="hover:text-[#FC6F20] transition-colors">Planes</a>
                <a href="#testimonios" class="hover:text-[#FC6F20] transition-colors">Testimonios</a>
                <a href="#contacto" class="hover:text-[#FC6F20] transition-colors">Contacto</a>
            </nav>
            
            <div class="flex items-center space-x-4">
                <a href="/login"  class="px-4 py-2 rounded-md hover:bg-[#1B1B1B] transition-colors">Iniciar Sesión</a>
                <a href="/register" class="px-4 py-2 bg-[#FC6F20] text-white rounded-md hover:bg-orange-600 transition-colors">Prueba Gratis</a>
            </div>
            
            <button class="md:hidden text-xl">
                <i class="fas fa-bars"></i>
            </button>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="py-16 px-6 bg-gradient-to-b from-[#323232] to-[#1B1B1B]">
        <div class="container mx-auto flex flex-col md:flex-row items-center">
            <div class="md:w-1/2 mb-10 md:mb-0">
                <h2 class="text-4xl md:text-5xl font-bold mb-6">Gestiona tu negocio de forma inteligente</h2>
                <p class="text-xl mb-8 text-gray-300">Nómada es la solución integral para la gestión de pedidos, inventarios y logística de tu empresa.</p>
                <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <button class="px-6 py-3 bg-[#FC6F20] text-white rounded-md hover:bg-orange-600 transition-colors font-medium">Comenzar Ahora</button>
                    <button class="px-6 py-3 border border-[#FC6F20] text-[#FC6F20] rounded-md hover:bg-[#FC6F20] hover:text-white transition-colors font-medium">Ver Demo</button>
                </div>
            </div>
            <div class="md:w-1/2 flex justify-center">
                <div class="bg-[#323232] p-6 rounded-xl shadow-2xl max-w-md">
                    <div class="bg-[#1B1B1B] p-4 rounded-lg mb-4">
                        <div class="flex justify-between mb-2">
                            <span class="text-gray-400">Pedido #4582</span>
                            <span class="text-[#FC6F20] font-medium">En camino</span>
                        </div>
                        <div class="flex items-center mb-2">
                            <div class="w-3 h-3 rounded-full bg-[#FC6F20] mr-2"></div>
                            <span>Almacén Central</span>
                        </div>
                        <div class="flex items-center mb-2">
                            <div class="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                            <span>Cliente: Av. Principal 123</span>
                        </div>
                        <div class="h-2 bg-gray-700 rounded-full mb-2">
                            <div class="h-2 bg-[#FC6F20] rounded-full w-3/4"></div>
                        </div>
                        <div class="text-sm text-gray-400">Vehículo asignado: Furgoneta #3</div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-[#1B1B1B] p-4 rounded-lg">
                            <div class="text-[#FC6F20] text-lg font-bold">156</div>
                            <div class="text-sm text-gray-400">Pedidos hoy</div>
                        </div>
                        <div class="bg-[#1B1B1B] p-4 rounded-lg">
                            <div class="text-[#FC6F20] text-lg font-bold">89%</div>
                            <div class="text-sm text-gray-400">Inventario disponible</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Características -->
    <section id="caracteristicas" class="py-16 px-6 bg-[#1B1B1B]">
        <div class="container mx-auto">
            <h2 class="text-3xl font-bold text-center mb-12">Funcionalidades Principales</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Gestión de Productos -->
                <div class="bg-[#323232] p-6 rounded-xl hover:transform hover:-translate-y-2 transition-all duration-300">
                    <div class="w-12 h-12 rounded-lg bg-[#FC6F20] flex items-center justify-center mb-4">
                        <i class="fas fa-box text-white text-xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Gestión de Productos</h3>
                    <p class="text-gray-300">Organiza y categoriza todos tus productos con información detallada, imágenes y precios.</p>
                </div>
                
                <!-- Gestión de Almacenes -->
                <div class="bg-[#323232] p-6 rounded-xl hover:transform hover:-translate-y-2 transition-all duration-300">
                    <div class="w-12 h-12 rounded-lg bg-[#FC6F20] flex items-center justify-center mb-4">
                        <i class="fas fa-warehouse text-white text-xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Gestión de Almacenes</h3>
                    <p class="text-gray-300">Controla uno o múltiples almacenes con ubicaciones específicas para cada producto.</p>
                </div>
                
                <!-- Gestión de Inventario -->
                <div class="bg-[#323232] p-6 rounded-xl hover:transform hover:-translate-y-2 transition-all duration-300">
                    <div class="w-12 h-12 rounded-lg bg-[#FC6F20] flex items-center justify-center mb-4">
                        <i class="fas fa-clipboard-list text-white text-xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Gestión de Inventario</h3>
                    <p class="text-gray-300">Realiza seguimiento en tiempo real de existencias, alertas de stock bajo y reposición automática.</p>
                </div>
                
                <!-- Gestión de Vehículos -->
                <div class="bg-[#323232] p-6 rounded-xl hover:transform hover:-translate-y-2 transition-all duration-300">
                    <div class="w-12 h-12 rounded-lg bg-[#FC6F20] flex items-center justify-center mb-4">
                        <i class="fas fa-truck text-white text-xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Gestión de Vehículos</h3>
                    <p class="text-gray-300">Administra tu flota vehicular, mantenimientos y asignación de conductores.</p>
                </div>
                
                <!-- Gestión de Pedidos -->
                <div class="bg-[#323232] p-6 rounded-xl hover:transform hover:-translate-y-2 transition-all duration-300">
                    <div class="w-12 h-12 rounded-lg bg-[#FC6F20] flex items-center justify-center mb-4">
                        <i class="fas fa-shipping-fast text-white text-xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Gestión de Pedidos</h3>
                    <p class="text-gray-300">Crea, acepta y rastrea pedidos con actualizaciones en tiempo real y notificaciones automáticas.</p>
                </div>
                
                <!-- Gestión de Empleados -->
                <div class="bg-[#323232] p-6 rounded-xl hover:transform hover:-translate-y-2 transition-all duration-300">
                    <div class="w-12 h-12 rounded-lg bg-[#FC6F20] flex items-center justify-center mb-4">
                        <i class="fas fa-users text-white text-xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Gestión de Empleados</h3>
                    <p class="text-gray-300">Asigna roles, permisos y gestiona el rendimiento de tu equipo de trabajo.</p>
                </div>
            </div>
            
            <!-- Característica destacada -->
            <div class="mt-16 bg-[#323232] rounded-xl p-8 flex flex-col md:flex-row items-center">
                <div class="md:w-1/2 mb-6 md:mb-0">
                    <h3 class="text-2xl font-bold mb-4">Seguimiento en Tiempo Real</h3>
                    <p class="text-gray-300 mb-4">Observa la ubicación actual de todos tus pedidos en curso y recibe notificaciones cuando se completen las entregas.</p>
                    <ul class="space-y-2">
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>Visualización en mapa de entregas</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>Notificaciones en tiempo real</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>Asignación automática de vehículos</span>
                        </li>
                    </ul>
                </div>
                <div class="md:w-1/2 flex justify-center">
                    <div class="bg-[#1B1B1B] p-4 rounded-lg w-full max-w-sm">
                        <div class="h-48 bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
                            <i class="fas fa-map-marked-alt text-4xl text-[#FC6F20]"></i>
                        </div>
                        <div class="flex justify-between mb-2">
                            <span class="text-gray-400">Pedidos activos</span>
                            <span class="text-[#FC6F20] font-medium">12</span>
                        </div>
                        <div class="flex justify-between mb-2">
                            <span class="text-gray-400">Vehículos en ruta</span>
                            <span class="text-[#FC6F20] font-medium">8</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Entregas hoy</span>
                            <span class="text-[#FC6F20] font-medium">47</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Planes -->
    <section id="planes" class="py-16 px-6 bg-[#323232]">
        <div class="container mx-auto">
            <h2 class="text-3xl font-bold text-center mb-4">Planes para cada necesidad</h2>
            <p class="text-center text-gray-300 mb-12 max-w-2xl mx-auto">Elige el plan que mejor se adapte a tu negocio. Todos incluyen las funcionalidades principales y soporte técnico.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Plan Básico -->
                <div class="bg-[#1B1B1B] rounded-xl p-6 border border-gray-700">
                    <h3 class="text-xl font-bold mb-2">Básico</h3>
                    <div class="mb-4">
                        <span class="text-3xl font-bold">$29</span>
                        <span class="text-gray-400">/mes</span>
                    </div>
                    <p class="text-gray-300 mb-6">Ideal para pequeñas empresas con un solo almacén.</p>
                    <ul class="space-y-3 mb-8">
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>1 almacén</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>Hasta 3 vehículos</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>5 usuarios</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>Soporte por email</span>
                        </li>
                    </ul>
                    <button class="w-full py-3 border border-[#FC6F20] text-[#FC6F20] rounded-md hover:bg-[#FC6F20] hover:text-white transition-colors font-medium">Seleccionar Plan</button>
                </div>
                
                <!-- Plan Profesional -->
                <div class="bg-[#1B1B1B] rounded-xl p-6 border-2 border-[#FC6F20] relative">
                    <div class="absolute top-0 right-0 bg-[#FC6F20] text-white px-4 py-1 rounded-bl-lg rounded-tr-xl text-sm font-medium">Más Popular</div>
                    <h3 class="text-xl font-bold mb-2">Profesional</h3>
                    <div class="mb-4">
                        <span class="text-3xl font-bold">$59</span>
                        <span class="text-gray-400">/mes</span>
                    </div>
                    <p class="text-gray-300 mb-6">Perfecto para empresas en crecimiento con múltiples ubicaciones.</p>
                    <ul class="space-y-3 mb-8">
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>Hasta 5 almacenes</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>Hasta 10 vehículos</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>15 usuarios</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>Seguimiento en tiempo real</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>Soporte prioritario</span>
                        </li>
                    </ul>
                    <button class="w-full py-3 bg-[#FC6F20] text-white rounded-md hover:bg-orange-600 transition-colors font-medium">Seleccionar Plan</button>
                </div>
                
                <!-- Plan Empresarial -->
                <div class="bg-[#1B1B1B] rounded-xl p-6 border border-gray-700">
                    <h3 class="text-xl font-bold mb-2">Empresarial</h3>
                    <div class="mb-4">
                        <span class="text-3xl font-bold">$99</span>
                        <span class="text-gray-400">/mes</span>
                    </div>
                    <p class="text-gray-300 mb-6">Para grandes empresas con necesidades complejas de logística.</p>
                    <ul class="space-y-3 mb-8">
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>Almacenes ilimitados</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>Vehículos ilimitados</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>Usuarios ilimitados</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>API personalizada</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-check text-[#FC6F20] mr-2"></i>
                            <span>Soporte 24/7</span>
                        </li>
                    </ul>
                    <button class="w-full py-3 border border-[#FC6F20] text-[#FC6F20] rounded-md hover:bg-[#FC6F20] hover:text-white transition-colors font-medium">Seleccionar Plan</button>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonios -->
    <section id="testimonios" class="py-16 px-6 bg-[#1B1B1B]">
        <div class="container mx-auto">
            <h2 class="text-3xl font-bold text-center mb-12">Lo que dicen nuestros clientes</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Testimonio 1 -->
                <div class="bg-[#323232] p-6 rounded-xl">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 rounded-full bg-[#FC6F20] flex items-center justify-center text-white font-bold mr-4">M</div>
                        <div>
                            <h4 class="font-bold">María González</h4>
                            <p class="text-sm text-gray-400">Distribuidora Alimentos S.A.</p>
                        </div>
                    </div>
                    <p class="text-gray-300">"Nómada ha transformado nuestra logística. Ahora podemos rastrear todos nuestros pedidos en tiempo real y hemos reducido los tiempos de entrega en un 30%."</p>
                </div>
                
                <!-- Testimonio 2 -->
                <div class="bg-[#323232] p-6 rounded-xl">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 rounded-full bg-[#FC6F20] flex items-center justify-center text-white font-bold mr-4">C</div>
                        <div>
                            <h4 class="font-bold">Carlos Rodríguez</h4>
                            <p class="text-sm text-gray-400">Farmacia Central</p>
                        </div>
                    </div>
                    <p class="text-gray-300">"La gestión de inventarios con Nómada es increíble. Las alertas automáticas de stock bajo nos han ayudado a evitar desabastecimientos críticos."</p>
                </div>
                
                <!-- Testimonio 3 -->
                <div class="bg-[#323232] p-6 rounded-xl">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 rounded-full bg-[#FC6F20] flex items-center justify-center text-white font-bold mr-4">A</div>
                        <div>
                            <h4 class="font-bold">Ana López</h4>
                            <p class="text-sm text-gray-400">Tiendas El Buen Precio</p>
                        </div>
                    </div>
                    <p class="text-gray-300">"La asignación automática de vehículos ha optimizado nuestras rutas de entrega. Nuestros clientes están más satisfechos y hemos ahorrado en combustible."</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA -->
    <section class="py-16 px-6 bg-gradient-to-r from-[#323232] to-[#1B1B1B]">
        <div class="container mx-auto text-center">
            <h2 class="text-3xl font-bold mb-4">¿Listo para optimizar tu negocio?</h2>
            <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Comienza hoy con una prueba gratuita de 14 días. Sin compromisos, sin tarjeta de crédito.</p>
            <div class="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button class="px-8 py-3 bg-[#FC6F20] text-white rounded-md hover:bg-orange-600 transition-colors font-medium text-lg">Comenzar Prueba Gratuita</button>
                <button class="px-8 py-3 border border-[#FC6F20] text-[#FC6F20] rounded-md hover:bg-[#FC6F20] hover:text-white transition-colors font-medium text-lg">Solicitar Demo Personalizado</button>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer id="contacto" class="py-12 px-6 bg-[#323232]">
        <div class="container mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <div class="flex items-center mb-4">
                        <div class="w-10 h-10 rounded-full bg-[#FC6F20] flex items-center justify-center mr-3">
                            <i class="fas fa-map-marker-alt text-white"></i>
                        </div>
                        <h3 class="text-xl font-bold">Nómada</h3>
                    </div>
                    <p class="text-gray-300 mb-4">La solución integral para la gestión de pedidos e inventarios de tu empresa.</p>
                    <div class="flex space-x-4">
                        <a href="#" class="text-gray-400 hover:text-[#FC6F20] transition-colors">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="#" class="text-gray-400 hover:text-[#FC6F20] transition-colors">
                            <i class="fab fa-twitter"></i>
                        </a>
                        <a href="#" class="text-gray-400 hover:text-[#FC6F20] transition-colors">
                            <i class="fab fa-linkedin-in"></i>
                        </a>
                        <a href="#" class="text-gray-400 hover:text-[#FC6F20] transition-colors">
                            <i class="fab fa-instagram"></i>
                        </a>
                    </div>
                </div>
                
                <div>
                    <h4 class="text-lg font-bold mb-4">Enlaces Rápidos</h4>
                    <ul class="space-y-2">
                        <li><a href="#" class="text-gray-300 hover:text-[#FC6F20] transition-colors">Inicio</a></li>
                        <li><a href="#caracteristicas" class="text-gray-300 hover:text-[#FC6F20] transition-colors">Características</a></li>
                        <li><a href="#planes" class="text-gray-300 hover:text-[#FC6F20] transition-colors">Planes</a></li>
                        <li><a href="#testimonios" class="text-gray-300 hover:text-[#FC6F20] transition-colors">Testimonios</a></li>
                    </ul>
                </div>
                
                <div>
                    <h4 class="text-lg font-bold mb-4">Soporte</h4>
                    <ul class="space-y-2">
                        <li><a href="#" class="text-gray-300 hover:text-[#FC6F20] transition-colors">Centro de Ayuda</a></li>
                        <li><a href="#" class="text-gray-300 hover:text-[#FC6F20] transition-colors">Documentación</a></li>
                        <li><a href="#" class="text-gray-300 hover:text-[#FC6F20] transition-colors">Tutoriales</a></li>
                        <li><a href="#" class="text-gray-300 hover:text-[#FC6F20] transition-colors">Contacto</a></li>
                    </ul>
                </div>
                
                <div>
                    <h4 class="text-lg font-bold mb-4">Contacto</h4>
                    <ul class="space-y-2">
                        <li class="flex items-center">
                            <i class="fas fa-envelope text-[#FC6F20] mr-2"></i>
                            <span class="text-gray-300">info@nomada.com</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-phone text-[#FC6F20] mr-2"></i>
                            <span class="text-gray-300">+1 (555) 123-4567</span>
                        </li>
                        <li class="flex items-center">
                            <i class="fas fa-map-marker-alt text-[#FC6F20] mr-2"></i>
                            <span class="text-gray-300">Av. Tecnología 123, Ciudad Digital</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                <p>&copy; 2023 Nómada. Todos los derechos reservados.</p>
            </div>
        </div>
    </footer>

    <script>
        // Smooth scroll para los enlaces internos
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if(targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if(targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });
    </script>
</body>
</html>