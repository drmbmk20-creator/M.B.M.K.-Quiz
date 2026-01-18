// ═══════════════════════════════════════════════════════════
// 👋 M.B.M.K. GESTURE CONTROL SYSTEM v3.0 - ULTRA PRECISION
// ═══════════════════════════════════════════════════════════

const GESTURE_CONFIG = {
    VIDEO_WIDTH: 640,
    VIDEO_HEIGHT: 480,
    MIN_DETECTION_CONFIDENCE: 0.85,
    MIN_TRACKING_CONFIDENCE: 0.85,
    FIST_CONFIRM_DELAY: 700,
    SELECTION_COOLDOWN: 1500,
    SMOOTHING_FRAMES: 3,
    
    // ✅ Hysteresis Thresholds - منع التذبذب
    FINGER_OPEN_THRESHOLD: 0.75,    // يحتاج 75% ثقة لفتح
    FINGER_CLOSE_THRESHOLD: 0.68,   // يحتاج 68% فقط لإغلاق
    
    // ✅ Fist Detection Weights
    FIST_WEIGHTS: {
        closedFingers: 4,
        compactness: 3,
        thumbPosition: 2,
        handShape: 1,
        curlIntensity: 2
    },
    FIST_SCORE_THRESHOLD: 0.90,     // يحتاج 90% من المجموع
    
    // ✅ Stability Tracking
    STABILITY_THRESHOLD: 0.80,      // 80% استقرار للقبول
    STABILITY_HISTORY: 5,           // 5 frames للتحليل
    
    FIST_STABILITY_FRAMES: 2
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
        
        // ✨ Enhanced State Tracking
        this.fingerCountHistory = [];
        this.fistHistory = [];
        this.isProcessing = false;
        
        // ✅ NEW: Multi-Layer Finger States with Hysteresis
        this.fingerStates = [false, false, false, false, false]; // [thumb, index, middle, ring, pinky]
        
        // ✅ NEW: Hand Stability Tracker
        this.handPositionHistory = [];
        this.currentStability = 0;
        
        // ✅ NEW: Detailed Diagnostics
        this.diagnostics = {
            fingerScores: [0, 0, 0, 0, 0],
            fistScore: 0,
            fistComponents: {}
        };
        
        this.performanceMonitor = {
            fps: 0,
            lastFrameTime: 0,
            frameCount: 0
        };
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Ultra-Precision Gesture Control v3.0...');
            await this.loadMediaPipe();
            await this.setupCamera();
            this.setupCanvas();
            this.initializeHands();
            this.startPerformanceMonitoring();
            console.log('✅ Gesture Control System v3.0 Initialized with Advanced Detection');
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
            width: 320px;
            height: 240px;
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
        
        this.canvasCtx.filter = 'brightness(1.1) contrast(1.1)';
        this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
        this.canvasCtx.filter = 'none';

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // ✅ NEW: Update Stability Tracker
            this.updateHandStability(landmarks);

            // ✅ Enhanced Hand Drawing with per-finger status
            this.drawEnhancedHand(landmarks);

            // ✅ Multi-Layer Finger Detection
            const fingerAnalysis = this.analyzeFingers(landmarks);
            const fingerCount = fingerAnalysis.openCount;

            // ✅ Advanced Fist Detection
            const fistAnalysis = this.detectAdvancedFist(landmarks);
            const isFist = fistAnalysis.isFist;

            const smoothedFingerCount = this.smoothGesture(fingerCount);
            const smoothedFist = this.smoothFist(isFist);

            this.handleGesture(smoothedFingerCount, smoothedFist, fingerAnalysis, fistAnalysis);
            this.drawEnhancedUI(smoothedFingerCount, smoothedFist, landmarks, fingerAnalysis, fistAnalysis);
        } else {
            this.drawNoHandDetected();
            this.resetGestureState();
        }

        this.canvasCtx.restore();
    }

    // ═══════════════════════════════════════════════════════════
    // ✅ NEW: Multi-Layer Finger Detection (5 Layers)
    // ═══════════════════════════════════════════════════════════
    analyzeFingers(landmarks) {
        const fingers = [
            { name: 'Thumb', tip: 4, ip: 3, mcp: 2, cmc: 1 },
            { name: 'Index', tip: 8, pip: 6, mcp: 5 },
            { name: 'Middle', tip: 12, pip: 10, mcp: 9 },
            { name: 'Ring', tip: 16, pip: 14, mcp: 13 },
            { name: 'Pinky', tip: 20, pip: 18, mcp: 17 }
        ];

        const wrist = landmarks[0];
        const palm = landmarks[9];
        const isRightHand = landmarks[17].x < landmarks[5].x;

        const analysis = {
            fingerDetails: [],
            openCount: 0,
            closedCount: 0
        };

        fingers.forEach((finger, index) => {
            let score = 0;
            let maxScore = 5;

            if (index === 0) {
                // Thumb special handling
                score = this.analyzeThumb(landmarks, isRightHand);
            } else {
                // ✅ Layer 1: Vertical Extension
                const verticalScore = this.checkVerticalExtension(landmarks, finger);
                score += verticalScore;

                // ✅ Layer 2: Joint Alignment
                const alignmentScore = this.checkJointAlignment(landmarks, finger);
                score += alignmentScore;

                // ✅ Layer 3: Distance from Palm
                const distanceScore = this.checkDistanceFromPalm(landmarks, finger, palm);
                score += distanceScore;

                // ✅ Layer 4: Curl Detection
                const curlScore = this.checkCurlDetection(landmarks, finger);
                score += curlScore;

                // ✅ Layer 5: Z-Depth Analysis
                const depthScore = this.checkZDepth(landmarks, finger);
                score += depthScore;
            }

            const confidence = score / maxScore;
            this.diagnostics.fingerScores[index] = confidence;

            // ✅ Hysteresis System
            const wasOpen = this.fingerStates[index];
            const threshold = wasOpen ? 
                GESTURE_CONFIG.FINGER_CLOSE_THRESHOLD : 
                GESTURE_CONFIG.FINGER_OPEN_THRESHOLD;

            const isOpen = confidence >= threshold;
            this.fingerStates[index] = isOpen;

            analysis.fingerDetails.push({
                name: finger.name,
                isOpen: isOpen,
                confidence: confidence,
                score: score
            });

            if (isOpen) analysis.openCount++;
            else analysis.closedCount++;
        });

        return analysis;
    }

    // Layer 1: Vertical Extension
    checkVerticalExtension(landmarks, finger) {
        const tip = landmarks[finger.tip];
        const mcp = landmarks[finger.mcp];
        
        const extension = mcp.y - tip.y;
        return extension > 0.08 ? 1 : extension > 0.05 ? 0.5 : 0;
    }

    // Layer 2: Joint Alignment
    checkJointAlignment(landmarks, finger) {
        const tip = landmarks[finger.tip];
        const pip = landmarks[finger.pip];
        const mcp = landmarks[finger.mcp];
        
        const tipToPip = pip.y - tip.y;
        const pipToMcp = mcp.y - pip.y;
        
        const aligned = tipToPip > 0 && pipToMcp > 0;
        return aligned ? 1 : 0.3;
    }

    // Layer 3: Distance from Palm
    checkDistanceFromPalm(landmarks, finger, palm) {
        const tip = landmarks[finger.tip];
        const dist = Math.hypot(tip.x - palm.x, tip.y - palm.y);
        
        return dist > 0.20 ? 1 : dist > 0.15 ? 0.6 : 0.2;
    }

    // Layer 4: Curl Detection
    checkCurlDetection(landmarks, finger) {
        const tip = landmarks[finger.tip];
        const pip = landmarks[finger.pip];
        const mcp = landmarks[finger.mcp];
        
        const angle = this.calculateAngle(
            {x: tip.x, y: tip.y},
            {x: pip.x, y: pip.y},
            {x: mcp.x, y: mcp.y}
        );
        
        // Straight = ~180°, Curled = <140°
        return angle > 160 ? 1 : angle > 140 ? 0.5 : 0;
    }

    // Layer 5: Z-Depth Analysis
    checkZDepth(landmarks, finger) {
        const tip = landmarks[finger.tip];
        const mcp = landmarks[finger.mcp];
        
        // z coordinate indicates depth
        const depthDiff = Math.abs(tip.z - mcp.z);
        return depthDiff < 0.05 ? 1 : 0.5;
    }

    analyzeThumb(landmarks, isRightHand) {
        const thumbTip = landmarks[4];
        const thumbIP = landmarks[3];
        const thumbMCP = landmarks[2];
        const indexMCP = landmarks[5];
        
        let score = 0;
        
        // Horizontal extension check
        if (isRightHand) {
            if (thumbTip.x < thumbMCP.x - 0.06) score += 2;
            else if (thumbTip.x < thumbMCP.x - 0.03) score += 1;
        } else {
            if (thumbTip.x > thumbMCP.x + 0.06) score += 2;
            else if (thumbTip.x > thumbMCP.x + 0.03) score += 1;
        }
        
        // Distance from index
        const dist = Math.hypot(thumbTip.x - indexMCP.x, thumbTip.y - indexMCP.y);
        if (dist > 0.15) score += 2;
        else if (dist > 0.10) score += 1;
        
        // Y position check
        if (thumbTip.y < thumbIP.y - 0.02) score += 1;
        
        return score;
    }

    calculateAngle(a, b, c) {
        const ba = { x: a.x - b.x, y: a.y - b.y };
        const bc = { x: c.x - b.x, y: c.y - b.y };
        
        const dot = ba.x * bc.x + ba.y * bc.y;
        const magBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
        const magBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);
        
        const cosAngle = dot / (magBA * magBC);
        return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
    }

    // ═══════════════════════════════════════════════════════════
    // ✅ NEW: Advanced Fist Detection (5 Components)
    // ═══════════════════════════════════════════════════════════
    detectAdvancedFist(landmarks) {
        const weights = GESTURE_CONFIG.FIST_WEIGHTS;
        let totalScore = 0;
        let maxScore = Object.values(weights).reduce((a, b) => a + b, 0);

        const components = {};

        // ✅ Component 1: Closed Fingers Count
        const closedCount = this.fingerStates.filter(state => !state).length;
        const closedScore = (closedCount / 5) * weights.closedFingers;
        totalScore += closedScore;
        components.closedFingers = { value: closedCount, score: closedScore, max: weights.closedFingers };

        // ✅ Component 2: Compactness (bounding box ratio)
        const compactness = this.calculateCompactness(landmarks);
        const compactScore = (compactness < 0.15 ? 1 : compactness < 0.20 ? 0.7 : 0.3) * weights.compactness;
        totalScore += compactScore;
        components.compactness = { value: compactness.toFixed(3), score: compactScore, max: weights.compactness };

        // ✅ Component 3: Thumb Position
        const thumbPos = this.checkThumbInFist(landmarks);
        const thumbScore = thumbPos * weights.thumbPosition;
        totalScore += thumbScore;
        components.thumbPosition = { value: thumbPos.toFixed(2), score: thumbScore, max: weights.thumbPosition };

        // ✅ Component 4: Hand Shape (width/height ratio)
        const shapeRatio = this.calculateHandShape(landmarks);
        const shapeScore = (shapeRatio > 0.6 && shapeRatio < 1.2 ? 1 : 0.5) * weights.handShape;
        totalScore += shapeScore;
        components.handShape = { value: shapeRatio.toFixed(2), score: shapeScore, max: weights.handShape };

        // ✅ Component 5: Curl Intensity
        const curlIntensity = this.calculateCurlIntensity(landmarks);
        const curlScore = curlIntensity * weights.curlIntensity;
        totalScore += curlScore;
        components.curlIntensity = { value: curlIntensity.toFixed(2), score: curlScore, max: weights.curlIntensity };

        const finalScore = totalScore / maxScore;
        this.diagnostics.fistScore = finalScore;
        this.diagnostics.fistComponents = components;

        const isFist = finalScore >= GESTURE_CONFIG.FIST_SCORE_THRESHOLD;

        return {
            isFist: isFist,
            score: finalScore,
            components: components,
            totalScore: totalScore,
            maxScore: maxScore
        };
    }

    calculateCompactness(landmarks) {
        const xs = landmarks.map(l => l.x);
        const ys = landmarks.map(l => l.y);
        
        const width = Math.max(...xs) - Math.min(...xs);
        const height = Math.max(...ys) - Math.min(...ys);
        
        return Math.max(width, height);
    }

    checkThumbInFist(landmarks) {
        const thumbTip = landmarks[4];
        const indexMCP = landmarks[5];
        const palm = landmarks[9];
        
        const thumbToIndex = Math.hypot(thumbTip.x - indexMCP.x, thumbTip.y - indexMCP.y);
        const thumbToPalm = Math.hypot(thumbTip.x - palm.x, thumbTip.y - palm.y);
        
        if (thumbToIndex < 0.10 && thumbToPalm < 0.12) return 1.0;
        if (thumbToIndex < 0.14 && thumbToPalm < 0.16) return 0.7;
        return 0.3;
    }

    calculateHandShape(landmarks) {
        const xs = landmarks.map(l => l.x);
        const ys = landmarks.map(l => l.y);
        
        const width = Math.max(...xs) - Math.min(...xs);
        const height = Math.max(...ys) - Math.min(...ys);
        
        return width / (height + 0.001);
    }

    calculateCurlIntensity(landmarks) {
        const fingers = [
            { tip: 8, mcp: 5 },
            { tip: 12, mcp: 9 },
            { tip: 16, mcp: 13 },
            { tip: 20, mcp: 17 }
        ];

        let totalCurl = 0;
        fingers.forEach(finger => {
            const dist = Math.hypot(
                landmarks[finger.tip].x - landmarks[finger.mcp].x,
                landmarks[finger.tip].y - landmarks[finger.mcp].y
            );
            totalCurl += (dist < 0.10 ? 1 : 0);
        });

        return totalCurl / fingers.length;
    }

    // ═══════════════════════════════════════════════════════════
    // ✅ NEW: Hand Stability Tracker
    // ═══════════════════════════════════════════════════════════
    updateHandStability(landmarks) {
        const palmCenter = landmarks[9];
        const currentPos = { x: palmCenter.x, y: palmCenter.y };

        this.handPositionHistory.push(currentPos);
        if (this.handPositionHistory.length > GESTURE_CONFIG.STABILITY_HISTORY) {
            this.handPositionHistory.shift();
        }

        if (this.handPositionHistory.length < 2) {
            this.currentStability = 0;
            return;
        }

        let totalMovement = 0;
        for (let i = 1; i < this.handPositionHistory.length; i++) {
            const prev = this.handPositionHistory[i - 1];
            const curr = this.handPositionHistory[i];
            const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
            totalMovement += dist;
        }

        const avgMovement = totalMovement / (this.handPositionHistory.length - 1);
        this.currentStability = Math.max(0, 1 - (avgMovement * 20));
    }

    smoothGesture(fingerCount) {
        this.fingerCountHistory.push(fingerCount);
        if (this.fingerCountHistory.length > GESTURE_CONFIG.SMOOTHING_FRAMES) {
            this.fingerCountHistory.shift();
        }
        
        return this.getMostCommonValue(this.fingerCountHistory);
    }

    smoothFist(isFist) {
        this.fistHistory.push(isFist ? 1 : 0);
        if (this.fistHistory.length > GESTURE_CONFIG.FIST_STABILITY_FRAMES) {
            this.fistHistory.shift();
        }
        
        const recentFists = this.fistHistory.slice(-GESTURE_CONFIG.FIST_STABILITY_FRAMES);
        const allFist = recentFists.every(f => f === 1);
        
        return allFist && this.fistHistory.length >= GESTURE_CONFIG.FIST_STABILITY_FRAMES;
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

    handleGesture(fingerCount, isFist, fingerAnalysis, fistAnalysis) {
        const now = Date.now();
        const isStable = this.currentStability >= GESTURE_CONFIG.STABILITY_THRESHOLD;

        // ✅ Selection with Stability Check
        if (fingerCount >= 1 && fingerCount <= 4 && !isFist && isStable) {
            if (this.lastFingerCount !== fingerCount) {
                this.lastFingerCount = fingerCount;
                this.selectedOption = fingerCount;
                this.fistDetectedTime = null;

                if (this.onOptionHighlight) {
                    this.onOptionHighlight(fingerCount - 1);
                }

                console.log(`✨ SELECTED | ${fingerCount} fingers → Option ${String.fromCharCode(64 + fingerCount)} | Stability: ${(this.currentStability * 100).toFixed(0)}%`);
            }
        }
        
        if (fingerCount === 0 && !isFist) {
            if (this.selectedOption !== null) {
                this.selectedOption = null;
                this.lastFingerCount = 0;
                this.fistDetectedTime = null;
            }
        }

        // ✅ Confirmation with Advanced Fist Detection
        if (isFist && this.selectedOption !== null && isStable) {
            if (this.fistDetectedTime === null) {
                this.fistDetectedTime = now;
                
                const { totalScore, maxScore, components } = fistAnalysis;
                const percentage = ((totalScore / maxScore) * 100).toFixed(1);
                const closedStr = `${components.closedFingers.value}/5`;
                const compactStr = components.compactness.value;
                
                console.log(`🔍 FIST ANALYSIS | Score: ${totalScore.toFixed(1)}/${maxScore} (${percentage}%) | Closed: ${closedStr} | Compact: ${compactStr} | ✊ CONFIRMED`);
                console.log(`✊ FIST LOCKED! Confirming Option ${String.fromCharCode(64 + this.selectedOption)}...`);
            } else {
                const elapsed = now - this.fistDetectedTime;
                
                if (elapsed >= GESTURE_CONFIG.FIST_CONFIRM_DELAY) {
                    if (now - this.lastSelectionTime >= GESTURE_CONFIG.SELECTION_COOLDOWN) {
                        console.log(`╔═══════════════════════════════════╗`);
                        console.log(`║  ✅ CONFIRMED! Option ${String.fromCharCode(64 + this.selectedOption)}          ║`);
                        console.log(`╚═══════════════════════════════════╝`);

                        if (this.onOptionSelect) {
                            this.onOptionSelect(this.selectedOption - 1);
                        }

                        this.lastSelectionTime = now;
                        this.resetGestureState();
                    }
                }
            }
        } else if (!isFist && this.fistDetectedTime !== null) {
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
        this.fingerStates = [false, false, false, false, false];
    }

    drawEnhancedHand(landmarks) {
        // رسم الخطوط
        this.canvasCtx.shadowBlur = 12;
        this.canvasCtx.shadowColor = '#00FF00';
        window.drawConnectors(this.canvasCtx, landmarks, window.HAND_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 3
        });
        this.canvasCtx.shadowBlur = 0;

        // ✅ رسم النقاط مع ألوان حسب حالة الإصبع
        const fingerTips = [4, 8, 12, 16, 20];
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * this.canvasElement.width;
            const y = landmark.y * this.canvasElement.height;
            
            this.canvasCtx.beginPath();
            this.canvasCtx.arc(x, y, fingerTips.includes(index) ? 6 : 4, 0, 2 * Math.PI);
            
            if (fingerTips.includes(index)) {
                const fingerIdx = fingerTips.indexOf(index);
                const isOpen = this.fingerStates[fingerIdx];
                
                this.canvasCtx.fillStyle = isOpen ? '#00FF88' : '#FF3366';
                this.canvasCtx.shadowBlur = 12;
                this.canvasCtx.shadowColor = isOpen ? '#00FF88' : '#FF3366';
            } else {
                this.canvasCtx.fillStyle = '#00FFFF';
                this.canvasCtx.shadowBlur = 6;
                this.canvasCtx.shadowColor = '#00FFFF';
            }
            
            this.canvasCtx.fill();
            this.canvasCtx.shadowBlur = 0;
        });
    }

    drawEnhancedUI(fingerCount, isFist, landmarks, fingerAnalysis, fistAnalysis) {
        const padding = 12;
        const uiHeight = 180;
        
        const gradient = this.canvasCtx.createLinearGradient(0, 0, 0, uiHeight);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
        gradient.addColorStop(1, 'rgba(20, 20, 40, 0.95)');
        
        this.canvasCtx.fillStyle = gradient;
        this.canvasCtx.fillRect(padding, padding, this.canvasElement.width - 2 * padding, uiHeight);
        
        const borderColor = isFist ? '#FF0066' : (fingerCount >= 1 && fingerCount <= 4 ? '#00FF88' : '#06b6d4');
        this.canvasCtx.strokeStyle = borderColor;
        this.canvasCtx.lineWidth = 3;
        this.canvasCtx.shadowBlur = 15;
        this.canvasCtx.shadowColor = borderColor;
        this.canvasCtx.strokeRect(padding, padding, this.canvasElement.width - 2 * padding, uiHeight);
        this.canvasCtx.shadowBlur = 0;

        let yPos = 38;

        // العنوان
        this.canvasCtx.font = 'bold 16px "Segoe UI", Arial';
        this.canvasCtx.fillStyle = '#00D9FF';
        this.canvasCtx.fillText('🎯 ULTRA PRECISION v3.0', padding + 8, yPos);
        yPos += 30;

        // عدد الأصابع مع التفاصيل
        this.canvasCtx.font = 'bold 28px "Segoe UI", Arial';
        this.canvasCtx.fillStyle = '#00FF88';
        this.canvasCtx.shadowBlur = 10;
        this.canvasCtx.shadowColor = '#00FF88';
        this.canvasCtx.fillText(`${fingerCount} 🖐️`, padding + 8, yPos);
        this.canvasCtx.shadowBlur = 0;

        // الخيار المحدد
        if (fingerCount >= 1 && fingerCount <= 4 && !isFist) {
            this.canvasCtx.font = 'bold 20px "Segoe UI", Arial';
            this.canvasCtx.fillStyle = '#FFD700';
            this.canvasCtx.fillText(`→ Option ${String.fromCharCode(64 + fingerCount)}`, padding + 110, yPos);
        }

        yPos += 30;

        // ✅ Hand Stability Bar
        const stabilityBarWidth = this.canvasElement.width - 2 * padding - 16;
        const stabilityBarHeight = 6;
        
        this.canvasCtx.font = 'bold 11px "Segoe UI", Arial';
        this.canvasCtx.fillStyle = '#888';
        this.canvasCtx.fillText('Stability:', padding + 8, yPos);
        yPos += 12;

        this.canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.canvasCtx.fillRect(padding + 8, yPos, stabilityBarWidth, stabilityBarHeight);

        const stabilityGradient = this.canvasCtx.createLinearGradient(padding + 8, 0, padding + 8 + stabilityBarWidth, 0);
        stabilityGradient.addColorStop(0, '#FF3366');
        stabilityGradient.addColorStop(0.5, '#FFD700');
        stabilityGradient.addColorStop(1, '#00FF88');
        
        this.canvasCtx.fillStyle = stabilityGradient;
        this.canvasCtx.fillRect(padding + 8, yPos, stabilityBarWidth * this.currentStability, stabilityBarHeight);

        this.canvasCtx.font = 'bold 10px monospace';
        this.canvasCtx.fillStyle = this.currentStability >= GESTURE_CONFIG.STABILITY_THRESHOLD ? '#00FF88' : '#FF8800';
        this.canvasCtx.fillText(`${(this.currentStability * 100).toFixed(0)}%`, this.canvasElement.width - 50, yPos + 6);

        yPos += 20;

        // ✅ Fist Detection Info
        if (isFist) {
            const progress = this.fistDetectedTime !== null 
                ? Math.min((Date.now() - this.fistDetectedTime) / GESTURE_CONFIG.FIST_CONFIRM_DELAY, 1)
                : 0;

            this.canvasCtx.font = 'bold 20px "Segoe UI", Arial';
            this.canvasCtx.fillStyle = '#FF0066';
            this.canvasCtx.shadowBlur = 15;
            this.canvasCtx.shadowColor = '#FF0066';
            this.canvasCtx.fillText('✊ CONFIRMING...', padding + 8, yPos);
            this.canvasCtx.shadowBlur = 0;

            // Fist Score
            const percentage = (fistAnalysis.score * 100).toFixed(0);
            this.canvasCtx.font = 'bold 12px monospace';
            this.canvasCtx.fillStyle = '#FFD700';
            this.canvasCtx.fillText(`${percentage}%`, this.canvasElement.width - 50, yPos);

            yPos += 16;

            // شريط التقدم
            const progressBarWidth = this.canvasElement.width - 2 * padding - 16;
            const progressBarHeight = 10;

            this.canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.canvasCtx.fillRect(padding + 8, yPos, progressBarWidth, progressBarHeight);

            const progressGradient = this.canvasCtx.createLinearGradient(padding + 8, 0, padding + 8 + progressBarWidth, 0);
            progressGradient.addColorStop(0, '#00FF88');
            progressGradient.addColorStop(1, '#00D9FF');
            
            this.canvasCtx.fillStyle = progressGradient;
            this.canvasCtx.fillRect(padding + 8, yPos, progressBarWidth * progress, progressBarHeight);

            yPos += 20;

            // ✅ Detailed Fist Components (mini display)
            this.canvasCtx.font = 'bold 9px monospace';
            this.canvasCtx.fillStyle = '#AAA';
            const comp = fistAnalysis.components;
            this.canvasCtx.fillText(`F:${comp.closedFingers.value} C:${comp.compactness.value} T:${comp.thumbPosition.value}`, padding + 8, yPos);
        }

        // FPS Counter
        this.canvasCtx.font = 'bold 13px monospace';
        this.canvasCtx.fillStyle = '#888';
        this.canvasCtx.fillText(`FPS: ${this.performanceMonitor.fps}`, this.canvasElement.width - 70, 28);
    }

    drawNoHandDetected() {
        const centerX = this.canvasElement.width / 2;
        const centerY = this.canvasElement.height / 2;

        const gradient = this.canvasCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300);
        gradient.addColorStop(0, 'rgba(20, 20, 40, 0.95)');
        gradient.addColorStop(1, 'rgba(10, 10, 20, 0.98)');
        this.canvasCtx.fillStyle = gradient;
        this.canvasCtx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        this.canvasCtx.font = '70px Arial';
        this.canvasCtx.textAlign = 'center';
        this.canvasCtx.fillStyle = 'rgba(255, 107, 107, 0.6)';
        const pulse = Math.sin(Date.now() / 500) * 0.2 + 1;
        this.canvasCtx.shadowBlur = 20 * pulse;
        this.canvasCtx.shadowColor = '#FF6B6B';
        this.canvasCtx.fillText('✋', centerX, centerY - 20);
        this.canvasCtx.shadowBlur = 0;

        this.canvasCtx.font = 'bold 24px "Segoe UI", Arial';
        this.canvasCtx.fillStyle = '#FF6B6B';
        this.canvasCtx.fillText('No Hand Detected', centerX, centerY + 45);

        this.canvasCtx.font = '16px "Segoe UI", Arial';
        this.canvasCtx.fillStyle = '#FFFFFF';
        this.canvasCtx.fillText('Show your hand to the camera', centerX, centerY + 75);

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
        console.log('▶️ Ultra-Precision Gesture Control v3.0 Started');
        console.log('📊 Features: Multi-Layer Detection | Hysteresis | Advanced Fist | Stability Tracking');
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
        console.log('⏸️ Gesture Control v3.0 Stopped');
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
        console.log('🧹 Gesture Control v3.0 Cleaned Up');
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
            notify('✨ Ultra-Precision Gesture v3.0 Ready!', 'cyan');
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

console.log('✅ M.B.M.K. Ultra-Precision Gesture Control v3.0 Loaded');
console.log('📊 Features Enabled:');
console.log('   ✓ Multi-Layer Finger Detection (5 Layers)');
console.log('   ✓ Hysteresis System (Anti-Jitter)');
console.log('   ✓ Advanced Fist Detection (5 Components)');
console.log('   ✓ Hand Stability Tracker');
console.log('   ✓ Weighted Scoring System');
console.log('   ✓ Enhanced Visual Feedback');
console.log('🚀 Ready for Ultra-Precise Gesture Recognition!');
