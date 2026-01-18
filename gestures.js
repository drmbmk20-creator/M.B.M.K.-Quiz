// ═══════════════════════════════════════════════════════════
// 👋 M.B.M.K. GESTURE CONTROL SYSTEM v4.0 - MEDIAPIPE V2
// نظام التحكم بالإيماءات - ترقية MediaPipe v2 مع 3D Tracking
// ═══════════════════════════════════════════════════════════

const GESTURE_CONFIG = {
    VIDEO_WIDTH: 640,
    VIDEO_HEIGHT: 480,
    MIN_DETECTION_CONFIDENCE: 0.90,      // ⬆️ رفع الدقة
    MIN_TRACKING_CONFIDENCE: 0.90,       // ⬆️ رفع الدقة
    AUTO_CONFIRM_DELAY: 1500,
    SELECTION_COOLDOWN: 2000,

    // ✨ إعدادات 3D الجديدة
    USE_WORLD_LANDMARKS: true,
    DEPTH_THRESHOLD: 0.15,               // متر

    FINGER_DETECTION: {
        SMOOTHING_FRAMES: 3,
        CONFIDENCE_THRESHOLD: 0.75,      // ⬆️ رفع الدقة
        HYSTERESIS_UP: 0.05,
        HYSTERESIS_DOWN: 0.03
    },

    FIST_DETECTION: {
        REQUIRED_FRAMES: 2,
        MIN_CLOSED_FINGERS: 4,
        THUMB_WEIGHT: 1.5,
        CONFIDENCE_THRESHOLD: 0.92       // ⬆️ رفع الدقة
    }
};

class AdvancedGestureDetector {
    constructor() {
        this.fingerStates = {
            thumb: { open: false, confidence: 0, history: [] },
            index: { open: false, confidence: 0, history: [] },
            middle: { open: false, confidence: 0, history: [] },
            ring: { open: false, confidence: 0, history: [] },
            pinky: { open: false, confidence: 0, history: [] }
        };

        this.fistConfidence = 0;
        this.fistHistory = [];
        this.lastHandPosition = null;
        this.handStability = 1.0;
        this.handType = 'Unknown';           // ✨ جديد: نوع اليد
        this.handPresence = 0;               // ✨ جديد: ثقة وجود اليد
    }

    detectFingerState(landmarks, fingerName, tipIdx, pipIdx, mcpIdx) {
        const tip = landmarks[tipIdx];
        const pip = landmarks[pipIdx];
        const mcp = landmarks[mcpIdx];
        const palm = landmarks[9];

        let openScore = 0;
        let totalChecks = 0;

        const verticalExtension = mcp.y - tip.y;
        if (verticalExtension > 0.08) openScore += 2;
        else if (verticalExtension > 0.05) openScore += 1;
        totalChecks += 2;

        const pipToTip = pip.y - tip.y;
        const mcpToPip = mcp.y - pip.y;
        if (pipToTip > 0.03 && mcpToPip > 0.02) openScore += 2;
        else if (pipToTip > 0.01) openScore += 1;
        totalChecks += 2;

        const distFromPalm = Math.hypot(tip.x - palm.x, tip.y - palm.y);
        if (distFromPalm > 0.18) openScore += 2;
        else if (distFromPalm > 0.13) openScore += 1;
        totalChecks += 2;

        const curlFactor = Math.abs(tip.y - pip.y) / Math.abs(mcp.y - pip.y);
        if (curlFactor > 1.5) openScore += 1;
        totalChecks += 1;

        const confidence = openScore / totalChecks;

        const state = this.fingerStates[fingerName];
        const threshold = state.open
            ? GESTURE_CONFIG.FINGER_DETECTION.CONFIDENCE_THRESHOLD - GESTURE_CONFIG.FINGER_DETECTION.HYSTERESIS_DOWN
            : GESTURE_CONFIG.FINGER_DETECTION.CONFIDENCE_THRESHOLD + GESTURE_CONFIG.FINGER_DETECTION.HYSTERESIS_UP;

        return {
            isOpen: confidence >= threshold,
            confidence: confidence
        };
    }

    detectThumbState(landmarks) {
        const thumbTip = landmarks[4];
        const thumbMCP = landmarks[2];
        const indexMCP = landmarks[5];
        const palm = landmarks[9];

        const isRightHand = landmarks[17].x < landmarks[5].x;

        let openScore = 0;
        let totalChecks = 0;

        const lateralDist = Math.abs(thumbTip.x - thumbMCP.x);
        if (lateralDist > 0.08) openScore += 2;
        else if (lateralDist > 0.05) openScore += 1;
        totalChecks += 2;

        const distFromIndex = Math.hypot(thumbTip.x - indexMCP.x, thumbTip.y - indexMCP.y);
        if (distFromIndex > 0.15) openScore += 2;
        else if (distFromIndex > 0.11) openScore += 1;
        totalChecks += 2;

        if (isRightHand) {
            if (thumbTip.x < thumbMCP.x - 0.04) openScore += 2;
            else if (thumbTip.x < thumbMCP.x) openScore += 1;
        } else {
            if (thumbTip.x > thumbMCP.x + 0.04) openScore += 2;
            else if (thumbTip.x > thumbMCP.x) openScore += 1;
        }
        totalChecks += 2;

        const distFromPalm = Math.hypot(thumbTip.x - palm.x, thumbTip.y - palm.y);
        if (distFromPalm > 0.14) openScore += 1;
        totalChecks += 1;

        const confidence = openScore / totalChecks;

        const state = this.fingerStates.thumb;
        const threshold = state.open
            ? GESTURE_CONFIG.FINGER_DETECTION.CONFIDENCE_THRESHOLD - GESTURE_CONFIG.FINGER_DETECTION.HYSTERESIS_DOWN
            : GESTURE_CONFIG.FINGER_DETECTION.CONFIDENCE_THRESHOLD + GESTURE_CONFIG.FINGER_DETECTION.HYSTERESIS_UP;

        return {
            isOpen: confidence >= threshold,
            confidence: confidence
        };
    }

    updateFingerStates(landmarks) {
        const detections = {
            thumb: this.detectThumbState(landmarks),
            index: this.detectFingerState(landmarks, 'index', 8, 6, 5),
            middle: this.detectFingerState(landmarks, 'middle', 12, 10, 9),
            ring: this.detectFingerState(landmarks, 'ring', 16, 14, 13),
            pinky: this.detectFingerState(landmarks, 'pinky', 20, 18, 17)
        };

        Object.keys(detections).forEach(fingerName => {
            const detection = detections[fingerName];
            const state = this.fingerStates[fingerName];

            state.history.push(detection.isOpen ? 1 : 0);
            if (state.history.length > GESTURE_CONFIG.FINGER_DETECTION.SMOOTHING_FRAMES) {
                state.history.shift();
            }

            const sum = state.history.reduce((a, b) => a + b, 0);
            const avg = sum / state.history.length;

            state.open = avg >= 0.5;
            state.confidence = detection.confidence;
        });

        const openCount = Object.values(this.fingerStates).filter(s => s.open).length;
        return openCount;
    }

    detectFist(landmarks) {
        const palm = landmarks[9];

        let fistScore = 0;
        let maxScore = 0;

        const closedFingers = Object.entries(this.fingerStates)
            .filter(([name, state]) => !state.open)
            .map(([name]) => name);

        const closedCount = closedFingers.length;
        if (closedCount === 5) fistScore += 4;
        else if (closedCount === 4 && !this.fingerStates.thumb.open) fistScore += 3;
        else if (closedCount === 4) fistScore += 2;
        maxScore += 4;

        const fingerTips = [4, 8, 12, 16, 20];
        let avgDistToPalm = 0;
        fingerTips.forEach(idx => {
            const tip = landmarks[idx];
            const dist = Math.hypot(tip.x - palm.x, tip.y - palm.y);
            avgDistToPalm += dist;
        });
        avgDistToPalm /= fingerTips.length;

        if (avgDistToPalm < 0.12) fistScore += 3;
        else if (avgDistToPalm < 0.15) fistScore += 2;
        else if (avgDistToPalm < 0.18) fistScore += 1;
        maxScore += 3;

        const thumbTip = landmarks[4];
        const indexMCP = landmarks[5];
        const thumbToIndex = Math.hypot(thumbTip.x - indexMCP.x, thumbTip.y - indexMCP.y);

        if (thumbToIndex < 0.08) fistScore += 2;
        else if (thumbToIndex < 0.12) fistScore += 1;
        maxScore += 2;

        const xs = landmarks.map(l => l.x);
        const ys = landmarks.map(l => l.y);
        const width = Math.max(...xs) - Math.min(...xs);
        const height = Math.max(...ys) - Math.min(...ys);
        const aspectRatio = width / height;

        if (aspectRatio < 0.7) fistScore += 1;
        maxScore += 1;

        let totalCurl = 0;
        [
            { tip: 8, mcp: 5 },
            { tip: 12, mcp: 9 },
            { tip: 16, mcp: 13 },
            { tip: 20, mcp: 17 }
        ].forEach(finger => {
            const tip = landmarks[finger.tip];
            const mcp = landmarks[finger.mcp];
            const curl = Math.hypot(tip.x - mcp.x, tip.y - mcp.y);
            totalCurl += curl;
        });
        const avgCurl = totalCurl / 4;

        if (avgCurl < 0.1) fistScore += 2;
        else if (avgCurl < 0.13) fistScore += 1;
        maxScore += 2;

        const confidence = fistScore / maxScore;

        this.fistHistory.push(confidence >= GESTURE_CONFIG.FIST_DETECTION.CONFIDENCE_THRESHOLD ? 1 : 0);
        if (this.fistHistory.length > GESTURE_CONFIG.FIST_DETECTION.REQUIRED_FRAMES) {
            this.fistHistory.shift();
        }

        const recentFists = this.fistHistory.slice(-GESTURE_CONFIG.FIST_DETECTION.REQUIRED_FRAMES);
        const stableFist = recentFists.length === GESTURE_CONFIG.FIST_DETECTION.REQUIRED_FRAMES &&
            recentFists.every(f => f === 1);

        this.fistConfidence = confidence;

        if (closedCount >= 3) {
            console.log(`Fist Analysis | Score: ${fistScore}/${maxScore} (${(confidence * 100).toFixed(1)}%) | Closed: ${closedCount}/5 | ${stableFist ? 'CONFIRMED' : 'Partial'}`);
        }

        return stableFist;
    }

    updateHandStability(landmarks) {
        const palmCenter = landmarks[9];

        if (this.lastHandPosition) {
            const movement = Math.hypot(
                palmCenter.x - this.lastHandPosition.x,
                palmCenter.y - this.lastHandPosition.y
            );

            this.handStability = Math.max(0, 1 - (movement * 10));
        }

        this.lastHandPosition = { x: palmCenter.x, y: palmCenter.y };
        return this.handStability;
    }

    // ✨ جديد: حساب المسافة 3D الحقيقية
    calculate3DDistance(worldLandmarks, idx1, idx2) {
        if (!worldLandmarks) return null;

        const p1 = worldLandmarks[idx1];
        const p2 = worldLandmarks[idx2];

        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.y - p2.y, 2) +
            Math.pow(p1.z - p2.z, 2)
        );
    }

    reset() {
        Object.values(this.fingerStates).forEach(state => {
            state.open = false;
            state.confidence = 0;
            state.history = [];
        });
        this.fistHistory = [];
        this.fistConfidence = 0;
    }
}

// ═══════════════════════════════════════════════════════════
// 🎮 MAIN GESTURE CONTROLLER - MEDIAPIPE V2
// ═══════════════════════════════════════════════════════════

class GestureController {
    constructor() {
        this.handLandmarker = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        this.isActive = false;
        this.lastFingerCount = 0;
        this.selectedOption = null;
        this.selectionStartTime = null;
        this.lastSelectionTime = 0;
        this.onOptionSelect = null;
        this.onOptionHighlight = null;
        this.waitingForHandRelease = false;

        this.detector = new AdvancedGestureDetector();

        this.performanceMonitor = {
            fps: 0,
            lastFrameTime: 0,
            frameCount: 0
        };
    }

    async initialize() {
        try {
            console.log('🚀 Initializing MediaPipe v2 Gesture Control...');
            await this.loadMediaPipeV2();
            await this.setupCamera();
            this.setupCanvas();
            await this.initializeHandLandmarker();
            this.startPerformanceMonitoring();
            console.log('✅ MediaPipe v2 System Ready!');
            return true;
        } catch (error) {
            console.error('❌ Initialization Error:', error);
            return false;
        }
    }

    async loadMediaPipeV2() {
        if (window.HandLandmarker && window.FilesetResolver) {
            return;
        }

        try {
            // استخدام dynamic import للـ ES modules
            const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');

            // تخزين على window للوصول العالمي
            window.HandLandmarker = vision.HandLandmarker;
            window.FilesetResolver = vision.FilesetResolver;
            window.DrawingUtils = vision.DrawingUtils;

            console.log('✅ MediaPipe v2 Vision Bundle Loaded');
        } catch (error) {
            console.error('❌ Failed to load MediaPipe v2:', error);
            throw new Error('Failed to load MediaPipe v2');
        }
    }

    async setupCamera() {
        this.videoElement = document.createElement('video');
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: GESTURE_CONFIG.VIDEO_WIDTH },
                height: { ideal: GESTURE_CONFIG.VIDEO_HEIGHT },
                facingMode: 'user',
                frameRate: { ideal: 30, max: 60 }
            }
        });

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
            top: 20px;
            right: 20px;
            width: 180px;
            height: 135px;
            border: 2px solid #06b6d4;
            border-radius: 12px;
            z-index: 100;
            box-shadow: 0 10px 30px rgba(6, 182, 212, 0.4);
            background: rgba(15, 23, 42, 0.95);
        `;
        document.body.appendChild(this.canvasElement);
        this.canvasCtx = this.canvasElement.getContext('2d', { alpha: true });
    }

    async initializeHandLandmarker() {
        const { FilesetResolver, HandLandmarker } = window;

        console.log('⏳ Loading MediaPipe v2 Wasm files...');
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm"
        );

        console.log('⏳ Creating Hand Landmarker v2...');
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: GESTURE_CONFIG.MIN_DETECTION_CONFIDENCE,
            minHandPresenceConfidence: GESTURE_CONFIG.MIN_DETECTION_CONFIDENCE,
            minTrackingConfidence: GESTURE_CONFIG.MIN_TRACKING_CONFIDENCE
        });

        console.log('✅ Hand Landmarker v2 Ready!');
    }

    startDetectionLoop() {
        const detectFrame = async () => {
            if (!this.isActive) return;

            const startTimeMs = performance.now();

            if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
                try {
                    const results = this.handLandmarker.detectForVideo(
                        this.videoElement,
                        startTimeMs
                    );

                    this.onResults(results);
                } catch (error) {
                    console.error('Detection error:', error);
                }
            }

            requestAnimationFrame(detectFrame);
        };

        detectFrame();
    }

    onResults(results) {
        this.updateFPS();

        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        this.canvasCtx.fillStyle = 'rgba(15, 23, 42, 0.5)';
        this.canvasCtx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const worldLandmarks = results.worldLandmarks ? results.worldLandmarks[0] : null;
            const handedness = results.handednesses ? results.handednesses[0] : null;

            if (handedness && handedness.length > 0) {
                this.detector.handType = handedness[0].categoryName;
                this.detector.handPresence = handedness[0].score;
            }

            this.drawEnhancedHand(landmarks);

            const fingerCount = this.detector.updateFingerStates(landmarks);
            const isFist = this.detector.detectFist(landmarks);
            const stability = this.detector.updateHandStability(landmarks);

            if (GESTURE_CONFIG.USE_WORLD_LANDMARKS && worldLandmarks) {
                const distance3D = this.detector.calculate3DDistance(worldLandmarks, 4, 8);
                if (distance3D !== null) {
                    console.log(`3D Distance (Thumb-Index): ${(distance3D * 100).toFixed(1)} cm`);
                }
            }

            this.handleGesture(fingerCount, isFist, stability);
            this.drawMinimalUI(fingerCount, isFist);
        } else {
            this.drawNoHandDetected();
            this.detector.reset();

            if (this.waitingForHandRelease) {
                console.log('Hand released - Ready for next question');
                this.waitingForHandRelease = false;
            }
        }

        this.canvasCtx.restore();
    }

    drawEnhancedHand(landmarks) {
        this.canvasCtx.shadowBlur = 20;
        this.canvasCtx.shadowColor = '#00FFD9';
        this.canvasCtx.strokeStyle = '#00FFD9';
        this.canvasCtx.lineWidth = 3;
        this.canvasCtx.lineCap = 'round';
        this.canvasCtx.lineJoin = 'round';

        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [5, 9], [9, 10], [10, 11], [11, 12],
            [9, 13], [13, 14], [14, 15], [15, 16],
            [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
        ];

        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];

            this.canvasCtx.beginPath();
            this.canvasCtx.moveTo(startPoint.x * this.canvasElement.width, startPoint.y * this.canvasElement.height);
            this.canvasCtx.lineTo(endPoint.x * this.canvasElement.width, endPoint.y * this.canvasElement.height);
            this.canvasCtx.stroke();
        });

        this.canvasCtx.shadowBlur = 0;

        landmarks.forEach((landmark, index) => {
            const x = landmark.x * this.canvasElement.width;
            const y = landmark.y * this.canvasElement.height;

            this.canvasCtx.beginPath();
            this.canvasCtx.arc(x, y, 4, 0, 2 * Math.PI);

            if ([0, 1, 5, 9, 13, 17].includes(index)) {
                this.canvasCtx.fillStyle = '#0099FF';
                this.canvasCtx.shadowColor = '#0099FF';
            } else if ([4, 8, 12, 16, 20].includes(index)) {
                const fingerNames = ['thumb', 'index', 'middle', 'ring', 'pinky'];
                const fingerIdx = [4, 8, 12, 16, 20].indexOf(index);
                const fingerName = fingerNames[fingerIdx];
                const state = this.detector.fingerStates[fingerName];

                if (state && state.open) {
                    this.canvasCtx.fillStyle = '#00FF88';
                    this.canvasCtx.shadowColor = '#00FF88';
                } else {
                    this.canvasCtx.fillStyle = '#FF0066';
                    this.canvasCtx.shadowColor = '#FF0066';
                }
            } else {
                this.canvasCtx.fillStyle = '#FFFFFF';
                this.canvasCtx.shadowColor = '#FFFFFF';
            }

            this.canvasCtx.shadowBlur = 8;
            this.canvasCtx.fill();
            this.canvasCtx.shadowBlur = 0;
        });
    }

    handleGesture(fingerCount, isFist, stability) {
        const now = Date.now();

        if (this.waitingForHandRelease) {
            return;
        }

        if (fingerCount >= 1 && fingerCount <= 4 && !isFist && stability > 0.7) {
            if (this.lastFingerCount !== fingerCount) {
                this.lastFingerCount = fingerCount;
                this.selectedOption = fingerCount;
                this.selectionStartTime = now;

                if (this.onOptionHighlight) {
                    this.onOptionHighlight(fingerCount - 1);
                }

                console.log(`SELECTED | ${fingerCount} finger${fingerCount > 1 ? 's' : ''} -> Option ${String.fromCharCode(64 + fingerCount)} | Auto-confirm in ${GESTURE_CONFIG.AUTO_CONFIRM_DELAY / 1000}s`);
            }

            if (this.selectionStartTime !== null) {
                const elapsed = now - this.selectionStartTime;

                if (elapsed >= GESTURE_CONFIG.AUTO_CONFIRM_DELAY) {
                    if (now - this.lastSelectionTime >= GESTURE_CONFIG.SELECTION_COOLDOWN) {
                        console.log(`AUTO-CONFIRMED! Option ${String.fromCharCode(64 + this.selectedOption)}`);
                        console.log('Waiting for hand to be removed before next selection...');

                        if (this.onOptionSelect) {
                            this.onOptionSelect(this.selectedOption - 1);
                        }

                        this.lastSelectionTime = now;
                        this.waitingForHandRelease = true;
                        this.resetGestureState();
                    }
                }
            }
        }

        if (isFist) {
            if (this.selectedOption !== null) {
                console.log(`FIST DETECTED - Selection CANCELLED!`);
                this.resetGestureState();
            }
        }

        if (fingerCount === 0 || fingerCount > 4) {
            if (this.selectedOption !== null) {
                this.resetGestureState();
            }
        }
    }

    drawMinimalUI(fingerCount, isFist) {
        const padding = 10;
        const uiHeight = 60;

        this.canvasCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        this.canvasCtx.fillRect(padding, padding, this.canvasElement.width - 2 * padding, uiHeight);

        const borderColor = isFist ? '#FF0066' : (fingerCount >= 1 && fingerCount <= 4 ? '#00FF88' : '#06b6d4');
        this.canvasCtx.strokeStyle = borderColor;
        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.shadowBlur = 10;
        this.canvasCtx.shadowColor = borderColor;
        this.canvasCtx.strokeRect(padding, padding, this.canvasElement.width - 2 * padding, uiHeight);
        this.canvasCtx.shadowBlur = 0;

        let yPos = 35;

        this.canvasCtx.font = 'bold 28px "Segoe UI"';
        this.canvasCtx.fillStyle = '#00FF88';
        this.canvasCtx.shadowBlur = 10;
        this.canvasCtx.shadowColor = '#00FF88';
        this.canvasCtx.fillText(`${fingerCount}`, padding + 10, yPos);
        this.canvasCtx.shadowBlur = 0;

        if (fingerCount >= 1 && fingerCount <= 4 && !isFist) {
            this.canvasCtx.font = 'bold 20px "Segoe UI"';
            this.canvasCtx.fillStyle = '#FFD700';
            this.canvasCtx.fillText(`-> ${String.fromCharCode(64 + fingerCount)}`, padding + 50, yPos);
        }

        yPos += 20;

        if (isFist) {
            this.canvasCtx.font = 'bold 16px "Segoe UI"';
            this.canvasCtx.fillStyle = '#FF0066';
            this.canvasCtx.fillText('CANCEL', padding + 10, yPos);
        }
        else if (this.selectionStartTime !== null && fingerCount >= 1 && fingerCount <= 4) {
            const elapsed = Date.now() - this.selectionStartTime;
            const progress = Math.min(elapsed / GESTURE_CONFIG.AUTO_CONFIRM_DELAY, 1);

            const barWidth = this.canvasElement.width - 2 * padding - 20;
            this.canvasCtx.fillStyle = 'rgba(255,255,255,0.2)';
            this.canvasCtx.fillRect(padding + 10, yPos, barWidth, 6);

            this.canvasCtx.fillStyle = '#00FF88';
            this.canvasCtx.fillRect(padding + 10, yPos, barWidth * progress, 6);
        }

        if (this.waitingForHandRelease) {
            this.canvasCtx.fillStyle = 'rgba(255, 215, 0, 0.2)';
            this.canvasCtx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);

            this.canvasCtx.font = 'bold 14px "Segoe UI"';
            this.canvasCtx.fillStyle = '#FFD700';
            this.canvasCtx.textAlign = 'center';
            this.canvasCtx.fillText('Remove Hand', this.canvasElement.width / 2, this.canvasElement.height / 2);
            this.canvasCtx.textAlign = 'left';
        }
    }

    drawNoHandDetected() {
        const centerX = this.canvasElement.width / 2;
        const centerY = this.canvasElement.height / 2;

        this.canvasCtx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        this.canvasCtx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        this.canvasCtx.font = 'bold 16px "Segoe UI"';
        this.canvasCtx.fillStyle = '#888';
        this.canvasCtx.textAlign = 'center';
        this.canvasCtx.fillText('No Hand', centerX, centerY);
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

    resetGestureState() {
        this.selectedOption = null;
        this.selectionStartTime = null;
        this.lastFingerCount = 0;
    }

    resetGestureStateIfNeeded() {
        if (this.selectedOption !== null) {
            this.resetGestureState();
        }
    }

    start() {
        this.isActive = true;
        this.startDetectionLoop();
        if (this.canvasElement) {
            this.canvasElement.style.display = 'block';
        }
        console.log('✅ Gesture Control v4.0 (MediaPipe v2) Started');
    }

    stop() {
        this.isActive = false;
        if (this.canvasElement) {
            this.canvasElement.style.display = 'none';
        }
        this.resetGestureState();
        console.log('⏸️ Gesture Control v4.0 Stopped');
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

        this.handLandmarker = null;
        console.log('🧹 Gesture Control v4.0 Cleaned Up');
    }
}

// ═══════════════════════════════════════════════════════════
// GLOBAL API
// ═══════════════════════════════════════════════════════════

const gestureController = new GestureController();

async function initGestureControl() {
    const success = await gestureController.initialize();
    if (success) {
        if (typeof notify === 'function') {
            notify('Gesture Control v4.0 (MediaPipe v2) Ready!', 'cyan');
        }
        return true;
    } else {
        if (typeof notify === 'function') {
            notify('Failed to initialize gesture control', 'red');
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

console.log('🚀 M.B.M.K. Gesture Control v4.0 Loaded - MediaPipe v2 with 3D Tracking');