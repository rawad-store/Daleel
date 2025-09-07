// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB6TzN-QHVUowizABYxm0Y8fkqTp1qb_qA",
    authDomain: "daleel-c4204.firebaseapp.com",
    projectId: "daleel-c4204",
    storageBucket: "daleel-c4204.appspot.com",
    messagingSenderId: "864882936232",
    appId: "1:864882936232:web:73083fed09357c6925b59d",
    measurementId: "G-E5HMQBFBW8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Global Variables
let currentUser = null;
let allServices = [];
let filteredServices = [];
let currentFilter = 'all';

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const servicesContainer = document.getElementById('servicesContainer');
const noServicesDiv = document.getElementById('noServices');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const addServiceModal = document.getElementById('addServiceModal');
const authModal = document.getElementById('authModal');
const serviceForm = document.getElementById('serviceForm');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    registerServiceWorker();
});

// Register Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
}

async function initializeApp() {
    try {
        // Show loading screen
        showLoadingScreen();
        
        // Initialize event listeners
        initializeEventListeners();
        
        // Load services
        await loadServices();
        
        // Update stats
        updateStats();
        
        // Hide loading screen
        hideLoadingScreen();
        
        // Initialize smooth scrolling
        initializeSmoothScrolling();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('حدث خطأ في تحميل التطبيق', 'error');
        hideLoadingScreen();
    }
}

function initializeEventListeners() {
    // Navigation
    navToggle.addEventListener('click', toggleNavMenu);
    
    // Search and Filter
    searchInput.addEventListener('input', handleSearch);
    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });
    
    // Forms
    serviceForm.addEventListener('submit', handleAddService);
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    
    // Auth state changes
    auth.onAuthStateChanged(handleAuthStateChange);
    
    // Close modals when clicking outside
    window.addEventListener('click', handleModalClose);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Loading Screen
function showLoadingScreen() {
    loadingScreen.classList.remove('hidden');
}

function hideLoadingScreen() {
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, 1000);
}

// Navigation
function toggleNavMenu() {
    navMenu.classList.toggle('show');
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Search and Filter
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    filterServices(searchTerm, currentFilter);
}

function handleFilter(e) {
    // Update active filter button
    filterButtons.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    currentFilter = e.target.dataset.category;
    const searchTerm = searchInput.value.toLowerCase().trim();
    filterServices(searchTerm, currentFilter);
}

function filterServices(searchTerm = '', category = 'all') {
    filteredServices = allServices.filter(service => {
        const matchesSearch = !searchTerm || 
            service.name.toLowerCase().includes(searchTerm) ||
            service.category.toLowerCase().includes(searchTerm) ||
            service.location.toLowerCase().includes(searchTerm) ||
            service.documents.toLowerCase().includes(searchTerm);
        
        const matchesCategory = category === 'all' || service.category === category;
        
        return matchesSearch && matchesCategory;
    });
    
    displayServices(filteredServices);
}

// Services Management
async function loadServices() {
    try {
        const snapshot = await db.collection('services')
            .orderBy('createdAt', 'desc')
            .get();
        
        allServices = [];
        snapshot.forEach(doc => {
            allServices.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        filteredServices = [...allServices];
        displayServices(filteredServices);
        
    } catch (error) {
        console.error('Error loading services:', error);
        showToast('حدث خطأ في تحميل الخدمات', 'error');
    }
}

function displayServices(services) {
    servicesContainer.innerHTML = '';
    
    if (services.length === 0) {
        noServicesDiv.style.display = 'block';
        return;
    }
    
    noServicesDiv.style.display = 'none';
    
    services.forEach(service => {
        const serviceCard = createServiceCard(service);
        servicesContainer.appendChild(serviceCard);
    });
}

function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.innerHTML = `
        <div class="service-header">
            <div>
                <h3 class="service-title">${service.name}</h3>
                <span class="service-category">${service.category}</span>
            </div>
        </div>
        
        <div class="service-info">
            <div class="service-info-item">
                <i class="fas fa-map-marker-alt"></i>
                <span><strong>المكان:</strong> ${service.location}</span>
            </div>
            
            <div class="service-info-item">
                <i class="fas fa-file-alt"></i>
                <span><strong>الأوراق المطلوبة:</strong> ${service.documents}</span>
            </div>
            
            ${service.cost ? `
                <div class="service-info-item">
                    <i class="fas fa-money-bill"></i>
                    <span><strong>التكلفة:</strong> ${service.cost}</span>
                </div>
            ` : ''}
            
            ${service.duration ? `
                <div class="service-info-item">
                    <i class="fas fa-clock"></i>
                    <span><strong>المدة المتوقعة:</strong> ${service.duration}</span>
                </div>
            ` : ''}
            
            ${service.notes ? `
                <div class="service-info-item">
                    <i class="fas fa-sticky-note"></i>
                    <span><strong>ملاحظات:</strong> ${service.notes}</span>
                </div>
            ` : ''}
        </div>
        
        <div class="service-status ${service.verified ? 'status-verified' : 'status-pending'}">
            <i class="fas ${service.verified ? 'fa-check-circle' : 'fa-clock'}"></i>
            ${service.verified ? 'موثوق' : 'قيد المراجعة'}
        </div>
        
        <div class="service-actions">
            <div class="vote-buttons">
                <button class="vote-btn upvote" onclick="vote('${service.id}', 1)" title="مفيد">
                    <i class="fas fa-thumbs-up"></i>
                </button>
                <span class="vote-count">${service.votes || 0}</span>
                <button class="vote-btn downvote" onclick="vote('${service.id}', -1)" title="غير مفيد">
                    <i class="fas fa-thumbs-down"></i>
                </button>
            </div>
            
            <div class="service-meta">
                <small class="text-muted">
                    <i class="fas fa-calendar"></i>
                    ${formatDate(service.createdAt)}
                </small>
            </div>
        </div>
    `;
    
    return card;
}

async function handleAddService(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('يجب تسجيل الدخول أولاً', 'warning');
        showAuthModal('login');
        return;
    }
    
    const formData = new FormData(serviceForm);
    const serviceData = {
        name: document.getElementById('serviceName').value.trim(),
        category: document.getElementById('serviceCategory').value,
        location: document.getElementById('serviceLocation').value.trim(),
        documents: document.getElementById('serviceDocuments').value.trim(),
        cost: document.getElementById('serviceCost').value.trim() || null,
        duration: document.getElementById('serviceDuration').value.trim() || null,
        notes: document.getElementById('serviceNotes').value.trim() || null,
        createdAt: new Date(),
        votes: 0,
        verified: false,
        userId: currentUser.uid,
        userEmail: currentUser.email
    };
    
    try {
        await db.collection('services').add(serviceData);
        showToast('تمت إضافة الخدمة بنجاح ✅', 'success');
        serviceForm.reset();
        closeAddForm();
        await loadServices();
        updateStats();
    } catch (error) {
        console.error('Error adding service:', error);
        showToast('حدث خطأ في إضافة الخدمة', 'error');
    }
}

async function vote(serviceId, value) {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول للتصويت', 'warning');
        showAuthModal('login');
        return;
    }
    
    try {
        const serviceRef = db.collection('services').doc(serviceId);
        await serviceRef.update({
            votes: firebase.firestore.FieldValue.increment(value)
        });
        
        await loadServices();
        showToast(value > 0 ? 'شكراً لتقييمك الإيجابي' : 'شكراً لتقييمك', 'success');
    } catch (error) {
        console.error('Error voting:', error);
        showToast('حدث خطأ في التصويت', 'error');
    }
}

// Modal Management
function toggleAddForm() {
    if (addServiceModal.classList.contains('show')) {
        closeAddForm();
    } else {
        showAddForm();
    }
}

function showAddForm() {
    if (!currentUser) {
        showToast('يجب تسجيل الدخول أولاً', 'warning');
        showAuthModal('login');
        return;
    }
    
    addServiceModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeAddForm() {
    addServiceModal.classList.remove('show');
    document.body.style.overflow = 'auto';
    serviceForm.reset();
}

function showAuthModal(mode = 'login') {
    authModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    switchAuthMode(mode);
}

function closeAuthModal() {
    authModal.classList.remove('show');
    document.body.style.overflow = 'auto';
    loginForm.reset();
    registerForm.reset();
}

function switchAuthMode(mode) {
    const authTitle = document.getElementById('authTitle');
    
    if (mode === 'login') {
        authTitle.textContent = 'تسجيل الدخول';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        authTitle.textContent = 'إنشاء حساب جديد';
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

function handleModalClose(e) {
    if (e.target === addServiceModal) {
        closeAddForm();
    }
    if (e.target === authModal) {
        closeAuthModal();
    }
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('يرجى ملء جميع الحقول', 'warning');
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showToast('تم تسجيل الدخول بنجاح ✅', 'success');
        closeAuthModal();
    } catch (error) {
        console.error('Login error:', error);
        let message = 'حدث خطأ في تسجيل الدخول';
        
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'البريد الإلكتروني غير مسجل';
                break;
            case 'auth/wrong-password':
                message = 'كلمة المرور غير صحيحة';
                break;
            case 'auth/invalid-email':
                message = 'البريد الإلكتروني غير صحيح';
                break;
            case 'auth/too-many-requests':
                message = 'تم تجاوز عدد المحاولات المسموح';
                break;
        }
        
        showToast(message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!email || !password || !confirmPassword) {
        showToast('يرجى ملء جميع الحقول', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('كلمات المرور غير متطابقة', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'warning');
        return;
    }
    
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        showToast('تم إنشاء الحساب بنجاح ✅', 'success');
        closeAuthModal();
    } catch (error) {
        console.error('Registration error:', error);
        let message = 'حدث خطأ في إنشاء الحساب';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'البريد الإلكتروني مستخدم بالفعل';
                break;
            case 'auth/invalid-email':
                message = 'البريد الإلكتروني غير صحيح';
                break;
            case 'auth/weak-password':
                message = 'كلمة المرور ضعيفة';
                break;
        }
        
        showToast(message, 'error');
    }
}

function handleAuthStateChange(user) {
    currentUser = user;
    updateAuthUI();
}

function updateAuthUI() {
    const authSection = document.querySelector('.nav-actions');
    
    if (currentUser) {
        authSection.innerHTML = `
            <span class="user-info">مرحباً، ${currentUser.email.split('@')[0]}</span>
            <button class="btn-secondary" onclick="handleLogout()">
                <i class="fas fa-sign-out-alt"></i> خروج
            </button>
        `;
    } else {
        authSection.innerHTML = `
            <button class="btn-secondary" onclick="showAuthModal('login')">
                <i class="fas fa-sign-in-alt"></i> دخول
            </button>
            <button class="btn-primary" onclick="showAuthModal('register')">
                <i class="fas fa-user-plus"></i> تسجيل
            </button>
            <button class="nav-toggle" id="navToggle">
                <span></span>
                <span></span>
                <span></span>
            </button>
        `;
        
        // Re-attach nav toggle event listener
        const newNavToggle = document.getElementById('navToggle');
        if (newNavToggle) {
            newNavToggle.addEventListener('click', toggleNavMenu);
        }
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        showToast('تم تسجيل الخروج بنجاح', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('حدث خطأ في تسجيل الخروج', 'error');
    }
}

// Utility Functions
function updateStats() {
    const totalServicesEl = document.getElementById('totalServices');
    const totalUsersEl = document.getElementById('totalUsers');
    const totalReviewsEl = document.getElementById('totalReviews');
    
    if (totalServicesEl) {
        animateNumber(totalServicesEl, allServices.length);
    }
    
    if (totalUsersEl) {
        const uniqueUsers = new Set(allServices.map(s => s.userId)).size;
        animateNumber(totalUsersEl, uniqueUsers);
    }
    
    if (totalReviewsEl) {
        const totalVotes = allServices.reduce((sum, s) => sum + (s.votes || 0), 0);
        animateNumber(totalReviewsEl, totalVotes);
    }
}

function animateNumber(element, target) {
    const start = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = Date.now();
    
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (target - start) * progress);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    update();
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'أمس';
    } else if (diffDays < 7) {
        return `منذ ${diffDays} أيام`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `منذ ${weeks} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`;
    } else {
        return date.toLocaleDateString('ar-SA');
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutLeft 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        if (addServiceModal.classList.contains('show')) {
            closeAddForm();
        }
        if (authModal.classList.contains('show')) {
            closeAuthModal();
        }
    }
}

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutLeft {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(-100%);
        }
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .user-info {
        color: var(--text-primary);
        font-weight: 500;
        margin-left: 1rem;
    }
    
    .text-muted {
        color: var(--text-secondary);
        font-size: 0.85rem;
    }
`;
document.head.appendChild(style);

