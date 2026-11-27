        let allProducts = [];
        let filteredProducts = [];
        let currentPage = 1;
        const productsPerPage = 6;
        let isInitialLoad = true;

        async function loadProducts() {
            try {
                const response = await fetch('products.json');
                const data = await response.json();
                allProducts = data.products;
                filteredProducts = allProducts;
                
                // Filtre butonlarını oluştur
                createFilterButtons();
                
                // İlk sayfayı göster
                displayPage(1);
                isInitialLoad = false;
                
                // Sayfalama butonlarını oluştur
                createPagination();
                
            } catch (error) {
                console.error('Ürünler yüklenirken hata oluştu:', error);
            }
        }

        function createProductCard(product) {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // Görseller
            const imagesHTML = product.images.map((img, index) => 
                `<img src="${img}" alt="${product.name} - Görsel ${index + 1}" class="product-image ${index === 0 ? 'active' : ''}">`
            ).join('');
            
            // SVG ikonları
            const buyIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z"/></svg>';
            const instagramIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>';
            const youtubeIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>';
            const prevIcon = '<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
            const nextIcon = '<svg viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>';
            
            card.innerHTML = `
                <div class="product-image-container">
                    ${imagesHTML}
                    <div class="product-overlay"></div>
                    <span class="product-badge">${product.badge}</span>
                    <button class="slider-nav prev" aria-label="Önceki görsel">
                        ${prevIcon}
                    </button>
                    <button class="slider-nav next" aria-label="Sonraki görsel">
                        ${nextIcon}
                    </button>
                    <div class="slider-dots"></div>
                    <div class="slider-progress"></div>
                </div>
                <div class="product-content">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-links">
                        <a href="${product.links.buy.url}" class="product-link buy" target="_blank" 
                           data-preview-image="${product.links.buy.previewImage || product.images[0]}" 
                           data-preview-title="${product.links.buy.previewTitle}" 
                           data-preview-desc="${product.links.buy.previewDesc}">
                            ${buyIcon}
                            Satın Al
                        </a>
                        <a href="${product.links.instagram.url}" class="product-link instagram" target="_blank"
                           data-preview-image="${product.links.instagram.previewImage || product.images[0]}" 
                           data-preview-title="${product.links.instagram.previewTitle}" 
                           data-preview-desc="${product.links.instagram.previewDesc}">
                            ${instagramIcon}
                            Instagram
                        </a>
                        <a href="${product.links.youtube.url}" class="product-link youtube" target="_blank"
                           data-preview-image="${product.links.youtube.previewImage || product.images[0]}" 
                           data-preview-title="${product.links.youtube.previewTitle}" 
                           data-preview-desc="${product.links.youtube.previewDesc}">
                            ${youtubeIcon}
                            Video
                        </a>
                    </div>
                </div>
            `;
            
            return card;
        }

        function createFilterButtons() {
            const filterContainer = document.getElementById('filterContainer');
            const tags = ['tümü', ...new Set(allProducts.map(p => p.tag))];
            
            tags.forEach(tag => {
                const btn = document.createElement('button');
                btn.className = 'filter-btn';
                if (tag === 'tümü') btn.classList.add('active');
                const displayText = tag.charAt(0).toUpperCase() + tag.slice(1);
                btn.textContent = displayText;
                btn.setAttribute('aria-label', displayText + ' kategorisi filtresi');
                btn.addEventListener('click', () => {
                    filterProducts(tag);
                    // Tüm butonlardan active sınıfını kaldır
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
                filterContainer.appendChild(btn);
            });
        }

        function filterProducts(tag) {
            currentFilter = tag;
            if (tag === 'tümü') {
                filteredProducts = allProducts;
            } else {
                filteredProducts = allProducts.filter(p => p.tag === tag);
            }
            currentPage = 1;
            displayPage(1);
            createPagination();
        }

        function displayPage(pageNumber) {
            const productGrid = document.getElementById('productGrid');
            productGrid.innerHTML = ''; // Mevcut ürünleri temizle
            
            currentPage = pageNumber;
            const startIndex = (pageNumber - 1) * productsPerPage;
            const endIndex = startIndex + productsPerPage;
            const productsToShow = filteredProducts.slice(startIndex, endIndex);
            
            productsToShow.forEach(product => {
                const productCard = createProductCard(product);
                productGrid.appendChild(productCard);
            });
            
            // Ürünler yüklendikten sonra slider ve animasyonları başlat
            requestAnimationFrame(() => {
                setTimeout(() => {
                    initImageSliders();
                    observeProductCards();
                    initLinkPreviews();
                    initRippleEffects();
                    initTiltEffect();
                }, 200);
            });
            
            // Sayfa değişikliğinde showroom bölümüne scroll yap (ilk yükleme hariç)
            if (!isInitialLoad && pageNumber !== 1) {
                const showroomSection = document.querySelector('.showroom-section');
                if (showroomSection) {
                    showroomSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }

        function createPagination() {
            const paginationBottom = document.getElementById('pagination');
            
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            
            if (totalPages <= 1) {
                paginationBottom.style.display = 'none';
                return;
            }
            
            paginationBottom.innerHTML = '';
            paginationBottom.style.display = 'flex';
            
            // Önceki buton
            const prevBtn = document.createElement('button');
            prevBtn.className = 'pagination-btn prev';
            prevBtn.setAttribute('aria-label', 'Önceki sayfa');
            prevBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
            prevBtn.disabled = currentPage === 1;
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    displayPage(currentPage - 1);
                    updatePaginationButtons();
                }
            });
            paginationBottom.appendChild(prevBtn);
            
            // Sayfa numaraları
            for (let i = 1; i <= totalPages; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'pagination-btn page-number';
                if (i === currentPage) pageBtn.classList.add('active');
                pageBtn.textContent = i;
                pageBtn.setAttribute('aria-label', 'Sayfa ' + i + ' git');
                pageBtn.addEventListener('click', () => {
                    displayPage(i);
                    updatePaginationButtons();
                });
                paginationBottom.appendChild(pageBtn);
            }
            
            // Sonraki buton
            const nextBtn = document.createElement('button');
            nextBtn.className = 'pagination-btn next';
            nextBtn.setAttribute('aria-label', 'Sonraki sayfa');
            nextBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>';
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    displayPage(currentPage + 1);
                    updatePaginationButtons();
                }
            });
            paginationBottom.appendChild(nextBtn);
        }

        function updatePaginationButtons() {
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            const allButtons = document.querySelectorAll('.pagination-btn');
            
            allButtons.forEach(btn => {
                if (btn.classList.contains('prev')) {
                    btn.disabled = currentPage === 1;
                } else if (btn.classList.contains('next')) {
                    btn.disabled = currentPage === totalPages;
                } else if (btn.classList.contains('page-number')) {
                    btn.classList.toggle('active', parseInt(btn.textContent) === currentPage);
                }
            });
        }

        function observeProductCards() {
            const observerOptions = {
                threshold: 0.01,
                rootMargin: '100px 0px 100px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, observerOptions);

            const productCards = document.querySelectorAll('.product-card');
            productCards.forEach((card, index) => {
                card.style.transitionDelay = `${index * 0.15}s`;
                observer.observe(card);
            });
        }

        // Tarayıcının scroll pozisyonunu hatırlamasını engelle
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        
        // Sayfa yüklendiğinde her zaman en üste scroll yap
        window.scrollTo(0, 0);

        // Sayfa yüklendiğinde ürünleri çek
        loadProducts();

        document.getElementById("yil").textContent = new Date().getFullYear();

        // Mouse follower effect
        const mouseGlow = document.getElementById('mouseGlow');
        let mouseX = 0, mouseY = 0;
        let glowX = 0, glowY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animateGlow() {
            glowX += (mouseX - glowX) * 0.1;
            glowY += (mouseY - glowY) * 0.1;
            mouseGlow.style.left = glowX + 'px';
            mouseGlow.style.top = glowY + 'px';
            requestAnimationFrame(animateGlow);
        }
        animateGlow();

        // Parallax effect on mouse move for logo
        const logoContainer = document.querySelector('.logo-3d-container');

        document.addEventListener('mousemove', (e) => {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const moveX = (e.clientX - centerX) / centerX;
            const moveY = (e.clientY - centerY) / centerY;

            // Subtle tilt on logo
            if (logoContainer) {
                logoContainer.style.transform = `rotateX(${moveY * -5}deg) rotateY(${moveX * 5}deg)`;
            }
        });

        // Reset on mouse leave
        document.addEventListener('mouseleave', () => {
            if (logoContainer) {
                logoContainer.style.transform = '';
            }
        });

        // Scroll Animation for Showroom
        const showroomObserverOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const showroomObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, showroomObserverOptions);

        // Observe showroom header
        const showroomHeader = document.querySelector('.showroom-header');
        if (showroomHeader) {
            showroomObserver.observe(showroomHeader);
        }

        function initImageSliders() {
            const sliders = document.querySelectorAll('.product-image-container');
            
            if (sliders.length === 0) {
                console.warn('Slider container bulunamadı');
                return;
            }
            
            sliders.forEach(container => {
                const images = container.querySelectorAll('.product-image');
                const dotsContainer = container.querySelector('.slider-dots');
                const prevBtn = container.querySelector('.slider-nav.prev');
                const nextBtn = container.querySelector('.slider-nav.next');
                const progressBar = container.querySelector('.slider-progress');
                
                if (images.length <= 1) {
                    // Tek görsel varsa kontrolleri gizle
                    if (dotsContainer) dotsContainer.style.display = 'none';
                    if (prevBtn) prevBtn.style.display = 'none';
                    if (nextBtn) nextBtn.style.display = 'none';
                    if (progressBar) progressBar.style.display = 'none';
                    return;
                }
                
                let currentIndex = 0;
                let autoPlayInterval = null;
                let progressInterval = null;
                let isHovering = false;
                const autoPlayDelay = 4000; // 4 saniye
                let progressWidth = 0;
                
                // Dot'ları oluştur
                images.forEach((_, index) => {
                    const dot = document.createElement('button');
                    dot.classList.add('slider-dot');
                    dot.setAttribute('aria-label', 'Slayt ' + (index + 1) + ' Göster');
                    if (index === 0) dot.classList.add('active');
                    dot.addEventListener('click', (e) => {
                        e.stopPropagation();
                        goToSlide(index);
                        resetAutoPlay();
                    });
                    dotsContainer.appendChild(dot);
                });
                
                const dots = dotsContainer.querySelectorAll('.slider-dot');
                
                function goToSlide(index) {
                    images[currentIndex].classList.remove('active');
                    dots[currentIndex].classList.remove('active');
                    
                    currentIndex = index;
                    if (currentIndex >= images.length) currentIndex = 0;
                    if (currentIndex < 0) currentIndex = images.length - 1;
                    
                    images[currentIndex].classList.add('active');
                    dots[currentIndex].classList.add('active');
                    
                    // Progress bar'ı sıfırla
                    progressWidth = 0;
                    if (progressBar) progressBar.style.width = '0%';
                }
                
                function nextSlide() {
                    goToSlide(currentIndex + 1);
                }
                
                function prevSlide() {
                    goToSlide(currentIndex - 1);
                }
                
                function startProgress() {
                    progressWidth = 0;
                    if (progressBar) progressBar.style.width = '0%';
                    
                    if (progressInterval) clearInterval(progressInterval);
                    progressInterval = setInterval(() => {
                        progressWidth += 100 / (autoPlayDelay / 50);
                        if (progressBar) progressBar.style.width = Math.min(progressWidth, 100) + '%';
                    }, 50);
                }
                
                function startAutoPlay() {
                    if (autoPlayInterval) clearInterval(autoPlayInterval);
                    startProgress();
                    autoPlayInterval = setInterval(() => {
                        if (!isHovering) {
                            nextSlide();
                            startProgress();
                        }
                    }, autoPlayDelay);
                }
                
                function resetAutoPlay() {
                    startAutoPlay();
                }
                
                function stopAutoPlay() {
                    if (autoPlayInterval) clearInterval(autoPlayInterval);
                    if (progressInterval) clearInterval(progressInterval);
                }
                
                // Event listeners
                if (prevBtn) {
                    prevBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        prevSlide();
                        resetAutoPlay();
                    });
                }
                
                if (nextBtn) {
                    nextBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        nextSlide();
                        resetAutoPlay();
                    });
                }
                
                // Mouse hover durumunda kullanıcı kontrol edebilsin
                container.addEventListener('mouseenter', () => {
                    isHovering = true;
                    stopAutoPlay();
                });
                
                container.addEventListener('mouseleave', () => {
                    isHovering = false;
                    startAutoPlay();
                });
                
                // Keyboard navigation (when focused)
                container.setAttribute('tabindex', '0');
                container.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowLeft') {
                        prevSlide();
                        resetAutoPlay();
                    } else if (e.key === 'ArrowRight') {
                        nextSlide();
                        resetAutoPlay();
                    }
                });
                
                // Touch/swipe support
                let touchStartX = 0;
                let touchEndX = 0;
                
                container.addEventListener('touchstart', (e) => {
                    touchStartX = e.changedTouches[0].screenX;
                }, { passive: true });
                
                container.addEventListener('touchend', (e) => {
                    touchEndX = e.changedTouches[0].screenX;
                    handleSwipe();
                }, { passive: true });
                
                function handleSwipe() {
                    const swipeThreshold = 50;
                    const diff = touchStartX - touchEndX;
                    
                    if (Math.abs(diff) > swipeThreshold) {
                        if (diff > 0) {
                            nextSlide(); // Sola kaydır = sonraki
                        } else {
                            prevSlide(); // Sağa kaydır = önceki
                        }
                        resetAutoPlay();
                    }
                }
                
                // Autoplay başlat
                startAutoPlay();
            });
        }

        // =============================================
        // LINK PREVIEW FUNCTIONALITY
        // =============================================
        const linkPreview = document.getElementById('linkPreview');
        const previewImageContainer = document.getElementById('previewImageContainer');
        const previewImage = document.getElementById('previewImage');
        const previewPlaceholder = document.getElementById('previewPlaceholder');
        const previewIcon = document.getElementById('previewIcon');
        const previewTitle = document.getElementById('previewTitle');
        const previewDescription = document.getElementById('previewDescription');
        const previewUrl = document.getElementById('previewUrl');
        const previewBadge = document.getElementById('previewBadge');

        // Link preview data configuration
        const linkPreviewData = {
            whatsapp: {
                title: 'WhatsApp ile İletişim',
                description: 'Bize doğrudan WhatsApp üzerinden ulaşabilir, sorularınızı iletebilir ve siparişleriniz hakkında bilgi alabilirsiniz.',
                icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
                badge: '💬 Mesaj Gönder'
            },
            instagram: {
                title: 'Instagram Profilimiz',
                description: 'En son ürünlerimizi, 3D baskı süreçlerimizi ve özel tasarımlarımızı Instagram hesabımızdan takip edebilirsiniz.',
                icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
                badge: '📸 Takip Et'
            },
            gmail: {
                title: 'E-posta Gönder',
                description: 'Bizimle e-posta yoluyla iletişime geçin. Sorularınızı, önerilerinizi veya özel tasarım isteklerinizi iletin.',
                icon: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
                badge: '📧 Mail Gönder'
            },
            seller: {
                title: 'Satıcı Mağazamız',
                description: 'Tüm ürünlerimizi güvenle satın alabileceğiniz online mağazamızı ziyaret edin. Hızlı kargo ve güvenli ödeme.',
                icon: 'M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12zm-7-8c-1.66 0-3-1.34-3-3H7c0 2.76 2.24 5 5 5s5-2.24 5-5h-2c0 1.66-1.34 3-3 3z',
                badge: '🛒 Mağazaya Git'
            },
            buy: {
                title: 'Ürünü Satın Al',
                description: 'Bu ürünü hemen satın almak için tıklayın. Güvenli ödeme ve hızlı kargo seçenekleri mevcuttur.',
                icon: 'M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z',
                badge: '🛒 Satın Al'
            },
            youtube: {
                title: 'Ürün Videosu',
                description: 'Bu ürünün detaylı tanıtım videosunu izleyin. Ürün özellikleri ve kullanım şeklini görebilirsiniz.',
                icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
                badge: '▶️ Video İzle'
            }
        };

        // Get link type from element classes
        function getLinkType(element) {
            if (element.classList.contains('whatsapp')) return 'whatsapp';
            if (element.classList.contains('instagram')) return 'instagram';
            if (element.classList.contains('gmail')) return 'gmail';
            if (element.classList.contains('seller')) return 'seller';
            if (element.classList.contains('buy')) return 'buy';
            if (element.classList.contains('youtube')) return 'youtube';
            return null;
        }

        // Show link preview
        function showLinkPreview(element, event) {
            const linkType = getLinkType(element);
            if (!linkType || !linkPreviewData[linkType]) return;

            const data = linkPreviewData[linkType];
            const href = element.getAttribute('href') || '#';
            
            // Check for custom data attributes
            const customImage = element.getAttribute('data-preview-image');
            const customTitle = element.getAttribute('data-preview-title');
            const customDesc = element.getAttribute('data-preview-desc');

            // Set preview image/video or placeholder
            if (customImage) {
                // Check if the URL is a video (.mp4, .webm, .ogg)
                const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(customImage);
                
                if (isVideo) {
                    // Remove existing img/video elements
                    const existingMedia = previewImageContainer.querySelector('img, video');
                    if (existingMedia) {
                        existingMedia.remove();
                    }
                    
                    // Create video element
                    const videoElement = document.createElement('video');
                    videoElement.id = 'previewImage';
                    videoElement.autoplay = true;
                    videoElement.loop = true;
                    videoElement.muted = true;
                    videoElement.playsInline = true;
                    videoElement.style.display = 'block';
                    videoElement.src = customImage;
                    
                    // Insert before placeholder
                    previewImageContainer.insertBefore(videoElement, previewPlaceholder);
                    previewImageContainer.classList.add('has-image');
                } else {
                    // Remove existing video if exists
                    const existingVideo = previewImageContainer.querySelector('video');
                    if (existingVideo) {
                        existingVideo.remove();
                    }
                    
                    // Create or reuse img element
                    let imgElement = previewImageContainer.querySelector('img');
                    if (!imgElement) {
                        imgElement = document.createElement('img');
                        imgElement.id = 'previewImage';
                        imgElement.alt = 'Preview';
                        previewImageContainer.insertBefore(imgElement, previewPlaceholder);
                    }
                    
                    imgElement.src = customImage;
                    imgElement.style.display = 'block';
                    previewImageContainer.classList.add('has-image');
                }
            } else {
                // Hide any existing media
                const existingMedia = previewImageContainer.querySelector('img, video');
                if (existingMedia) {
                    existingMedia.style.display = 'none';
                }
                previewImageContainer.classList.remove('has-image');
            }

            // Set preview content
            previewPlaceholder.className = 'link-preview-image-placeholder ' + linkType;
            previewIcon.innerHTML = '<path d="' + data.icon + '"/>';
            previewTitle.textContent = customTitle || data.title;
            previewDescription.textContent = customDesc || data.description;
            previewUrl.textContent = href.replace(/^https?:\/\//, '').substring(0, 35) + (href.length > 35 ? '...' : '');
            previewBadge.className = 'link-preview-badge ' + linkType;
            previewBadge.textContent = data.badge;

            // Position the preview
            updatePreviewPosition(event);

            // Show preview
            linkPreview.classList.add('visible');
        }

        // Update preview position based on mouse
        function updatePreviewPosition(event) {
            const padding = 20;
            const previewWidth = 320;
            const previewHeight = 280;
            
            let x = event.clientX + padding;
            let y = event.clientY + padding;

            // Check right boundary
            if (x + previewWidth > window.innerWidth) {
                x = event.clientX - previewWidth - padding;
            }

            // Check bottom boundary
            if (y + previewHeight > window.innerHeight) {
                y = event.clientY - previewHeight - padding;
            }

            // Ensure minimum boundaries
            x = Math.max(padding, x);
            y = Math.max(padding, y);

            linkPreview.style.left = x + 'px';
            linkPreview.style.top = y + 'px';
        }

        // Hide link preview
        function hideLinkPreview() {
            linkPreview.classList.remove('visible');
        }

        // Initialize link previews for all previewable links
        function initLinkPreviews() {
            const previewableLinks = document.querySelectorAll('.social-btn, .product-link');
            
            previewableLinks.forEach(link => {
                let hoverTimeout;

                link.addEventListener('mouseenter', (e) => {
                    hoverTimeout = setTimeout(() => {
                        showLinkPreview(link, e);
                    }, 300); // Small delay before showing
                });

                link.addEventListener('mousemove', (e) => {
                    if (linkPreview.classList.contains('visible')) {
                        updatePreviewPosition(e);
                    }
                });

                link.addEventListener('mouseleave', () => {
                    clearTimeout(hoverTimeout);
                    hideLinkPreview();
                });
            });
        }

        // Initialize previews for static links (social buttons in hero)
        initLinkPreviews();

        // =============================================
        // RIPPLE EFFECT FOR BUTTONS
        // =============================================
        function createRipple(event) {
            const button = event.currentTarget;
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
            
            button.appendChild(ripple);
            
            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        }

        // Initialize ripple effects
        function initRippleEffects() {
            document.querySelectorAll('.social-btn, .product-link').forEach(btn => {
                btn.addEventListener('click', createRipple);
            });
        }

        // Initialize ripple for static buttons
        initRippleEffects();

        // =============================================
        // TILT EFFECT FOR PRODUCT CARDS
        // =============================================
        function initTiltEffect() {
            const cards = document.querySelectorAll('.product-card');
            
            cards.forEach(card => {
                // Store original transform state
                let isHovering = false;
                let animationId = null;
                let currentX = 0;
                let currentY = 0;
                let targetX = 0;
                let targetY = 0;
                
                // Smooth animation loop
                function animate() {
                    if (!isHovering) {
                        // Smoothly return to original position
                        currentX += (0 - currentX) * 0.1;
                        currentY += (0 - currentY) * 0.1;
                    } else {
                        // Smoothly move to target position
                        currentX += (targetX - currentX) * 0.15;
                        currentY += (targetY - currentY) * 0.15;
                    }
                    
                    // Apply transform
                    const transform = `perspective(1000px) rotateX(${currentY}deg) rotateY(${currentX}deg) translateY(${isHovering ? -10 : 0}px) scale(${isHovering ? 1.02 : 1})`;
                    card.style.transform = transform;
                    
                    // Continue animation if values haven't settled
                    if (Math.abs(currentX) > 0.01 || Math.abs(currentY) > 0.01 || isHovering) {
                        animationId = requestAnimationFrame(animate);
                    }
                }
                
                // Use event delegation - only track mouse on the card itself
                card.addEventListener('mouseenter', (e) => {
                    isHovering = true;
                    card.classList.add('tilt-active');
                    if (animationId) cancelAnimationFrame(animationId);
                    animationId = requestAnimationFrame(animate);
                });
                
                card.addEventListener('mousemove', (e) => {
                    if (!isHovering) return;
                    
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    // Calculate rotation (inverted for natural feel)
                    targetX = ((x - centerX) / centerX) * 12; // Max 12 degrees (reduced for smoother feel)
                    targetY = ((centerY - y) / centerY) * 12;
                });
                
                card.addEventListener('mouseleave', (e) => {
                    // Check if we're actually leaving the card (not entering a child)
                    const relatedTarget = e.relatedTarget;
                    if (relatedTarget && card.contains(relatedTarget)) {
                        return; // Still inside the card, don't reset
                    }
                    
                    isHovering = false;
                    card.classList.remove('tilt-active');
                    targetX = 0;
                    targetY = 0;
                    if (animationId) cancelAnimationFrame(animationId);
                    animationId = requestAnimationFrame(animate);
                });
            });
        }
        
        // Initialize tilt effect after cards are visible
        setTimeout(initTiltEffect, 100);

        // =============================================
        // TYPING EFFECT FOR SUBTITLE (Optional Enhancement)
        // =============================================
        const subtitle = document.querySelector('.hero-subtitle');
        if (subtitle) {
            const originalText = subtitle.textContent;
            subtitle.setAttribute('data-text', originalText);
        }

        // =============================================
        // PARALLAX STARS/PARTICLES ON SCROLL
        // =============================================
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const particles = document.querySelectorAll('.particle');
            
            particles.forEach((particle, index) => {
                const speed = 0.1 + (index * 0.02);
                particle.style.transform = `translateY(${scrolled * speed}px)`;
            });
            
            // Parallax for orbs
            const orbs = document.querySelectorAll('.orb');
            orbs.forEach((orb, index) => {
                const speed = 0.05 + (index * 0.02);
                orb.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });

        // ===============================
        // Tab Visibility & Title Change
        // ===============================
        (function() {
            const originalTitle = document.title;
            const altTitles = ["Buradayız", "Bizi unutma 🥺 "];
            let titleTimer = null;
            let altIndex = 0;
            let altInterval = null;

            function startTitleChange() {
                if (titleTimer) return;
                titleTimer = setTimeout(() => {
                    altInterval = setInterval(() => {
                        document.title = altTitles[altIndex % altTitles.length];
                        altIndex++;
                    }, 5000); // Change every 5 seconds
                }, 20000); // 20 seconds
            }

            function stopTitleChange() {
                clearTimeout(titleTimer);
                titleTimer = null;
                clearInterval(altInterval);
                altInterval = null;
                altIndex = 0;
                document.title = originalTitle;
            }

            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    startTitleChange();
                } else {
                    stopTitleChange();
                }
            });
        })();
window.addEventListener('load', function() {
  setTimeout(function() {
    document.getElementById('loader').style.display = 'none';
  }, 1000); // 1000 ms = 1 saniye
});