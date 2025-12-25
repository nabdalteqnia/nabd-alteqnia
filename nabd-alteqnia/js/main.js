// ========== تهيئة التطبيق ==========

// بيانات التطبيق
const App = {
    products: [],
    currentFilter: 'all',
    visibleProducts: 8,
    cart: [],
    
    // تهيئة التطبيق
    init: function() {
        this.initElements();
        this.initEvents();
        this.loadProducts();
        this.updateYear();
        this.checkAuth();
    },
    
    // تعريف العناصر
    initElements: function() {
        // العناصر الأساسية
        this.elements = {
            mobileMenuBtn: document.getElementById('mobileMenuBtn'),
            closeSidebar: document.getElementById('closeSidebar'),
            mobileSidebar: document.getElementById('mobileSidebar'),
            overlay: document.getElementById('overlay'),
            navLinks: document.querySelectorAll('.nav-link'),
            filterButtons: document.querySelectorAll('.filter-btn'),
            productsGrid: document.getElementById('productsGrid'),
            loadMoreBtn: document.getElementById('loadMore'),
            backToTop: document.getElementById('backToTop'),
            modal: document.getElementById('productModal'),
            modalOverlay: document.getElementById('modalOverlay'),
            modalClose: document.getElementById('modalClose'),
            modalBody: document.getElementById('modalBody'),
            inquiryForm: document.getElementById('inquiryForm'),
            submitBtn: document.getElementById('submitBtn')
        };
    },
    
    // إضافة الأحداث
    initEvents: function() {
        // القائمة المتنقلة
        if (this.elements.mobileMenuBtn) {
            this.elements.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu(true));
        }
        
        if (this.elements.closeSidebar) {
            this.elements.closeSidebar.addEventListener('click', () => this.toggleMobileMenu(false));
        }
        
        if (this.elements.overlay) {
            this.elements.overlay.addEventListener('click', () => this.toggleMobileMenu(false));
        }
        
        // روابط التنقل
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });
        
        // أزرار الفلترة
        this.elements.filterButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleFilterClick(e));
        });
        
        // زر تحميل المزيد
        if (this.elements.loadMoreBtn) {
            this.elements.loadMoreBtn.addEventListener('click', () => this.loadMoreProducts());
        }
        
        // زر العودة للأعلى
        if (this.elements.backToTop) {
            window.addEventListener('scroll', () => this.handleScroll());
            this.elements.backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        }
        
        // النموذج
        if (this.elements.inquiryForm) {
            this.elements.inquiryForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        // إغلاق النموذج
        if (this.elements.modalClose) {
            this.elements.modalClose.addEventListener('click', () => this.closeModal());
        }
        
        if (this.elements.modalOverlay) {
            this.elements.modalOverlay.addEventListener('click', () => this.closeModal());
        }
        
        // إغلاق النموذج بـ ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.modal.style.display === 'block') {
                this.closeModal();
            }
        });
        
        // تحديث شريط التنقل عند التمرير
        window.addEventListener('scroll', () => this.updateNavbar());
    },
    
    // ========== إدارة القائمة المتنقلة ==========
    toggleMobileMenu: function(show) {
        if (show) {
            this.elements.mobileSidebar.classList.add('active');
            this.elements.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            this.elements.mobileSidebar.classList.remove('active');
            this.elements.overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    },
    
    // ========== تحميل المنتجات ==========
    loadProducts: async function() {
        try {
            const response = await fetch('data/products.json');
            const data = await response.json();
            this.products = data.products || [];
            this.displayProducts();
        } catch (error) {
            console.error('خطأ في تحميل المنتجات:', error);
            this.showError('حدث خطأ في تحميل المنتجات. يرجى تحديث الصفحة.');
        }
    },
    
    // عرض المنتجات
    displayProducts: function() {
        if (!this.elements.productsGrid) return;
        
        // تصفية المنتجات
        let filteredProducts = this.products;
        
        if (this.currentFilter !== 'all') {
            if (this.currentFilter === 'new') {
                // المنتجات الجديدة (آخر 7 أيام)
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                filteredProducts = this.products.filter(product => 
                    new Date(product.createdAt) > weekAgo
                );
            } else {
                filteredProducts = this.products.filter(product => 
                    product.category === this.currentFilter
                );
            }
        }
        
        // تحديد المنتجات المرئية
        const visibleProducts = filteredProducts.slice(0, this.visibleProducts);
        
        if (visibleProducts.length === 0) {
            this.elements.productsGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <h3>لا توجد منتجات في هذه الفئة</h3>
                    <p>جرب فئة أخرى أو عد لاحقاً</p>
                </div>
            `;
            this.elements.loadMoreBtn.style.display = 'none';
            return;
        }
        
        // إنشاء المنتجات
        let productsHTML = '';
        visibleProducts.forEach(product => {
            productsHTML += this.createProductCard(product);
        });
        
        this.elements.productsGrid.innerHTML = productsHTML;
        
        // إضافة أحداث للمنتجات
        this.addProductEvents();
        
        // التحكم في زر تحميل المزيد
        if (filteredProducts.length > this.visibleProducts) {
            this.elements.loadMoreBtn.style.display = 'block';
        } else {
            this.elements.loadMoreBtn.style.display = 'none';
        }
    },
    
    // إنشاء بطاقة منتج
    createProductCard: function(product) {
        const discount = product.originalPrice && product.originalPrice > product.price 
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0;
        
        return `
            <div class="product-card" data-id="${product.id}" data-category="${product.category}">
                ${discount > 0 ? `<span class="product-badge">خصم ${discount}%</span>` : ''}
                ${product.tags && product.tags.includes('جديد') ? `<span class="product-badge new">جديد</span>` : ''}
                
                <div class="product-image">
                    <img src="${product.image}" 
                         alt="${product.name}"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/400x300/1a237e/ffffff?text=نبض+التقنية'">
                </div>
                
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    
                    <div class="product-price">
                        ${product.price} : ${product.coin} 
                        ${product.originalPrice && product.originalPrice > product.price 
                            ? `<span class="original-price">${product.originalPrice} </span>` 
                            : ''}
                            <span class="original-price">${product.coin} </span>
                    </div>
                    
                    <div class="product-features">
                        <ul>
                            ${product.features ? product.features.slice(0, 3).map(feature => 
                                `<li><i class="fas fa-check"></i> ${feature}</li>`
                            ).join('') : ''}
                        </ul>
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn btn-view" data-id="${product.id}">
                            <i class="fas fa-eye"></i> عرض التفاصيل
                        </button>
                        <a href="https://wa.me/967778122378?text=${encodeURIComponent(this.createWhatsAppMessage(product))}" 
                           class="btn btn-whatsapp" target="_blank">
                            <i class="fab fa-whatsapp"></i> طلب
                        </a>
                    </div>
                </div>
            </div>
        `;
    },
    
    // إنشاء رسالة واتساب
    createWhatsAppMessage: function(product) {
        return `مرحباً، أريد طلب المنتج التالي من متجر نبض التقنية:

المنتج: ${product.name}
السعر: ${product.price} ريال
الرقم: #${product.id}

معلوماتي:
الاسم: 
المدينة: 
الكمية: 1

أرجو التواصل معي لإتمام عملية الشراء.`;
    },
    
    // ========== أحداث المنتجات ==========
    addProductEvents: function() {
        // أزرار عرض التفاصيل
        document.querySelectorAll('.btn-view').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.id;
                this.showProductDetails(productId);
            });
        });
        
        // أزرار شراء عبر واتساب
        document.querySelectorAll('.btn-whatsapp').forEach(link => {
            link.addEventListener('click', (e) => {
                // تتبع عملية الشراء
                const productId = e.currentTarget.closest('.product-card').dataset.id;
                this.trackPurchase(productId);
            });
        });
    },
    
    // ========== تفاصيل المنتج ==========
    showProductDetails: function(productId) {
        const product = this.products.find(p => p.id == productId);
        if (!product) return;
        
        const modalBody = this.elements.modalBody;
        if (!modalBody) return;
        
        // إنشاء محتوى التفاصيل
        modalBody.innerHTML = this.createProductDetailsHTML(product);
        
        // عرض النموذج
        this.elements.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // إضافة أحداث للصور في النموذج
        this.addModalImageEvents();
    },
    
    // إنشاء HTML لتفاصيل المنتج
    createProductDetailsHTML: function(product) {
        return `
            <div class="product-details">
                <div class="detail-gallery">
                    <div class="main-image">
                        <img src="${product.image}" 
                             alt="${product.name}"
                             id="mainImage"
                             onerror="this.src='https://via.placeholder.com/600x400/1a237e/ffffff?text=نبض+التقنية'">
                    </div>
                </div>
                
                <div class="detail-info">
                    <h2 class="detail-title">${product.name}</h2>
                    
                    <div class="detail-price-section">
                        <span class="current-price">${product.price} ريال</span>
                        ${product.originalPrice && product.originalPrice > product.price 
                            ? `<span class="original-price">${product.originalPrice} ريال</span>` 
                            : ''}
                    </div>
                    
                    <div class="detail-description">
                        <h3><i class="fas fa-info-circle"></i> وصف المنتج</h3>
                        <p>${product.fullDescription || product.description}</p>
                    </div>
                    
                    <div class="detail-specifications">
                        <h3><i class="fas fa-list-check"></i> المواصفات</h3>
                        <ul class="specs-list">
                            ${product.features ? product.features.map(feature => 
                                `<li><i class="fas fa-check"></i> ${feature}</li>`
                            ).join('') : '<li>لا توجد مواصفات مفصلة</li>'}
                        </ul>
                    </div>
                    
                    <div class="detail-actions">
                        <a href="https://wa.me/967778122378?text=${encodeURIComponent(this.createWhatsAppMessage(product))}" 
                           class="btn btn-whatsapp" target="_blank">
                            <i class="fab fa-whatsapp"></i> طلب عبر واتساب
                        </a>
                        <button class="btn btn-secondary" onclick="App.closeModal()">
                            <i class="fas fa-times"></i> إغلاق
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // إغلاق النموذج
    closeModal: function() {
        this.elements.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    },
    
    // ========== الفلترة ==========
    handleFilterClick: function(e) {
        // تحديث الأزرار النشطة
        this.elements.filterButtons.forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        // تحديث الفلتر الحالي
        this.currentFilter = e.currentTarget.dataset.filter;
        this.visibleProducts = 8;
        
        // إعادة عرض المنتجات
        this.displayProducts();
    },
    
    // ========== تحميل المزيد ==========
    loadMoreProducts: function() {
        this.visibleProducts += 4;
        this.displayProducts();
        
        // التمرير لأسفل قليلاً
        setTimeout(() => {
            this.elements.productsGrid.lastElementChild.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }, 100);
    },
    
    // ========== التنقل ==========
    handleNavClick: function(e) {
        e.preventDefault();
        
        // تحديث الروابط النشطة
        this.elements.navLinks.forEach(link => link.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        // إغلاق القائمة المتنقلة إذا كانت مفتوحة
        this.toggleMobileMenu(false);
        
        // التمرير للقسم المطلوب
        const targetId = e.currentTarget.getAttribute('href');
        if (targetId.startsWith('#')) {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offset = 80;
                const targetPosition = targetElement.offsetTop - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }
    },
    
    // تحديث شريط التنقل
    updateNavbar: function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // زر العودة للأعلى
        if (this.elements.backToTop) {
            if (window.scrollY > 300) {
                this.elements.backToTop.classList.add('visible');
            } else {
                this.elements.backToTop.classList.remove('visible');
            }
        }
        
        // تحديث الروابط النشطة بناءً على الموقع
        this.updateActiveNavLink();
    },
    
    // تحديث الروابط النشطة
    updateActiveNavLink: function() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                this.elements.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
                
                // تحديث القائمة الجانبية
                const sidebarLink = document.querySelector(`.sidebar-links a[href="#${sectionId}"]`);
                if (sidebarLink) {
                    document.querySelectorAll('.sidebar-links a').forEach(link => link.classList.remove('active'));
                    sidebarLink.classList.add('active');
                }
            }
        });
    },
    
    // ========== النموذج ==========
    handleFormSubmit: async function(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }
        
        // تعطيل زر الإرسال
        const submitBtn = this.elements.submitBtn;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
        submitBtn.disabled = true;
        
        try {
            // جمع البيانات
            const formData = new FormData(this.elements.inquiryForm);
            const data = Object.fromEntries(formData);
            
            // إنشاء رابط واتساب
            const message = `استفسار جديد من موقع نبض التقنية:
            
الاسم: ${data.name}
الهاتف: ${data.phone}
البريد: ${data.email || 'لم يتم تقديمه'}
الرسالة: ${data.message}

التاريخ: ${new Date().toLocaleString('ar-SA')}`;
            
            const whatsappURL = `https://wa.me/967778122378?text=${encodeURIComponent(message)}`;
            
            // فتح واتساب
            window.open(whatsappURL, '_blank');
            
            // إعادة تعيين النموذج
            this.elements.inquiryForm.reset();
            
            // رسالة نجاح
            this.showSuccess('تم إرسال استفسارك بنجاح! سيتم التواصل معك قريباً.');
            
            // تتبع الاستفسار
            this.trackInquiry(data);
            
        } catch (error) {
            console.error('خطأ في إرسال النموذج:', error);
            this.showError('حدث خطأ في إرسال الاستفسار. يرجى المحاولة مرة أخرى.');
        } finally {
            // إعادة تفعيل زر الإرسال
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    },
    
    // التحقق من صحة النموذج
    validateForm: function() {
        let isValid = true;
        const errors = {
            name: document.getElementById('nameError'),
            phone: document.getElementById('phoneError'),
            email: document.getElementById('emailError'),
            message: document.getElementById('messageError')
        };
        
        // مسح الأخطاء السابقة
        Object.values(errors).forEach(error => {
            if (error) error.style.display = 'none';
        });
        
        // التحقق من الاسم
        const name = document.getElementById('name').value.trim();
        if (!name || name.length < 2) {
            if (errors.name) {
                errors.name.textContent = 'الاسم يجب أن يكون على الأقل حرفين';
                errors.name.style.display = 'block';
            }
            isValid = false;
        }
        
        // التحقق من الهاتف
        const phone = document.getElementById('phone').value.trim();
        const phoneRegex = /^967\d{9}$/;
        if (!phone || !phoneRegex.test(phone)) {
            if (errors.phone) {
                errors.phone.textContent = 'رقم الهاتف يجب أن يبدأ بـ 967 ويتكون من 9 أرقام';
                errors.phone.style.display = 'block';
            }
            isValid = false;
        }
        
        // التحقق من البريد الإلكتروني
        const email = document.getElementById('email').value.trim();
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (errors.email) {
                    errors.email.textContent = 'البريد الإلكتروني غير صالح';
                    errors.email.style.display = 'block';
                }
                isValid = false;
            }
        }
        
        // التحقق من الرسالة
        const message = document.getElementById('message').value.trim();
        if (!message || message.length < 10) {
            if (errors.message) {
                errors.message.textContent = 'الرسالة يجب أن تكون على الأقل 10 أحرف';
                errors.message.style.display = 'block';
            }
            isValid = false;
        }
        
        return isValid;
    },
    
    // ========== الخدمات المساعدة ==========
    updateYear: function() {
        document.getElementById('currentYear').textContent = new Date().getFullYear();
    },
    
    showError: function(message) {
        // إنشاء عنصر الرسالة
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
                <button class="error-close">&times;</button>
            </div>
        `;
        
        // إضافة الرسالة
        document.body.appendChild(errorDiv);
        
        // إضافة أنماط للرسالة
        const style = document.createElement('style');
        style.textContent = `
            .error-message {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f44336;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
                z-index: 9999;
                animation: slideIn 0.3s ease;
                max-width: 400px;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            .error-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .error-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                margin-right: auto;
                padding: 0;
            }
        `;
        document.head.appendChild(style);
        
        // إزالة الرسالة بعد 5 ثوانٍ
        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
        
        // زر الإغلاق
        errorDiv.querySelector('.error-close').addEventListener('click', () => {
            errorDiv.remove();
        });
    },
    
    showSuccess: function(message) {
        // إنشاء عنصر الرسالة
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <div class="success-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
                <button class="success-close">&times;</button>
            </div>
        `;
        
        // إضافة الرسالة
        document.body.appendChild(successDiv);
        
        // إضافة أنماط للرسالة
        const style = document.createElement('style');
        style.textContent = `
            .success-message {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4caf50;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
                z-index: 9999;
                animation: slideIn 0.3s ease;
                max-width: 400px;
            }
            
            .success-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .success-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                margin-right: auto;
                padding: 0;
            }
        `;
        document.head.appendChild(style);
        
        // إزالة الرسالة بعد 5 ثوانٍ
        setTimeout(() => {
            successDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => successDiv.remove(), 300);
        }, 5000);
        
        // زر الإغلاق
        successDiv.querySelector('.success-close').addEventListener('click', () => {
            successDiv.remove();
        });
    },
    
    // تتبع الأحداث
    trackPurchase: function(productId) {
        console.log('تم تتبع عملية شراء المنتج:', productId);
        // يمكنك إضافة كود Google Analytics هنا
    },
    
    trackInquiry: function(data) {
        console.log('تم تتبع استفسار:', data);
        // يمكنك إضافة كود Google Analytics هنا
    },
    
    // التحقق من المصادقة
    checkAuth: function() {
        // التحقق من دخول المدير
        const isAdmin = localStorage.getItem('nabdAdminLoggedIn') === 'true';
        if (isAdmin) {
            // إضافة زر الإدارة
            const adminBtn = document.createElement('a');
            adminBtn.href = 'admin.html';
            adminBtn.className = 'admin-floating-btn';
            adminBtn.innerHTML = '<i class="fas fa-cog"></i>';
            adminBtn.title = 'لوحة التحكم';
            document.body.appendChild(adminBtn);
            
            // أنماط زر الإدارة
            const style = document.createElement('style');
            style.textContent = `
                .admin-floating-btn {
                    position: fixed;
                    bottom: 100px;
                    left: 20px;
                    width: 50px;
                    height: 50px;
                    background: #ff4081;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    box-shadow: 0 4px 12px rgba(255, 64, 129, 0.3);
                    z-index: 900;
                    transition: all 0.3s ease;
                }
                
                .admin-floating-btn:hover {
                    transform: scale(1.1);
                    background: #c60055;
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    // أحداث الصور في النموذج
    addModalImageEvents: function() {
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            mainImage.addEventListener('click', function() {
                this.classList.toggle('zoomed');
            });
        }
    },
    
    // التحكم في التمرير
    handleScroll: function() {
        // تم تنفيذه في updateNavbar
    }
};

// ========== تهيئة التطبيق عند تحميل الصفحة ==========
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// ========== دعم Service Worker ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('ServiceWorker registered:', registration);
        }).catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}

// ========== دعم PWA ==========
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // إظهار زر التثبيت
    const installBtn = document.createElement('button');
    installBtn.className = 'install-btn';
    installBtn.innerHTML = '<i class="fas fa-download"></i> تثبيت التطبيق';
    installBtn.style.cssText = `
        position: fixed;
        bottom: 180px;
        left: 20px;
        background: linear-gradient(135deg, #1a237e, #311b92);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        font-family: 'Cairo', sans-serif;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(26, 35, 126, 0.3);
        z-index: 900;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
    `;
    
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installBtn.remove();
            }
            deferredPrompt = null;
        }
    });
    
    document.body.appendChild(installBtn);
    
    // إخفاء الزر بعد 10 ثوانٍ
    setTimeout(() => {
        installBtn.style.opacity = '0';
        setTimeout(() => installBtn.remove(), 300);
    }, 10000);
});

// ========== تحسينات إضافية ==========
// تحميل الصور عند ظهورها
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
}

// منع السلوك الافتراضي للنماذج
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
        if (!form.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
        }
        form.classList.add('was-validated');
    }, false);
});

// تحسين أداء الصور
document.querySelectorAll('img').forEach(img => {
    img.loading = 'lazy';
});

// أنماط إضافية لتحسين UX
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    /* تحسينات للصور في النموذج */
    .detail-gallery {
        margin-bottom: 2rem;
    }
    
    .main-image {
        width: 100%;
        height: 300px;
        overflow: hidden;
        border-radius: 12px;
        cursor: zoom-in;
    }
    
    .main-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
    }
    
    .main-image img.zoomed {
        transform: scale(1.5);
        cursor: zoom-out;
    }
    
    /* تفاصيل المنتج في النموذج */
    .detail-title {
        font-size: 1.75rem;
        margin-bottom: 1rem;
        color: #1a237e;
    }
    
    .detail-price-section {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .current-price {
        font-size: 2rem;
        font-weight: 700;
        color: #311b92;
    }
    
    .detail-description,
    .detail-specifications {
        margin-bottom: 2rem;
    }
    
    .detail-description h3,
    .detail-specifications h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        color: #1a237e;
    }
    
    .specs-list {
        list-style: none;
        padding: 0;
    }
    
    .specs-list li {
        padding: 0.5rem 0;
        border-bottom: 1px solid #eee;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .specs-list li i {
        color: #4caf50;
    }
    
    .detail-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }
    
    .detail-actions .btn {
        flex: 1;
    }
    
    /* تحسينات للشاشات الصغيرة */
    @media (max-width: 768px) {
        .detail-gallery {
            height: 250px;
        }
        
        .detail-title {
            font-size: 1.5rem;
        }
        
        .current-price {
            font-size: 1.75rem;
        }
        
        .detail-actions {
            flex-direction: column;
        }
    }
    
    /* رسائل الخطأ والنجاح */
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    /* تحسينات للأداء */
    .product-card,
    .category-card {
        will-change: transform;
    }
    
    /* دعم اللمس */
    @media (hover: none) {
        .product-card:hover {
            transform: none;
        }
        
        .btn:hover {
            transform: none;
        }
    }
    
    /* طباعة */
    @media print {
        .whatsapp-float,
        .back-to-top,
        .mobile-menu-btn,
        .admin-floating-btn {
            display: none !important;
        }
    }
`;
document.head.appendChild(additionalStyles);
