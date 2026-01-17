// ═══════════════════════════════════════════════════════════
// 👋 M.B.M.K. GESTURE CONTROL SYSTEM v2.0 - ENHANCED
// نظام التحكم بالإيماءات المحسّن - أحدث التقنيات
// ═══════════════════════════════════════════════════════════

const GESTURE_CONFIG = {
    VIDEO_WIDTH: 640,
    VIDEO_HEIGHT: 480,
    MIN_DETECTION_CONFIDENCE: 0.8,
    MIN_TRACKING_CONFIDENCE: 0.8,
    FIST_CONFIRM_DELAY: 800,          // ✅ أسرع شوية (0.8 ثانية)
    SELECTION_COOLDOWN: 1500,
    SMOOTHING_FRAMES: 3,              // ✅ أقل = استجابة أسرع
    GESTURE_THRESHOLD: 0.65,          // ✅ أقل صرامة
    FIST_STABILITY_FRAMES: 2          // ✅ جديد: فقط 2 frames للتأكد
};

class GestureController {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        this.isActive = false;
        this.lastFingerCount = 0;
        this.selectedOption = null;
        this.fistDetectedTime = null;
        this.lastSelectionTime = 0;
        this.onOptionSelect = null;
        this.onOptionHighlight = null;
        
        // ✨ تحسينات جديدة
        this.fingerCountHistory = [];
        this.fistHistory = [];
        this.gestureSmoothing = GESTURE_CONFIG.SMOOTHING_FRAMES;
        this.isProcessing = false;
        this.performanceMonitor = {
            fps: 0,
            lastFrameTime: 0,
            frameCount: 0
        };
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Advanced Gesture Control...');
            await this.loadMediaPipe();
            await this.setupCamera();
            this.setupCanvas();
            this.initializeHands();
            this.startPerformanceMonitoring();
            console.log('✅ Gesture Control System v2.0 Initialized');
            return true;
        } catch (error) {
            console.error('❌ Gesture System Error:', error);
            return false;
        }
    }

    async loadMediaPipe() {
        return new Promise((resolve, reject) => {
            if (window.Hands) {
                resolve();
                return;
            }

            const scripts = [
                'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
                'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
                'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
                'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
            ];

            let loaded = 0;
            const checkLoaded = () => {
                loaded++;
                if (loaded === scripts.length) {
                    setTimeout(() => {
                        if (window.Hands) {
                            resolve();
                        } else {
                            reject(new Error('MediaPipe not loaded'));
                        }
                    }, 500);
                }
            };

            scripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.crossOrigin = 'anonymous';
                script.onload = checkLoaded;
                script.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.head.appendChild(script);
            });
        });
    }

    async setupCamera() {
        this.videoElement = document.createElement('video');
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);

        const constraints = {
            video: {
                width: { ideal: GESTURE_CONFIG.VIDEO_WIDTH },
                height: { ideal: GESTURE_CONFIG.VIDEO_HEIGHT },
                facingMode: 'user',
                frameRate: { ideal: 30, max: 60 }
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.videoElement.srcObject = stream;
        await this.videoElement.play();
    }

    setupCanvas() {
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.id = 'gesture-canvas';
        this.canvasElement.width = GESTURE_CONFIG.VIDEO_WIDTH;
        this.canvasElement.height = GESTURE_CONFIG.VIDEO_HEIGHT;
        this.canvasElement.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            width: 280px;
            height: 210px;
            border: 3px solid #06b6d4;
            border-radius: 20px;
            z-index: 100;
            box-shadow: 0 15px 40px rgba(6, 182, 212, 0.4), 0 0 20px rgba(6, 182, 212, 0.2);
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        `;
        document.body.appendChild(this.canvasElement);
        this.canvasCtx = this.canvasElement.getContext('2d', { alpha: true });
    }

    initializeHands() {
        this.hands = new window.Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: GESTURE_CONFIG.MIN_DETECTION_CONFIDENCE,
            minTrackingConfidence: GESTURE_CONFIG.MIN_TRACKING_CONFIDENCE
        });

        this.hands.onResults((results) => this.onResults(results));

        this.camera = new window.Camera(this.videoElement, {
            onFrame: async () => {
                if (this.isActive && !this.isProcessing) {
                    this.isProcessing = true;
                    await this.hands.send({ image: this.videoElement });
                    this.isProcessing = false;
                }
            },
            width: GESTURE_CONFIG.VIDEO_WIDTH,
            height: GESTURE_CONFIG.VIDEO_HEIGHT
        });
    }

    onResults(results) {
        this.updateFPS();
        
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        // رسم الفيديو مع تأثيرات
        this.canvasCtx.filter = 'brightness(1.1) contrast(1.1)';
        this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
        this.canvasCtx.filter = 'none';

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // رسم اليد بتأثيرات متقدمة
            this.drawEnhancedHand(landmarks);

            const fingerCount = this.countFingers(landmarks);
            const isFist = this.detectFist(landmarks);
            const smoothedFingerCount = this.smoothGesture(fingerCount);
            const smoothedFist = this.smoothFist(isFist);

            this.handleGesture(smoothedFingerCount, smoothedFist);
            this.drawEnhancedUI(smoothedFingerCount, smoothedFist, landmarks);
        } else {
            this.drawNoHandDetected();
            this.resetGestureState();
        }

        this.canvasCtx.restore();
    }

    drawEnhancedHand(landmarks) {
        // رسم الخطوط مع توهج
        this.canvasCtx.shadowBlur = 15;
        this.canvasCtx.shadowColor = '#00FF00';
        window.drawConnectors(this.canvasCtx, landmarks, window.HAND_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 4
        });
        this.canvasCtx.shadowBlur = 0;

        // رسم النقاط مع توهج ملون
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * this.canvasElement.width;
            const y = landmark.y * this.canvasElement.height;
            
            this.canvasCtx.beginPath();
            this.canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
            
            // ألوان مختلفة لأطراف الأصابع
            if ([4, 8, 12, 16, 20].includes(index)) {
                this.canvasCtx.fillStyle = '#FF00FF';
                this.canvasCtx.shadowBlur = 10;
                this.canvasCtx.shadowColor = '#FF00FF';
            } else {
                this.canvasCtx.fillStyle = '#00FFFF';
                this.canvasCtx.shadowBlur = 5;
                this.canvasCtx.shadowColor = '#00FFFF';
            }
            
            this.canvasCtx.fill();
            this.canvasCtx.shadowBlur = 0;
        });
    }

    countFingers(landmarks) {
        let count = 0;
        const isRightHand = landmarks[17].x < landmarks[5].x;
        
        // الإبهام - محسّن
        const thumbTip = landmarks[4];
        const thumbMCP = landmarks[2];
        const threshold = 0.04;
        
        if (isRightHand) {
            if (thumbTip.x < thumbMCP.x - threshold) count++;
        } else {
            if (thumbTip.x > thumbMCP.x + threshold) count++;
        }
        
        // بقية الأصابع - خوارزمية محسّنة
        const fingers = [
            { tip: 8, pip: 6, mcp: 5 },
            { tip: 12, pip: 10, mcp: 9 },
            { tip: 16, pip: 14, mcp: 13 },
            { tip: 20, pip: 18, mcp: 17 }
        ];
        
        fingers.forEach(finger => {
            const tipY = landmarks[finger.tip].y;
            const pipY = landmarks[finger.pip].y;
            const mcpY = landmarks[finger.mcp].y;
            
            const tipToPip = tipY - pipY;
            const pipToMcp = pipY - mcpY;
            
            // الإصبع مفتوح إذا كان ممتد بشكل واضح
            if (tipToPip < -0.02 && pipToMcp < -0.015 && tipY < mcpY - 0.04) {
                count++;
            }
        });
        
        return Math.max(0, Math.min(5, count));
    }

    detectFist(landmarks) {
        const fingers = [
            { tip: 8, pip: 6, mcp: 5, name: 'Index' },
            { tip: 12, pip: 10, mcp: 9, name: 'Middle' },
            { tip: 16, pip: 14, mcp: 13, name: 'Ring' },
            { tip: 20, pip: 18, mcp: 17, name: 'Pinky' }
        ];
        
        let closedFingers = 0;
        const wrist = landmarks[0];
        const palm = landmarks[9]; // راحة اليد
        
        fingers.forEach(finger => {
            const tip = landmarks[finger.tip];
            const pip = landmarks[finger.pip];
            const mcp = landmarks[finger.mcp];
            
            // ✅ شرط 1: طرف الإصبع تحت مستوى المفصل الأوسط
            const tipBelowPip = tip.y >= pip.y - 0.015;
            
            // ✅ شرط 2: طرف الإصبع تحت مستوى قاعدة الإصبع
            const tipBelowMcp = tip.y >= mcp.y - 0.03;
            
            // ✅ شرط 3: المسافة من الطرف للراحة قصيرة
            const distToPalm = Math.hypot(tip.x - palm.x, tip.y - palm.y);
            const nearPalm = distToPalm < 0.16;
            
            // ✅ الإصبع مطوي إذا تحققت كل الشروط
            const isClosed = tipBelowPip && tipBelowMcp && nearPalm;
            
            if (isClosed) closedFingers++;
        });
        
        // ✅ فحص الإبهام - أكثر مرونة
        const thumbTip = landmarks[4];
        const thumbIP = landmarks[3];
        const thumbMCP = landmarks[2];
        const indexMCP = landmarks[5];
        
        // المسافة من الإبهام للسبابة
        const thumbToIndexDist = Math.hypot(
            thumbTip.x - indexMCP.x,
            thumbTip.y - indexMCP.y
        );
        
        // المسافة من الإبهام للراحة
        const thumbToPalmDist = Math.hypot(
            thumbTip.x - palm.x,
            thumbTip.y - palm.y
        );
        
        // الإبهام مطوي
        const thumbClosed = (thumbToIndexDist < 0.12 && thumbToPalmDist < 0.14) || 
                           (thumbTip.y > thumbIP.y && thumbToIndexDist < 0.14);
        
        // ✅ قبضة صحيحة = كل الأصابع الأربعة مطوية + الإبهام
        const isFist = closedFingers === 4 && thumbClosed;
        
        // ✅ طباعة تشخيصية أكثر وضوحاً
        if (closedFingers >= 3 || thumbClosed) {
            const status = isFist ? '✊ FIST!' : '🤚 Almost';
            console.log(`${status} | Fingers: ${closedFingers}/4 | Thumb: ${thumbClosed}`);
        }
        
        return isFist;
    }

    smoothGesture(fingerCount) {
        this.fingerCountHistory.push(fingerCount);
        if (this.fingerCountHistory.length > this.gestureSmoothing) {
            this.fingerCountHistory.shift();
        }
        
        return this.getMostCommonValue(this.fingerCountHistory);
    }

    smoothFist(isFist) {
        this.fistHistory.push(isFist ? 1 : 0);
        if (this.fistHistory.length > GESTURE_CONFIG.FIST_STABILITY_FRAMES) {
            this.fistHistory.shift();
        }
        
        // ✅ بدل النسبة، نشوف إذا آخر قراءتين كانوا قبضة
        const recentFists = this.fistHistory.slice(-GESTURE_CONFIG.FIST_STABILITY_FRAMES);
        const allFist = recentFists.every(f => f === 1);
        
        if (allFist && this.fistHistory.length >= GESTURE_CONFIG.FIST_STABILITY_FRAMES) {
            return true;
        }
        
        return false;
    }

    getMostCommonValue(arr) {
        if (arr.length === 0) return 0;
        
        const counts = {};
        let maxCount = 0;
        let mostCommon = arr[0];
        
        arr.forEach(val => {
            counts[val] = (counts[val] || 0) + 1;
            if (counts[val] > maxCount) {
                maxCount = counts[val];
                mostCommon = val;
            }
        });
        
        return mostCommon;
    }

    handleGesture(fingerCount, isFist) {
        const now = Date.now();

        // ✅ اختيار الخيار بالأصابع (بدون تأكيد)
        if (fingerCount >= 1 && fingerCount <= 4 && !isFist) {
            if (this.lastFingerCount !== fingerCount) {
                this.lastFingerCount = fingerCount;
                this.selectedOption = fingerCount;
                
                // ✅ إلغاء أي محاولة تأكيد سابقة
                this.fistDetectedTime = null;

                if (this.onOptionHighlight) {
                    this.onOptionHighlight(fingerCount - 1);
                }

                console.log(`👆 Selected: ${fingerCount} fingers → Option ${String.fromCharCode(64 + fingerCount)}`);
            }
        }
        
        // ✅ حالة خاصة: لو كل الأصابع مطوية = إلغاء الاختيار
        if (fingerCount === 0 && !isFist) {
            if (this.selectedOption !== null) {
                console.log('🚫 No fingers detected - Selection cleared');
                this.selectedOption = null;
                this.lastFingerCount = 0;
                this.fistDetectedTime = null;
            }
        }

        // ✅ التأكيد بالقبضة الكاملة فقط
        if (isFist && this.selectedOption !== null) {
            if (this.fistDetectedTime === null) {
                this.fistDetectedTime = now;
                console.log(`✊ Full fist detected - confirming Option ${String.fromCharCode(64 + this.selectedOption)}...`);
            } else {
                const elapsed = now - this.fistDetectedTime;
                const progress = Math.min(elapsed / GESTURE_CONFIG.FIST_CONFIRM_DELAY, 1);
                
                // ✅ عرض التقدم
                if (Math.floor(progress * 10) % 2 === 0) {
                    console.log(`⏳ Confirming... ${Math.floor(progress * 100)}%`);
                }
                
                // ✅ التأكيد النهائي
                if (elapsed >= GESTURE_CONFIG.FIST_CONFIRM_DELAY) {
                    if (now - this.lastSelectionTime >= GESTURE_CONFIG.SELECTION_COOLDOWN) {
                        console.log(`✅ CONFIRMED! Selecting Option ${String.fromCharCode(64 + this.selectedOption)}`);

                        if (this.onOptionSelect) {
                            this.onOptionSelect(this.selectedOption - 1);
                        }

                        this.lastSelectionTime = now;
                        this.resetGestureState();
                    }
                }
            }
        } else if (!isFist && this.fistDetectedTime !== null) {
            // ✅ لو فتح يده قبل التأكيد = إلغاء
            console.log('❌ Fist released - Confirmation cancelled');
            this.fistDetectedTime = null;
        }
    }

    resetGestureState() {
        this.selectedOption = null;
        this.fistDetectedTime = null;
        this.lastFingerCount = 0;
        this.fingerCountHistory = [];
        this.fistHistory = [];
    }

    drawEnhancedUI(fingerCount, isFist, landmarks) {
        const padding = 15;
        const uiHeight = 140;
        
        // خلفية مع تدرج وتوهج
        const gradient = this.canvasCtx.createLinearGradient(0, 0, 0, uiHeight);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
        gradient.addColorStop(1, 'rgba(20, 20, 40, 0.95)');
        
        this.canvasCtx.fillStyle = gradient;
        this.canvasCtx.fillRect(padding, padding, this.canvasElement.width - 2 * padding, uiHeight);
        
        // إطار متوهج
        const borderColor = isFist ? '#FF0066' : (fingerCount >= 1 && fingerCount <= 4 ? '#00FF88' : '#06b6d4');
        this.canvasCtx.strokeStyle = borderColor;
        this.canvasCtx.lineWidth = 3;
        this.canvasCtx.shadowBlur = 15;
        this.canvasCtx.shadowColor = borderColor;
        this.canvasCtx.strokeRect(padding, padding, this.canvasElement.width - 2 * padding, uiHeight);
        this.canvasCtx.shadowBlur = 0;

        let yPos = 40;

        // العنوان
        this.canvasCtx.font = 'bold 18px "Segoe UI", Arial';
        this.canvasCtx.fillStyle = '#00D9FF';
        this.canvasCtx.fillText('🎯 GESTURE CONTROL v2.0', padding + 10, yPos);
        yPos += 35;

        // عدد الأصابع
        this.canvasCtx.font = 'bold 32px "Segoe UI", Arial';
        this.canvasCtx.fillStyle = '#00FF88';
        this.canvasCtx.shadowBlur = 10;
        this.canvasCtx.shadowColor = '#00FF88';
        this.canvasCtx.fillText(`${fingerCount} 🖐️`, padding + 10, yPos);
        this.canvasCtx.shadowBlur = 0;

        // الخيار المحدد
        if (fingerCount >= 1 && fingerCount <= 4 && !isFist) {
            this.canvasCtx.font = 'bold 22px "Segoe UI", Arial';
            this.canvasCtx.fillStyle = '#FFD700';
            this.canvasCtx.fillText(`→ Option ${String.fromCharCode(64 + fingerCount)}`, padding + 120, yPos);
        }

        yPos += 35;

        // رسالة القبضة
        if (isFist) {
            const progress = this.fistDetectedTime !== null 
                ? Math.min((Date.now() - this.fistDetectedTime) / GESTURE_CONFIG.FIST_CONFIRM_DELAY, 1)
                : 0;

            this.canvasCtx.font = 'bold 24px "Segoe UI", Arial';
            this.canvasCtx.fillStyle = '#FF0066';
            this.canvasCtx.shadowBlur = 15;
            this.canvasCtx.shadowColor = '#FF0066';
            this.canvasCtx.fillText('✊ CONFIRMING...', padding + 10, yPos);
            this.canvasCtx.shadowBlur = 0;

            // شريط التقدم
            const barWidth = this.canvasElement.width - 2 * padding - 20;
            const barHeight = 8;
            yPos += 15;

            this.canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.canvasCtx.fillRect(padding + 10, yPos, barWidth, barHeight);

            const progressGradient = this.canvasCtx.createLinearGradient(padding + 10, 0, padding + 10 + barWidth, 0);
            progressGradient.addColorStop(0, '#00FF88');
            progressGradient.addColorStop(1, '#00D9FF');
            
            this.canvasCtx.fillStyle = progressGradient;
            this.canvasCtx.fillRect(padding + 10, yPos, barWidth * progress, barHeight);
        }

        // FPS Counter
        this.canvasCtx.font = 'bold 14px monospace';
        this.canvasCtx.fillStyle = '#888';
        this.canvasCtx.fillText(`FPS: ${this.performanceMonitor.fps}`, this.canvasElement.width - 80, 30);
    }

    drawNoHandDetected() {
        const centerX = this.canvasElement.width / 2;
        const centerY = this.canvasElement.height / 2;

        // خلفية مع تدرج
        const gradient = this.canvasCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300);
        gradient.addColorStop(0, 'rgba(20, 20, 40, 0.95)');
        gradient.addColorStop(1, 'rgba(10, 10, 20, 0.98)');
        this.canvasCtx.fillStyle = gradient;
        this.canvasCtx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        // أيقونة يد متحركة
        this.canvasCtx.font = '80px Arial';
        this.canvasCtx.textAlign = 'center';
        this.canvasCtx.fillStyle = 'rgba(255, 107, 107, 0.6)';
        const pulse = Math.sin(Date.now() / 500) * 0.2 + 1;
        this.canvasCtx.shadowBlur = 20 * pulse;
        this.canvasCtx.shadowColor = '#FF6B6B';
        this.canvasCtx.fillText('✋', centerX, centerY - 20);
        this.canvasCtx.shadowBlur = 0;

        // النص
        this.canvasCtx.font = 'bold 26px "Segoe UI", Arial';
        this.canvasCtx.fillStyle = '#FF6B6B';
        this.canvasCtx.fillText('No Hand Detected', centerX, centerY + 50);

        this.canvasCtx.font = '18px "Segoe UI", Arial';
        this.canvasCtx.fillStyle = '#FFFFFF';
        this.canvasCtx.fillText('Show your hand to the camera', centerX, centerY + 85);

        this.canvasCtx.textAlign = 'left';
    }

    startPerformanceMonitoring() {
        setInterval(() => {
            this.performanceMonitor.fps = this.performanceMonitor.frameCount;
            this.performanceMonitor.frameCount = 0;
        }, 1000);
    }

    updateFPS() {
        this.performanceMonitor.frameCount++;
    }

    start() {
        this.isActive = true;
        if (this.camera) {
            this.camera.start();
        }
        if (this.canvasElement) {
            this.canvasElement.style.display = 'block';
        }
        console.log('▶️ Gesture Control v2.0 Started');
    }

    stop() {
        this.isActive = false;
        if (this.camera) {
            this.camera.stop();
        }
        if (this.canvasElement) {
            this.canvasElement.style.display = 'none';
        }
        this.resetGestureState();
        console.log('⏸️ Gesture Control v2.0 Stopped');
    }

    cleanup() {
        this.stop();

        if (this.videoElement && this.videoElement.srcObject) {
            this.videoElement.srcObject.getTracks().forEach(track => track.stop());
            this.videoElement.remove();
        }

        if (this.canvasElement) {
            this.canvasElement.remove();
        }

        this.hands = null;
        this.camera = null;
        console.log('🧹 Gesture Control v2.0 Cleaned Up');
    }
}

// ═══════════════════════════════════════════════════════════
// 🌐 GLOBAL API
// ═══════════════════════════════════════════════════════════

const gestureController = new GestureController();

async function initGestureControl() {
    const success = await gestureController.initialize();
    if (success) {
        if (typeof notify === 'function') {
            notify('✨ Gesture Control v2.0 Ready!', 'cyan');
        }
        return true;
    } else {
        if (typeof notify === 'function') {
            notify('❌ Failed to initialize gesture control', 'red');
        }
        return false;
    }
}

function startGestureControl() {
    gestureController.start();
}

function stopGestureControl() {
    gestureController.stop();
}

function cleanupGestureControl() {
    gestureController.cleanup();
}

console.log('✅ M.B.M.K. Gesture Control v2.0 Loaded - Enhanced Edition 🚀');