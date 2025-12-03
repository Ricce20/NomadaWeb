<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nómada - Gestor de Pedidos e Inventarios</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    @vite(['resources/css/app.css'])
    
    <!-- Prefetch de assets para carga más rápida del login -->
    <link rel="modulepreload" href="{{ Vite::asset('resources/js/app.tsx') }}">
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
                <div class="w-32 md:w-40 h-10 rounded-full flex items-center justify-center mr-3 pt-3">
                    <!-- <i class="fas fa-map-marker-alt text-white"></i> -->
                    <svg viewBox="0 0 957 216" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
                        <path d="M450.366 100.505C446.798 94.5829 441.726 89.7092 435.665 86.3781C429.586 82.9086 422.578 81.1714 414.643 81.1665C407.299 81.0795 400.054 82.8737 393.6 86.3781C387.534 89.7083 382.457 94.5819 378.884 100.505C375.29 106.478 373.498 113.368 373.508 121.175V177.894C373.559 179.855 373.051 181.789 372.043 183.472C371.059 185.105 369.659 186.448 367.986 187.365C366.314 188.282 364.428 188.739 362.521 188.691C360.699 188.704 358.904 188.253 357.306 187.381C355.796 186.363 354.526 185.03 353.585 183.472C352.583 181.787 352.075 179.854 352.12 177.894V121.175C352.12 113.368 350.323 106.485 346.729 100.527C343.148 94.6016 338.071 89.722 332.006 86.3781C325.81 82.9086 318.729 81.1714 310.765 81.1665C303.355 81.0636 296.042 82.8577 289.523 86.3781C283.482 89.7176 278.429 94.5904 274.874 100.505C271.397 106.478 269.656 113.368 269.651 121.175V213.585H300.188V118.928C300.155 117.048 300.598 115.19 301.477 113.526C302.449 111.934 303.791 110.598 305.388 109.632C307.016 108.651 308.882 108.132 310.783 108.132C312.684 108.132 314.549 108.651 316.178 109.632C317.775 110.598 319.117 111.934 320.089 113.526C321.075 115.154 321.582 117.026 321.554 118.928V175.655C321.554 183.833 323.351 190.909 326.945 196.881C330.593 202.759 335.73 207.569 341.836 210.825C348.258 214.193 355.415 215.915 362.667 215.839C369.867 215.93 376.974 214.206 383.33 210.825C389.435 207.567 394.571 202.757 398.221 196.881C401.942 190.923 403.803 183.848 403.803 175.655V118.738C403.751 116.892 404.262 115.075 405.268 113.526C406.235 111.934 407.571 110.598 409.165 109.632C410.804 108.661 412.672 108.143 414.577 108.132C416.481 108.109 418.351 108.63 419.968 109.632C421.539 110.57 422.825 111.916 423.689 113.526C424.689 115.078 425.2 116.893 425.154 118.738V213.585H455.793V121.175C455.793 113.368 453.984 106.478 450.366 100.505Z" fill="#FC6F20"/>
                        <path d="M269.651 133.428C268.824 129.55 267.652 125.753 266.15 122.083C262.953 114.005 258.143 106.663 252.013 100.505C245.89 94.1996 238.456 89.3147 230.237 86.195C221.799 82.7207 212.428 80.9811 202.125 80.9762C192.388 80.8507 182.719 82.6234 173.661 86.195C165.468 89.37 158.043 94.2475 151.877 100.505C145.872 106.664 141.125 113.933 137.902 121.907C136.203 126.219 134.949 130.692 134.159 135.258C132.694 143.899 132.694 152.725 134.159 161.367C134.948 165.933 136.202 170.407 137.902 174.718C141.16 182.761 145.965 190.087 152.046 196.281C158.232 202.563 165.648 207.504 173.829 210.796C182.258 214.275 191.682 216.01 202.103 216C212.401 216 221.772 214.265 230.215 210.796C238.424 207.56 245.848 202.612 251.991 196.281C260.872 187.191 266.988 175.769 269.629 163.343C270.658 158.408 271.169 153.379 271.153 148.338C271.177 143.329 270.674 138.332 269.651 133.428ZM237.122 164.668C235.361 169.461 232.706 173.877 229.299 177.682C225.936 181.423 221.813 184.405 217.206 186.429C212.439 188.454 207.304 189.468 202.125 189.408C196.99 189.554 191.885 188.582 187.163 186.56C182.442 184.538 178.217 181.513 174.782 177.697C171.369 173.895 168.714 169.478 166.959 164.683C165.184 159.413 164.303 153.884 164.351 148.323C164.302 142.88 165.184 137.469 166.959 132.323C168.689 127.467 171.345 122.992 174.782 119.148C180.116 113.537 187.052 109.707 194.643 108.178C202.235 106.65 210.114 107.497 217.206 110.606C221.826 112.514 225.958 115.433 229.299 119.148C232.703 122.953 235.357 127.366 237.122 132.155C239.026 137.338 239.974 142.824 239.92 148.345C239.96 153.909 239.012 159.435 237.122 164.668Z" fill="#FC6F20"/>
                        <path d="M103.857 83.4063V178.063C103.863 180.022 103.345 181.948 102.355 183.64C101.377 185.268 99.9841 186.607 98.3191 187.521C96.6541 188.435 94.7763 188.892 92.8771 188.844C91.0549 188.858 89.2588 188.412 87.6545 187.549C86.1431 186.534 84.873 185.199 83.9336 183.64C82.9633 181.942 82.458 180.018 82.4687 178.063V121.175C82.4687 113.368 80.6692 106.485 77.0704 100.527C73.4929 94.6073 68.4173 89.7347 62.3551 86.4C56.1633 82.9305 49.0827 81.1933 41.1135 81.1885C33.7036 81.0833 26.3904 82.8775 19.8719 86.4C13.8109 89.7312 8.73919 94.6048 5.17123 100.527C1.72862 106.485 0.00488313 113.368 0 121.175V213.585H30.5293V118.928C30.499 117.047 30.945 115.189 31.8258 113.526C32.7961 111.932 34.1381 110.596 35.7372 109.632C37.3652 108.651 39.2305 108.132 41.1318 108.132C43.0331 108.132 44.8983 108.651 46.5264 109.632C48.1239 110.598 49.4654 111.934 50.4378 113.526C51.424 115.154 51.9317 117.026 51.9027 118.928V175.823C51.7891 183.072 53.6664 190.214 57.3303 196.471C60.8498 202.48 65.9258 207.428 72.0237 210.796C78.5441 214.092 85.7491 215.81 93.0565 215.81C100.364 215.81 107.569 214.092 114.089 210.796C120.187 207.426 125.265 202.478 128.79 196.471C132.431 190.206 134.295 183.067 134.181 175.823V83.4063H103.857Z" fill="#FC6F20"/>
                        <path d="M587.418 213.585H553.725L546.773 192.27V192.226L537.508 162.633H537.552L535.757 157.041L520.983 110.73C520.906 110.425 520.769 110.137 520.579 109.886C520.389 109.634 520.15 109.424 519.877 109.266C519.683 109.079 519.454 108.934 519.202 108.838C518.95 108.743 518.681 108.699 518.412 108.71C517.809 108.701 517.22 108.897 516.742 109.266C516.361 109.673 516.107 110.182 516.01 110.73L498.68 161.433L498.277 162.626L489.099 191.816L488.952 192.263L481.686 213.577H455.793V195.557L491.384 98.4846C493.227 93.1046 496.92 88.5526 501.807 85.6388C506.741 82.6436 512.42 81.0986 518.192 81.1812C523.938 81.0895 529.599 82.5702 534.563 85.4631C539.402 88.186 542.879 92.4631 544.994 98.2943L587.418 213.585Z" fill="#FC6F20"/>
                        <path d="M957 213.585H923.306L916.209 191.838L916.128 191.56L907.112 162.633L905.991 159.149L890.55 110.73C890.47 110.424 890.329 110.137 890.137 109.886C889.944 109.635 889.704 109.424 889.43 109.266C889.238 109.077 889.008 108.93 888.756 108.834C888.504 108.738 888.234 108.696 887.965 108.71C887.359 108.699 886.767 108.895 886.287 109.266C885.909 109.675 885.655 110.183 885.555 110.73L870.737 154.223L859.018 191.07L851.341 213.585H818.776L860.966 98.4846C862.812 93.1041 866.508 88.5522 871.396 85.6388C876.325 82.6437 881.999 81.0986 887.767 81.1812C893.513 81.0895 899.174 82.5702 904.138 85.4631C908.982 88.186 912.456 92.4631 914.561 98.2943L957 213.585Z" fill="#FC6F20"/>
                        <path d="M414.511 61.0304C431.376 61.0304 445.048 47.3683 445.048 30.5152C445.048 13.6621 431.376 0 414.511 0C397.647 0 383.975 13.6621 383.975 30.5152C383.975 47.3683 397.647 61.0304 414.511 61.0304Z" fill="#FC6F20"/>
                        <path d="M827.646 115.239C822.169 105.63 814.098 97.7538 804.353 92.5118C794.45 87.0222 782.716 84.2773 769.151 84.2773H587.535L588.268 212.86H722.764H724.229L769.173 212.545C782.738 212.545 794.472 209.793 804.375 204.289C814.119 199.062 822.191 191.198 827.668 181.598C833.279 171.951 836.089 160.896 836.099 148.433C836.108 135.97 833.291 124.906 827.646 115.239ZM800.501 168.921C797.459 174.534 792.888 179.171 787.316 182.293C785.06 183.542 782.673 184.537 780.197 185.258H620.973V110.43H775.099C779.393 111.079 783.528 112.521 787.294 114.683C792.877 117.701 797.458 122.279 800.479 127.858C803.658 133.596 805.247 140.428 805.247 148.353C805.247 156.277 803.665 163.133 800.501 168.921Z" fill="#FC6F20"/>
                    </svg>
                </div>
                <!-- <h1 class="text-2xl font-bold">Nómada</h1> -->
            </div>
            
            <nav class="hidden md:flex space-x-8">
                <a href="#caracteristicas" class="hover:text-[#FC6F20] transition-colors">Características</a>
                <a href="#planes" class="hover:text-[#FC6F20] transition-colors">Planes</a>
                <a href="#testimonios" class="hover:text-[#FC6F20] transition-colors">Testimonios</a>
                <a href="#contacto" class="hover:text-[#FC6F20] transition-colors">Contacto</a>
            </nav>
            
            <div class="hidden md:flex items-center space-x-4">
                <button onclick="openGame()" class="px-4 py-2 rounded-md hover:bg-[#1B1B1B] transition-colors flex items-center">
                    <i class="fas fa-gamepad mr-2"></i>Jugar
                </button>
                <a href="login"  class="px-4 py-2 rounded-md hover:bg-[#1B1B1B] transition-colors">Iniciar Sesión</a>
                <a href="register" class="px-4 py-2 bg-[#FC6F20] text-white rounded-md hover:bg-orange-600 transition-colors">Registrate</a>
            </div>
            
            <button id="mobileMenuBtn" class="md:hidden text-xl">
                <i class="fas fa-bars"></i>
            </button>
        </div>
    </header>

    <!-- Mobile Menu -->
    <div id="mobileMenu" class="hidden md:hidden bg-[#323232] px-6 py-4 border-t border-gray-700">
        <nav class="flex flex-col space-y-4 mb-4">
            <a href="#caracteristicas" class="hover:text-[#FC6F20] transition-colors">Características</a>
            <a href="#planes" class="hover:text-[#FC6F20] transition-colors">Planes</a>
            <a href="#testimonios" class="hover:text-[#FC6F20] transition-colors">Testimonios</a>
            <a href="#contacto" class="hover:text-[#FC6F20] transition-colors">Contacto</a>
        </nav>
        <div class="flex flex-col space-y-2">
            <button onclick="openGame()" class="px-4 py-2 rounded-md hover:bg-[#1B1B1B] transition-colors flex items-center justify-center">
                <i class="fas fa-gamepad mr-2"></i>Jugar
            </button>
            <a href="login" class="px-4 py-2 rounded-md hover:bg-[#1B1B1B] transition-colors text-center">Iniciar Sesión</a>
            <a href="register" class="px-4 py-2 bg-[#FC6F20] text-white rounded-md hover:bg-orange-600 transition-colors text-center">Registrate</a>
        </div>
    </div>

    <!-- Hero Section -->
    <section class="py-16 px-6 bg-gradient-to-b from-[#323232] to-[#1B1B1B]">
        <div class="container mx-auto flex flex-col md:flex-row items-center">
            <div class="md:w-1/2 mb-10 md:mb-0">
                <h2 class="text-4xl md:text-5xl font-bold mb-6">Gestiona tu negocio de forma inteligente</h2>
                <p class="text-xl mb-8 text-gray-300">Nómada es la solución integral para la gestión de pedidos, inventarios y logística de tu empresa.</p>
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
                <a href="register"   class="px-8 py-3 bg-[#FC6F20] text-white rounded-md hover:bg-orange-600 transition-colors font-medium text-lg">Registrate ahora</a>
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
            
            <div class="border-t border-gray-700 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-400">
                <p>&copy; 2025 Nómada. Todos los derechos reservados.</p>
                <button onclick="openPrivacyPolicy()" class="flex items-center gap-2 px-4 py-2 bg-[#1B1B1B] border border-gray-600 rounded-md hover:border-[#FC6F20] hover:text-[#FC6F20] transition-colors">
                    <i class="fas fa-shield-alt"></i>
                    <span>Política de Privacidad</span>
                </button>
            </div>
        </div>
    </footer>

    <script>
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });

        // Close mobile menu when clicking a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                mobileMenuBtn.querySelector('i').classList.add('fa-bars');
                mobileMenuBtn.querySelector('i').classList.remove('fa-times');
            });
        });

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

    <!-- Modal del Juego Unity -->
    <div id="gameModal" class="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] hidden flex items-center justify-center p-2 md:p-4">
        <div class="relative w-full max-w-6xl flex flex-col" style="height: 95vh; max-height: 95vh;">
            <button onclick="closeGame()" class="absolute top-4 right-4 z-10 text-white text-3xl hover:text-[#FC6F20] transition-colors">
                <i class="fas fa-times"></i>
            </button>
            <iframe id="gameFrame" class="w-full flex-1 rounded-t-lg" style="border: none;"></iframe>
            <!-- Botón de descarga debajo del juego -->
            <div class="bg-[#323232] p-4 rounded-b-lg flex items-center justify-center">
                <a href="/ejecutable nomada2d.zip" download class="px-6 py-3 bg-[#FC6F20] text-white rounded-md hover:bg-orange-600 transition-colors font-medium flex items-center">
                    <i class="fas fa-download mr-2"></i>
                    Descargar Juego para Windows
                </a>
            </div>
        </div>
    </div>

    <script>
        function openGame() {
            const modal = document.getElementById('gameModal');
            const frame = document.getElementById('gameFrame');
            frame.src = '/Nomada/index.html';
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closeGame() {
            const modal = document.getElementById('gameModal');
            const frame = document.getElementById('gameFrame');
            frame.src = '';
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }

        // Cerrar con ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeGame();
                closePrivacyPolicy();
            }
        });
    </script>

    <!-- Modal de Política de Privacidad -->
    <div id="privacyModal" class="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] hidden flex items-center justify-center p-2 md:p-4">
        <div class="relative w-full max-w-4xl bg-[#323232] rounded-xl flex flex-col" style="height: 90vh; max-height: 90vh;">
            <div class="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 class="text-xl font-bold text-[#FC6F20]">Política de Privacidad</h2>
                <button onclick="closePrivacyPolicy()" class="text-white text-2xl hover:text-[#FC6F20] transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="flex-1 overflow-y-auto p-6 text-gray-300 space-y-4">
                <p class="text-sm text-gray-400">Última actualización: 3 de Diciembre, 2025</p>
                
                <p>Esta Política de Privacidad describe nuestras políticas y procedimientos sobre la recopilación, uso y divulgación de su información cuando utiliza el Servicio y le informa sobre sus derechos de privacidad y cómo la ley lo protege.</p>
                
                <p>Utilizamos sus datos personales para proporcionar y mejorar el Servicio. Al utilizar el Servicio, usted acepta la recopilación y el uso de información de acuerdo con esta Política de Privacidad.</p>

                <h3 class="text-lg font-bold text-[#FEE8D0] mt-6">Interpretación y Definiciones</h3>
                <p><strong>Cuenta:</strong> significa una cuenta única creada para que usted acceda a nuestro Servicio.</p>
                <p><strong>Aplicación:</strong> se refiere a NOMADA, el programa de software proporcionado por la Compañía.</p>
                <p><strong>Compañía:</strong> se refiere a NOMADA.</p>
                <p><strong>Cookies:</strong> son pequeños archivos que se colocan en su computadora, dispositivo móvil o cualquier otro dispositivo por un sitio web.</p>
                <p><strong>País:</strong> se refiere a México.</p>
                <p><strong>Dispositivo:</strong> significa cualquier dispositivo que pueda acceder al Servicio.</p>
                <p><strong>Datos Personales:</strong> es cualquier información que se relaciona con un individuo identificado o identificable.</p>
                <p><strong>Servicio:</strong> se refiere a la Aplicación o el Sitio Web o ambos.</p>
                <p><strong>Sitio Web:</strong> se refiere a NOMADA, accesible desde https://dev.yeremi.work/</p>

                <h3 class="text-lg font-bold text-[#FEE8D0] mt-6">Tipos de Datos Recopilados</h3>
                <h4 class="font-semibold text-[#FEE8D0]">Datos Personales</h4>
                <p>Mientras utiliza nuestro Servicio, podemos pedirle que nos proporcione cierta información de identificación personal que puede usarse para contactarlo o identificarlo, incluyendo:</p>
                <ul class="list-disc list-inside ml-4 space-y-1">
                    <li>Dirección de correo electrónico</li>
                    <li>Nombre y apellido</li>
                    <li>Número de teléfono</li>
                    <li>Dirección, Estado, Provincia, Código Postal, Ciudad</li>
                    <li>Datos de uso</li>
                </ul>

                <h4 class="font-semibold text-[#FEE8D0] mt-4">Datos de Uso</h4>
                <p>Los datos de uso se recopilan automáticamente cuando se utiliza el Servicio. Pueden incluir información como la dirección IP de su dispositivo, tipo de navegador, versión del navegador, las páginas de nuestro Servicio que visita, la hora y fecha de su visita, el tiempo dedicado a esas páginas e identificadores únicos del dispositivo.</p>

                <h4 class="font-semibold text-[#FEE8D0] mt-4">Información de Ubicación</h4>
                <p>Mientras usa nuestra Aplicación, podemos recopilar, con su permiso previo, información sobre su ubicación. Utilizamos esta información para proporcionar características de nuestro Servicio y para mejorar y personalizar nuestro Servicio.</p>

                <h3 class="text-lg font-bold text-[#FEE8D0] mt-6">Tecnologías de Seguimiento y Cookies</h3>
                <p>Utilizamos Cookies y tecnologías de seguimiento similares para rastrear la actividad en nuestro Servicio y almacenar cierta información. Las cookies pueden ser "Persistentes" o de "Sesión".</p>
                <ul class="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Cookies Necesarias/Esenciales:</strong> Estas cookies son esenciales para proporcionarle servicios disponibles a través del sitio web.</li>
                    <li><strong>Cookies de Funcionalidad:</strong> Estas cookies nos permiten recordar las elecciones que hace cuando usa el sitio web.</li>
                </ul>

                <h3 class="text-lg font-bold text-[#FEE8D0] mt-6">Uso de Sus Datos Personales</h3>
                <p>La Compañía puede usar los Datos Personales para los siguientes propósitos:</p>
                <ul class="list-disc list-inside ml-4 space-y-1">
                    <li>Para proporcionar y mantener nuestro Servicio</li>
                    <li>Para gestionar su Cuenta</li>
                    <li>Para el cumplimiento de un contrato</li>
                    <li>Para contactarlo</li>
                    <li>Para proporcionarle noticias, ofertas especiales e información general</li>
                    <li>Para gestionar sus solicitudes</li>
                </ul>

                <h3 class="text-lg font-bold text-[#FEE8D0] mt-6">Retención de Sus Datos Personales</h3>
                <p>La Compañía retendrá sus Datos Personales solo durante el tiempo que sea necesario para los fines establecidos en esta Política de Privacidad.</p>

                <h3 class="text-lg font-bold text-[#FEE8D0] mt-6">Seguridad de Sus Datos Personales</h3>
                <p>La seguridad de sus Datos Personales es importante para nosotros, pero recuerde que ningún método de transmisión por Internet o método de almacenamiento electrónico es 100% seguro.</p>

                <h3 class="text-lg font-bold text-[#FEE8D0] mt-6">Privacidad de los Niños</h3>
                <p>Nuestro Servicio no está dirigido a menores de 13 años. No recopilamos a sabiendas información de identificación personal de menores de 13 años.</p>

                <h3 class="text-lg font-bold text-[#FEE8D0] mt-6">Cambios a esta Política de Privacidad</h3>
                <p>Podemos actualizar nuestra Política de Privacidad de vez en cuando. Le notificaremos cualquier cambio publicando la nueva Política de Privacidad en esta página.</p>

                <h3 class="text-lg font-bold text-[#FEE8D0] mt-6">Contáctenos</h3>
                <p>Si tiene alguna pregunta sobre esta Política de Privacidad, puede contactarnos:</p>
                <p class="text-[#FC6F20]">Por correo electrónico: nomada@gmail.com</p>
            </div>
        </div>
    </div>

    <script>
        function openPrivacyPolicy() {
            const modal = document.getElementById('privacyModal');
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closePrivacyPolicy() {
            const modal = document.getElementById('privacyModal');
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    </script>
</body>
</html>