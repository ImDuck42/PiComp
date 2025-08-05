//==============================================================================
// CUSTOM ERROR FOR USER CANCELLATION
//==============================================================================
class UserCancellationError extends Error {
    constructor(message) {
        super(message);
        this.name = "UserCancellationError";
    }
}

//==============================================================================
// ENHANCED IMAGE COMPARATOR CLASS
//==============================================================================
class EnhancedImageComparator {
    //==============================================================================
    // CONSTRUCTOR & INITIALIZATION
    //==============================================================================
    constructor() {
        this.images = { img1: null, img2: null };
        this.files = { file1: null, file2: null };
        this.isComparing = false;
        this.stopRequested = false;
        this.hoveredUploadArea = null;
        
        this.settings = this.loadSettings();
        this.initializeDOMElements();
        this.bindEvents();
        this.updateSettingsUI();
    }

    initializeDOMElements() {
        this.elements = {
            body: document.body,
            upload1: document.getElementById('upload1'),
            upload2: document.getElementById('upload2'),
            file1: document.getElementById('file1'),
            file2: document.getElementById('file2'),
            img1: document.getElementById('img1'),
            img2: document.getElementById('img2'),
            preview1: document.getElementById('preview1'),
            preview2: document.getElementById('preview2'),
            remove1: document.getElementById('remove1'),
            remove2: document.getElementById('remove2'),
            fileInfo1: document.getElementById('file-info1'),
            fileInfo2: document.getElementById('file-info2'),
            compareBtn: document.getElementById('compare-btn'),
            stopBtn: document.getElementById('stop-btn'),
            metadataSection: document.getElementById('metadata-section'),
            metadataContent: document.getElementById('metadata-content'),
            progressSection: document.getElementById('progress-section'),
            progressFill: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            currentPosition: document.getElementById('current-position'),
            pixelsProcessed: document.getElementById('pixels-processed'),
            currentSimilarity: document.getElementById('current-similarity'),
            resultsSection: document.getElementById('results-section'),
            similarityScore: document.getElementById('similarity-score'),
            totalPixels: document.getElementById('total-pixels'),
            matchingPixels: document.getElementById('matching-pixels'),
            differentPixels: document.getElementById('different-pixels'),
            imageDimensions: document.getElementById('image-dimensions'),
            imageDimensionsCard: document.getElementById('image-dimensions-card'),
            processingTime: document.getElementById('processing-time'),
            showDiffIcon: document.getElementById('show-diff-icon'),
            diffModal: document.getElementById('diff-modal'),
            diffModalClose: document.getElementById('diff-modal-close'),
            diffCanvas: document.getElementById('diff-canvas'),
            settingsBtn: document.getElementById('settings-btn'),
            settingsModal: document.getElementById('settings-modal'),
            settingsModalClose: document.getElementById('settings-modal-close'),
            saveSettingsBtn: document.getElementById('save-settings-btn'),
            thresholdSlider: document.getElementById('threshold-slider'),
            thresholdValue: document.getElementById('threshold-value'),
            diffColorInput: document.getElementById('diff-color'),
            diffColorSwatch: document.getElementById('diff-color-swatch'),
            matchColorInput: document.getElementById('match-color'),
            matchColorSwatch: document.getElementById('match-color-swatch'),
            averageSizeCheckbox: document.getElementById('average-size-checkbox'),
            regionX1: document.getElementById('region-x1'),
            regionY1: document.getElementById('region-y1'),
            regionX2: document.getElementById('region-x2'),
            regionY2: document.getElementById('region-y2'),
            regionPreviewImage: document.getElementById('region-preview-image'),
            regionPreviewText: document.querySelector('.region-preview-text'),
            regionBox: document.getElementById('region-box'),
            regionPreview: document.getElementById('region-preview'),
            navMetadataLink: document.getElementById('nav-metadata'),
            navResultsLink: document.getElementById('nav-results'),
        };
    }

    bindEvents() {
        // Upload listeners
        this.elements.upload1.addEventListener('click', () => this.elements.file1.click());
        this.elements.upload2.addEventListener('click', () => this.elements.file2.click());
        this.elements.file1.addEventListener('change', (e) => this.handleFileSelect(e, 1));
        this.elements.file2.addEventListener('change', (e) => this.handleFileSelect(e, 2));

        // Drag and drop listeners
        ['upload1', 'upload2'].forEach((id, index) => {
            const el = this.elements[id];
            el.addEventListener('dragover', this.handleDragOver.bind(this));
            el.addEventListener('dragleave', this.handleDragLeave.bind(this));
            el.addEventListener('drop', (e) => this.handleDrop(e, index + 1));
            el.addEventListener('mouseover', () => this.hoveredUploadArea = index + 1);
            el.addEventListener('mouseout', () => this.hoveredUploadArea = null);
        });
        
        // Global paste listener
        document.addEventListener('paste', this.handlePaste.bind(this));

        // Action buttons
        this.elements.remove1.addEventListener('click', (e) => this.removeImage(e, 1));
        this.elements.remove2.addEventListener('click', (e) => this.removeImage(e, 2));
        this.elements.compareBtn.addEventListener('click', this.compareImages.bind(this));
        this.elements.stopBtn.addEventListener('click', this.stopComparison.bind(this));

        // Modal triggers
        this.elements.settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSettingsModal();
        });
        this.elements.settingsModalClose.addEventListener('click', this.hideSettingsModal.bind(this));
        this.elements.showDiffIcon.addEventListener('click', this.showDiffMap.bind(this));
        this.elements.diffModalClose.addEventListener('click', this.hideDiffMap.bind(this));
        this.elements.saveSettingsBtn.addEventListener('click', () => {
            this.saveSettings();
            this.hideSettingsModal();
        });

        // Live setting updates
        this.elements.thresholdSlider.addEventListener('input', (e) => {
            this.elements.thresholdValue.textContent = `${e.target.value}%`;
            this.updateSliderFill(e.target);
        });

        // Color picker helpers
        this.elements.diffColorSwatch.parentElement.addEventListener('click', () => this.elements.diffColorInput.click());
        this.elements.matchColorSwatch.parentElement.addEventListener('click', () => this.elements.matchColorInput.click());
        this.elements.diffColorInput.addEventListener('input', (e) => this.elements.diffColorSwatch.style.backgroundColor = e.target.value);
        this.elements.matchColorInput.addEventListener('input', (e) => this.elements.matchColorSwatch.style.backgroundColor = e.target.value);

        // Region selection listeners
        [this.elements.regionX1, this.elements.regionY1, this.elements.regionX2, this.elements.regionY2].forEach(input => {
            input.addEventListener('input', this.updateRegionPreview.bind(this));
        });
    }
    
    //==============================================================================
    // SETTINGS MANAGEMENT
    //==============================================================================
    loadSettings() {
        const defaults = {
            threshold: 15,
            averageOutSize: false,
            diffColor: '#ffffff',
            matchColor: '#1F1F3D',
            region: { x1: 0, y1: 0, x2: 100, y2: 100 }
        };
        try {
            const saved = localStorage.getItem('imageComparatorSettings');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch (e) {
            console.error("Failed to load settings:", e);
            return defaults;
        }
    }

    saveSettings() {
        this.settings = {
            threshold: parseInt(this.elements.thresholdSlider.value, 10),
            diffColor: this.elements.diffColorInput.value,
            matchColor: this.elements.matchColorInput.value,
            averageOutSize: this.elements.averageSizeCheckbox.checked,
            region: {
                x1: parseFloat(this.elements.regionX1.value) || 0,
                y1: parseFloat(this.elements.regionY1.value) || 0,
                x2: parseFloat(this.elements.regionX2.value) || 100,
                y2: parseFloat(this.elements.regionY2.value) || 100,
            }
        };
        localStorage.setItem('imageComparatorSettings', JSON.stringify(this.settings));
    }

    updateSettingsUI() {
        const { threshold, diffColor, matchColor, averageOutSize, region } = this.settings;
        this.elements.thresholdSlider.value = threshold;
        this.elements.thresholdValue.textContent = `${threshold}%`;
        this.updateSliderFill(this.elements.thresholdSlider);

        this.elements.diffColorInput.value = diffColor;
        this.elements.diffColorSwatch.style.backgroundColor = diffColor;
        this.elements.matchColorInput.value = matchColor;
        this.elements.matchColorSwatch.style.backgroundColor = matchColor;
        
        this.elements.averageSizeCheckbox.checked = averageOutSize;
        
        this.elements.regionX1.value = region.x1;
        this.elements.regionY1.value = region.y1;
        this.elements.regionX2.value = region.x2;
        this.elements.regionY2.value = region.y2;
    }

    //==============================================================================
    // EVENT HANDLERS
    //==============================================================================
    handleFileSelect(e, imageNumber) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.loadImage(file, imageNumber);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e, imageNumber) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                this.loadImage(file, imageNumber);
            }
        }
    }

    handlePaste(e) {
        if (!this.hoveredUploadArea) return;
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                const namedFile = new File([file], `pasted-image.png`, { type: file.type });
                this.loadImage(namedFile, this.hoveredUploadArea);
                return;
            }
        }
    }

    //==============================================================================
    // FILE & IMAGE HANDLING
    //==============================================================================
    loadImage(file, imageNumber) {
        this.files[`file${imageNumber}`] = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgEl = this.elements[`img${imageNumber}`];
            imgEl.src = e.target.result;
            imgEl.onload = () => {
                this.images[`img${imageNumber}`] = imgEl;
                this.elements[`upload${imageNumber}`].querySelector('.upload-content').style.display = 'none';
                this.elements[`preview${imageNumber}`].style.display = 'block';
                this.displayFileInfo(file, imageNumber);
                this.checkReadyToCompare();
                this.updateMetadataComparison();

                if (imageNumber === 1) this.updateRegionPreviewVisibility();
            };
        };
        reader.readAsDataURL(file);
    }

    removeImage(e, imageNumber) {
        e.stopPropagation();
        this.elements[`img${imageNumber}`].src = '';
        this.images[`img${imageNumber}`] = null;
        this.files[`file${imageNumber}`] = null;
        this.elements[`preview${imageNumber}`].style.display = 'none';
        this.elements[`upload${imageNumber}`].querySelector('.upload-content').style.display = 'block';
        this.elements[`file${imageNumber}`].value = '';
        
        this.hideResults();
        this.checkReadyToCompare();
        this.updateMetadataComparison();
        if (imageNumber === 1) this.updateRegionPreviewVisibility();
    }

    checkReadyToCompare() {
        this.elements.compareBtn.disabled = !(this.images.img1 && this.images.img2);
    }

    //==============================================================================
    // METADATA COMPARISON
    //==============================================================================
    displayFileInfo(file, imageNumber) {
        const { name, size, type } = file;
        const { naturalWidth, naturalHeight } = this.elements[`img${imageNumber}`];
        this.elements[`fileInfo${imageNumber}`].innerHTML = `
            <div><strong>${name}</strong></div>
            <div>Type: ${type}</div>
            <div>Size: ${this.formatFileSize(size)}</div>
            <div>Dimensions: ${naturalWidth} × ${naturalHeight}</div>
        `;
    }

    updateMetadataComparison() {
        const { navMetadataLink } = this.elements;
        if (!this.files.file1 || !this.files.file2) {
            this.elements.metadataSection.style.display = 'none';
            navMetadataLink.classList.add('nav-link-hidden');
            return;
        }

        const { file1, file2 } = this.files;
        const { img1, img2 } = this.images;
        
        this.elements.metadataSection.style.display = 'block';
        navMetadataLink.classList.remove('nav-link-hidden');

        const data = {
            'File Name': { v1: file1.name, v2: file2.name, same: file1.name === file2.name },
            'File Type': { v1: file1.type, v2: file2.type, same: file1.type === file2.type },
            'File Size': { v1: file1.size, v2: file2.size, same: file1.size === file2.size, isSize: true },
            'Dimensions': { v1: `${img1.naturalWidth} × ${img1.naturalHeight}`, v2: `${img2.naturalWidth} × ${img2.naturalHeight}`, same: img1.naturalWidth === img2.naturalWidth && img1.naturalHeight === img2.naturalHeight },
        };
        this.elements.metadataContent.innerHTML = this.generateMetadataHTML(data);
    }
    
    generateMetadataHTML(data) {
        const rows = Object.entries(data).map(([label, item]) => {
            const statusIcon = item.same ? '<i class="fas fa-check-circle status-icon success"></i>' : '<i class="fas fa-times-circle status-icon warning"></i>';
            let value1 = item.isSize ? this.formatFileSize(item.v1) : item.v1;
            let value2 = item.isSize ? this.formatFileSize(item.v2) : item.v2;
            let sizeDiffHtml = item.isSize && !item.same ? `<span class="size-diff">Δ ${this.formatFileSize(Math.abs(item.v1 - item.v2))}</span>` : '';
            return `
                <tr>
                    <td class="prop-name">${label}</td>
                    <td class="value-col">${value1}</td>
                    <td class="value-col">${value2}</td>
                    <td class="status-col">${statusIcon}${sizeDiffHtml}</td>
                </tr>`;
        }).join('');

        return `<table class="metadata-table"><thead><tr><th>Property</th><th>Image 1</th><th>Image 2</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
    }

    //==============================================================================
    // CORE IMAGE COMPARISON LOGIC
    //==============================================================================
    stopComparison() {
        if (this.isComparing) {
            this.stopRequested = true;
        }
    }
    
    async compareImages() {
        if (this.isComparing) return;

        this.hideResults();
        this.stopRequested = false;
        this.isComparing = true;
        this.elements.compareBtn.disabled = true;
        this.elements.compareBtn.classList.add('comparing');
        this.elements.progressSection.style.display = 'block';

        const startTime = performance.now();
        try {
            const { width, height, data1, data2 } = await this.prepareImageDataForComparison();
            if (width === 0 || height === 0) throw new Error("Comparison region has zero area. Adjust settings.");

            const results = await this.performPixelComparison(width, height, data1, data2);
            if (this.stopRequested) {
                 throw new UserCancellationError("Comparison stopped before results could be displayed.");
            }
            this.displayResults(results, width, height, Math.round(performance.now() - startTime));

        } catch (error) {
            if (error instanceof UserCancellationError) {
                console.log("Comparison was successfully cancelled by the user.");
                this.elements.progressSection.style.display = 'none';
            } else {
                console.error('Comparison failed:', error);
                alert(`Error: ${error.message}`);
                this.elements.progressSection.style.display = 'none';
            }
        } finally {
            this.isComparing = false;
            this.elements.compareBtn.disabled = false;
            this.elements.compareBtn.classList.remove('comparing');
        }
    }

    async prepareImageDataForComparison() {
        const { img1, img2 } = this.images;
        const { region, averageOutSize } = this.settings;

        const maxWidth = Math.max(img1.naturalWidth, img2.naturalWidth);
        const maxHeight = Math.max(img1.naturalHeight, img2.naturalHeight);

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = maxWidth;
        tempCanvas.height = maxHeight;
        
        const sx = (Math.min(region.x1, region.x2) / 100) * maxWidth;
        const sy = (Math.min(region.y1, region.y2) / 100) * maxHeight;
        const sWidth = (Math.abs(region.x2 - region.x1) / 100) * maxWidth;
        const sHeight = (Math.abs(region.y2 - region.y1) / 100) * maxHeight;
        const finalWidth = Math.round(sWidth);
        const finalHeight = Math.round(sHeight);

        if (finalWidth <= 0 || finalHeight <= 0) return { width: 0, height: 0 };
        
        const drawImageToCanvas = (ctx, img, targetWidth, targetHeight) => {
            ctx.clearRect(0, 0, targetWidth, targetHeight);
            
            // Check if scaling is enabled and if the image is smaller than the target canvas
            if (averageOutSize && (img.naturalWidth < targetWidth || img.naturalHeight < targetHeight)) {
                const imgAspectRatio = img.naturalWidth / img.naturalHeight;
                const targetAspectRatio = targetWidth / targetHeight;
                let drawWidth, drawHeight, dx, dy;

                // Scale to fit (contain)
                if (imgAspectRatio > targetAspectRatio) {
                    drawWidth = targetWidth;
                    drawHeight = drawWidth / imgAspectRatio;
                    dx = 0;
                    dy = (targetHeight - drawHeight) / 2;
                } else {
                    drawHeight = targetHeight;
                    drawWidth = drawHeight * imgAspectRatio;
                    dy = 0;
                    dx = (targetWidth - drawWidth) / 2;
                }
                ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
            } else {
                // Default behavior: center the image without scaling
                const x_offset = (targetWidth - img.naturalWidth) / 2;
                const y_offset = (targetHeight - img.naturalHeight) / 2;
                ctx.drawImage(img, x_offset, y_offset);
            }
        };

        const getImageDataForRegion = (img) => {
            drawImageToCanvas(tempCtx, img, maxWidth, maxHeight);
            return tempCtx.getImageData(sx, sy, sWidth, sHeight).data;
        };
        
        const data1 = getImageDataForRegion(img1);
        const data2 = getImageDataForRegion(img2);

        return { width: finalWidth, height: finalHeight, data1, data2 };
    }

    async performPixelComparison(width, height, data1, data2) {
        const { threshold, diffColor, matchColor } = this.settings;
        const maxAllowedDiff = 765 * (threshold / 100);
        const diffRgb = this.hexToRgb(diffColor);
        const matchRgb = this.hexToRgb(matchColor);

        const totalPixels = width * height;
        let matchingPixels = 0;
        const diffMapData = new Uint8ClampedArray(totalPixels * 4);

        return new Promise((resolve, reject) => {
            const compareChunk = (startIndex = 0) => {
                if (this.stopRequested) {
                    return reject(new UserCancellationError("Comparison cancelled during processing."));
                }

                const chunkSize = 2000;
                const endIndex = Math.min(startIndex + chunkSize, totalPixels);

                for (let i = startIndex; i < endIndex; i++) {
                    const p = i * 4;
                    const r1 = data1[p], g1 = data1[p+1], b1 = data1[p+2];
                    const r2 = data2[p], g2 = data2[p+1], b2 = data2[p+2];
                    
                    const isMatch = (Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)) <= maxAllowedDiff;
                    const targetRgb = isMatch ? matchRgb : diffRgb;
                    
                    if (isMatch) matchingPixels++;
                    
                    diffMapData[p] = targetRgb.r; 
                    diffMapData[p+1] = targetRgb.g; 
                    diffMapData[p+2] = targetRgb.b; 
                    diffMapData[p+3] = 255;
                }
                
                this.updateProgress(
                    (endIndex / totalPixels) * 100,
                    Math.floor((endIndex - 1) / width),
                    (endIndex - 1) % width,
                    endIndex,
                    (matchingPixels / endIndex) * 100
                );

                if (endIndex < totalPixels) {
                    requestAnimationFrame(() => compareChunk(endIndex));
                } else {
                    this.diffMapImageData = { data: diffMapData, width, height };
                    resolve({
                        totalPixels,
                        matchingPixels,
                        differentPixels: totalPixels - matchingPixels,
                        similarity: (matchingPixels / totalPixels) * 100,
                    });
                }
            };
            compareChunk();
        });
    }

    //==============================================================================
    // UI & MODAL MANAGEMENT
    //==============================================================================
    showModal(modalElement) {
        modalElement.style.display = 'flex';
        this.elements.body.classList.add('modal-open');
    }

    hideModal(modalElement) {
        modalElement.style.display = 'none';
        this.elements.body.classList.remove('modal-open');
    }

    showSettingsModal() {
        this.updateRegionPreviewVisibility();
        this.showModal(this.elements.settingsModal);
    }
    
    hideSettingsModal() {
        this.hideModal(this.elements.settingsModal);
    }

    showDiffMap() {
        if (!this.diffMapImageData) return;
        const { data, width, height } = this.diffMapImageData;
        this.elements.diffCanvas.width = width;
        this.elements.diffCanvas.height = height;
        const ctx = this.elements.diffCanvas.getContext('2d');
        ctx.putImageData(new ImageData(data, width, height), 0, 0);
        this.showModal(this.elements.diffModal);
    }

    hideDiffMap() {
        this.hideModal(this.elements.diffModal);
    }
    
    updateRegionPreviewVisibility() {
        if (this.images.img1) {
            this.elements.regionPreviewImage.src = this.images.img1.src;
            this.elements.regionPreviewImage.style.display = 'block';
            this.elements.regionPreviewText.style.display = 'none';
            requestAnimationFrame(() => this.updateRegionPreview());
        } else {
            this.elements.regionPreviewImage.style.display = 'none';
            this.elements.regionPreviewText.style.display = 'flex';
        }
    }

    updateRegionPreview() {
        if (!this.images.img1) return;
        
        const { regionPreview: container, regionBox: box } = this.elements;
        const { img1, img2 } = this.images;

        const masterWidth = img2 ? Math.max(img1.naturalWidth, img2.naturalWidth) : img1.naturalWidth;
        const masterHeight = img2 ? Math.max(img1.naturalHeight, img2.naturalHeight) : img1.naturalHeight;
        const masterAspectRatio = masterWidth / masterHeight;
        
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        let renderedWidth, renderedHeight, topOffset = 0, leftOffset = 0;

        if (masterAspectRatio > containerWidth / containerHeight) {
            renderedWidth = containerWidth;
            renderedHeight = renderedWidth / masterAspectRatio;
            topOffset = (containerHeight - renderedHeight) / 2;
        } else {
            renderedHeight = containerHeight;
            renderedWidth = renderedHeight * masterAspectRatio;
            leftOffset = (containerWidth - renderedWidth) / 2;
        }
    
        const x1p = Math.max(0, Math.min(100, parseFloat(this.elements.regionX1.value) || 0));
        const y1p = Math.max(0, Math.min(100, parseFloat(this.elements.regionY1.value) || 0));
        const x2p = Math.max(0, Math.min(100, parseFloat(this.elements.regionX2.value) || 100));
        const y2p = Math.max(0, Math.min(100, parseFloat(this.elements.regionY2.value) || 100));
    
        box.style.left = `${(Math.min(x1p, x2p) / 100) * renderedWidth + leftOffset}px`;
        box.style.top = `${(Math.min(y1p, y2p) / 100) * renderedHeight + topOffset}px`;
        box.style.width = `${(Math.abs(x2p - x1p) / 100) * renderedWidth}px`;
        box.style.height = `${(Math.abs(y2p - y1p) / 100) * renderedHeight}px`;
    }

    updateSliderFill(slider) {
        const percentage = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        slider.style.background = `linear-gradient(to right, var(--accent-primary) ${percentage}%, var(--bg-primary) ${percentage}%)`;
    }

    //==============================================================================
    // RESULTS & UI UPDATES
    //==============================================================================
    updateProgress(progress, row, col, processed, similarity) {
        this.elements.progressFill.style.width = `${progress}%`;
        this.elements.progressText.textContent = `${Math.round(progress)}%`;
        this.elements.currentPosition.textContent = `Row ${row}, Col ${col}`;
        this.elements.pixelsProcessed.textContent = processed.toLocaleString();
        this.elements.currentSimilarity.textContent = `${similarity.toFixed(2)}%`;
    }

    displayResults({ similarity, totalPixels, matchingPixels, differentPixels }, width, height, time) {
        this.elements.similarityScore.textContent = `${similarity.toFixed(2)}%`;
        this.elements.totalPixels.textContent = totalPixels.toLocaleString();
        this.elements.matchingPixels.textContent = matchingPixels.toLocaleString();
        this.elements.differentPixels.textContent = differentPixels.toLocaleString();
        this.elements.processingTime.textContent = `${time}ms`;
        
        const { region } = this.settings;
        const isRegionSet = region.x1 !== 0 || region.y1 !== 0 || region.x2 !== 100 || region.y2 !== 100;
        const dimensionText = isRegionSet ? `${width} × ${height} (Region)` : `${width} × ${height}`;

        this.elements.imageDimensions.textContent = dimensionText;
        this.elements.imageDimensionsCard.style.display = 'block';
       
        this.elements.showDiffIcon.style.display = differentPixels > 0 ? 'inline-block' : 'none';

        this.elements.progressSection.style.display = 'none';
        this.elements.resultsSection.style.display = 'block';
        this.elements.navResultsLink.classList.remove('nav-link-hidden');
        this.elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    hideResults() {
        this.elements.progressSection.style.display = 'none';
        this.elements.resultsSection.style.display = 'none';
        this.elements.showDiffIcon.style.display = 'none';
        this.elements.navResultsLink.classList.add('nav-link-hidden');
    }

    //==============================================================================
    // UTILITY HELPERS
    //==============================================================================
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
    }
}

//==============================================================================
// DOCUMENT LOADED
//==============================================================================
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedImageComparator();
});