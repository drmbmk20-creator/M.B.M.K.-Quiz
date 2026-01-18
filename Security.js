// ═══════════════════════════════════════════════════════════
// 🔒 M.B.M.K. SECURITY SYSTEM v1.0
// نظام الأمان المتكامل - يعمل بدون إنترنت
// ═══════════════════════════════════════════════════════════

const SECURITY_CONFIG = {
    MAX_VIOLATIONS: 3,
    SECRET_SALT: 'MBMK_2025_EXAM_SALT_' + btoa(Date.now().toString()),
    DEVTOOLS_CHECK_INTERVAL: 1000,
    DEVTOOLS_THRESHOLD: 160,
    FULLSCREEN_RETRY_DELAY: 1000
};

let violations = 0;
let tabSwitchCount = 0;

// ═══════════════════════════════════════════════════════════
// 🎯 التهيئة الرئيسية
// ═══════════════════════════════════════════════════════════

function initSecuritySystem() {
    if (!isQrExam) return;

    console.log('🔒 Security System Activated');

    // الأولوية العالية
    detectDevTools();
    preventCopying();
    monitorTabSwitch();

    // الأولوية المتوسطة
    preventScreenshots();
    enforceFullscreen();
    addWatermark();

    // تشفير البيانات
    shuffleAndEncrypt();
}

// ═══════════════════════════════════════════════════════════
// 🔴 أولوية عالية: كشف DevTools
// ═══════════════════════════════════════════════════════════

function detectDevTools() {
    const check = () => {
        if (!isExamActive) return;

        // Bypass for teacher local testing
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;

        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;

        if (widthDiff > SECURITY_CONFIG.DEVTOOLS_THRESHOLD ||
            heightDiff > SECURITY_CONFIG.DEVTOOLS_THRESHOLD) {
            terminateExam("🚫 Developer Tools Detected - Exam Terminated");
        }
    };

    setInterval(check, SECURITY_CONFIG.DEVTOOLS_CHECK_INTERVAL);

    // كشف إضافي للكونسول
    const devtools = /./;
    devtools.toString = function () {
        if (isExamActive && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            terminateExam("🚫 Console Access Detected");
        }
        return '';
    };
    console.log('%c', devtools);
}

// ═══════════════════════════════════════════════════════════
// 🔴 أولوية عالية: منع النسخ
// ═══════════════════════════════════════════════════════════

function preventCopying() {
    // منع النسخ
    document.addEventListener('copy', (e) => {
        if (isExamActive) {
            e.preventDefault();
            addViolation('Copying attempt blocked');
            return false;
        }
    });

    // منع القص
    document.addEventListener('cut', (e) => {
        if (isExamActive) {
            e.preventDefault();
            addViolation('Cut attempt blocked');
            return false;
        }
    });

    // منع اللصق
    document.addEventListener('paste', (e) => {
        if (isExamActive) {
            e.preventDefault();
            return false;
        }
    });

    // منع التحديد
    document.addEventListener('selectstart', (e) => {
        if (isExamActive) {
            e.preventDefault();
            return false;
        }
    });

    // CSS إضافي
    const style = document.createElement('style');
    style.id = 'security-styles';
    style.innerHTML = `
        body.exam-active {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
        }
        body.exam-active * {
            user-select: none !important;
            -webkit-user-select: none !important;
        }
    `;
    document.head.appendChild(style);

    // تفعيل الحماية
    if (isExamActive) {
        document.body.classList.add('exam-active');
    }
}

// ═══════════════════════════════════════════════════════════
// 🔴 أولوية عالية: مراقبة تبديل التبويبات
// ═══════════════════════════════════════════════════════════

function monitorTabSwitch() {
    // كشف إخفاء الصفحة
    document.addEventListener('visibilitychange', () => {
        if (isExamActive && document.hidden) {
            tabSwitchCount++;

            if (tabSwitchCount === 1) {
                notify('⚠️ WARNING 1/2: Do not leave this tab!', 'red');
                playSound('error');
            } else if (tabSwitchCount >= 2) {
                terminateExam("🚫 Left exam tab multiple times");
            }
        }
    });

    // كشف فقدان التركيز
    window.addEventListener('blur', () => {
        if (isExamActive) {
            notify('⚠️ Stay focused on the exam!', 'red');

            // محاولة إرجاع التركيز
            setTimeout(() => {
                if (isExamActive && !document.hasFocus()) {
                    window.focus();
                }
            }, 100);
        }
    });

    // منع Alt+Tab (محاولة)
    document.addEventListener('keydown', (e) => {
        if (isExamActive && e.altKey && e.key === 'Tab') {
            e.preventDefault();
            notify('⚠️ Do not switch windows!', 'red');
            addViolation('Alt+Tab blocked');
        }
    });
}

// ═══════════════════════════════════════════════════════════
// 🟡 أولوية متوسطة: منع Screenshots
// ═══════════════════════════════════════════════════════════

function preventScreenshots() {
    // كشف PrintScreen
    document.addEventListener('keyup', (e) => {
        if (isExamActive && e.key === 'PrintScreen') {
            navigator.clipboard.writeText('');
            addViolation('Screenshot attempt detected');
            notify('📸 Screenshots are blocked!', 'red');
        }
    });

    // منع اختصارات Screenshot
    document.addEventListener('keydown', (e) => {
        if (!isExamActive) return;

        // Windows: Win+PrintScreen, Win+Shift+S
        if (e.key === 'PrintScreen' ||
            (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's')) {
            e.preventDefault();
            addViolation('Screenshot shortcut blocked');
            notify('📸 Screenshots are disabled!', 'red');
        }
    });
}

// ═══════════════════════════════════════════════════════════
// 🟡 أولوية متوسطة: فرض Fullscreen
// ═══════════════════════════════════════════════════════════

function enforceFullscreen() {
    if (!isExamActive) return;

    // طلب Fullscreen
    const requestFS = () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Fullscreen request failed:', err);
                notify('⚠️ Fullscreen mode recommended', 'red');
            });
        }
    };

    requestFS();

    // مراقبة الخروج من Fullscreen
    document.addEventListener('fullscreenchange', () => {
        if (isExamActive && !document.fullscreenElement) {
            addViolation('Exited fullscreen mode');
            notify('⚠️ Stay in fullscreen!', 'red');

            // إعادة محاولة الدخول
            setTimeout(() => {
                if (isExamActive && !document.fullscreenElement) {
                    requestFS();
                }
            }, SECURITY_CONFIG.FULLSCREEN_RETRY_DELAY);
        }
    });

    // منع Escape
    document.addEventListener('keydown', (e) => {
        if (isExamActive && e.key === 'Escape' && document.fullscreenElement) {
            e.preventDefault();
            notify('⚠️ Fullscreen required!', 'red');
        }
    });
}

// ═══════════════════════════════════════════════════════════
// 🟡 أولوية متوسطة: Watermark
// ═══════════════════════════════════════════════════════════

function addWatermark() {
    // إزالة القديم إن وُجد
    const old = document.getElementById('security-watermark');
    if (old) old.remove();

    const watermark = document.createElement('div');
    watermark.id = 'security-watermark';
    watermark.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 48px;
        color: rgba(239, 68, 68, 0.06);
        pointer-events: none;
        z-index: 9998;
        font-weight: 900;
        white-space: pre-line;
        font-family: 'Courier New', monospace;
        text-align: center;
        line-height: 1.8;
        letter-spacing: 0.1em;
    `;

    const now = new Date();
    const timestamp = now.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    watermark.innerText = `${studentName}\n${timestamp}\nM.B.M.K. EXAM`;
    document.body.appendChild(watermark);
}

// ═══════════════════════════════════════════════════════════
// 🔐 تشفير وخلط البيانات
// ═══════════════════════════════════════════════════════════

function shuffleAndEncrypt() {
    if (!db || db.length === 0) return;

    // خلط ترتيب الأسئلة
    db = shuffleArray(db);

    // تشفير كل سؤال
    db = db.map((question, index) => {
        if (question.a && Array.isArray(question.a)) {
            // حفظ الجواب الصحيح قبل الخلط
            const correctAnswer = question.a[question.c];

            // خلط الخيارات
            const shuffledOptions = shuffleArray([...question.a]);

            // إيجاد الموقع الجديد للجواب الصحيح
            const newCorrectIndex = shuffledOptions.indexOf(correctAnswer);

            // تشفير البيانات
            return {
                q: btoa(unescape(encodeURIComponent(question.q))),
                a: shuffledOptions.map(opt => btoa(unescape(encodeURIComponent(opt)))),
                _c: btoa(String(newCorrectIndex) + SECURITY_CONFIG.SECRET_SALT),
                _encrypted: true
            };
        } else if (question.diagnosis) {
            // Clinical Cases
            return {
                q: btoa(unescape(encodeURIComponent(question.q))),
                diagnosis: btoa(unescape(encodeURIComponent(question.diagnosis))),
                _encrypted: true
            };
        }
        return question;
    });

    console.log('🔐 Data encrypted and shuffled');
}

function decryptQuestion(encryptedQ) {
    // ✅ إضافة: تحقق من null/undefined
    if (!encryptedQ) {
        console.error('Question is null or undefined');
        return null;
    }

    if (!encryptedQ._encrypted) return encryptedQ;

    try {
        const decrypted = {
            q: decodeURIComponent(escape(atob(encryptedQ.q))),
            a: encryptedQ.a ? encryptedQ.a.map(opt => decodeURIComponent(escape(atob(opt)))) : undefined,
            diagnosis: encryptedQ.diagnosis ? decodeURIComponent(escape(atob(encryptedQ.diagnosis))) : undefined
        };

        // فك تشفير الجواب الصحيح
        if (encryptedQ._c) {
            const decryptedC = atob(encryptedQ._c);
            decrypted.c = parseInt(decryptedC.replace(SECURITY_CONFIG.SECRET_SALT, ''));
        }

        return decrypted;
    } catch (e) {
        console.error('Decryption error:', e);

        // ✅ تحسين: بدل ما نوقف الامتحان، نرجع السؤال الأصلي
        notify('⚠️ Question loading issue, please continue', 'red');

        // إذا كان السؤال مشفّر بشكل خاطئ، حاول ترجع النسخة الأصلية
        return {
            q: encryptedQ.q || 'Error loading question',
            a: encryptedQ.a || [],
            c: 0,
            diagnosis: encryptedQ.diagnosis
        };
    }
}
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// ═══════════════════════════════════════════════════════════
// ⚠️ نظام المخالفات
// ═══════════════════════════════════════════════════════════

function addViolation(reason) {
    violations++;

    const timestamp = new Date().toLocaleTimeString();
    console.warn(`⚠️ VIOLATION ${violations}/${SECURITY_CONFIG.MAX_VIOLATIONS} at ${timestamp}: ${reason}`);

    // حفظ المخالفة
    const violationLog = JSON.parse(localStorage.getItem('violationLog') || '[]');
    violationLog.push({
        student: studentName,
        reason: reason,
        timestamp: timestamp,
        count: violations
    });
    localStorage.setItem('violationLog', JSON.stringify(violationLog));

    if (violations >= SECURITY_CONFIG.MAX_VIOLATIONS) {
        terminateExam(`🚫 Maximum violations (${SECURITY_CONFIG.MAX_VIOLATIONS}) - Last: ${reason}`);
    }
}

// ═══════════════════════════════════════════════════════════
// 🚫 إنهاء الامتحان
// ═══════════════════════════════════════════════════════════

function terminateExam(reason) {
    isExamActive = false;
    if (typeof timerInterval !== 'undefined') {
        clearInterval(timerInterval);
    }

    // حفظ سبب الإنهاء
    const terminationData = {
        reason: reason,
        student: studentName,
        time: new Date().toISOString(),
        violations: violations,
        tabSwitches: tabSwitchCount
    };

    localStorage.setItem('examTerminated', JSON.stringify(terminationData));

    // شاشة الإنهاء
    document.body.innerHTML = `
        <div style="position: fixed; 
                    inset: 0; 
                    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    flex-direction: column; 
                    color: white; 
                    font-family: 'Arial', sans-serif; 
                    text-align: center; 
                    z-index: 999999;
                    animation: fadeIn 0.3s ease-out;">
            
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            </style>
            
            <div style="font-size: 6rem; 
                        margin-bottom: 2rem; 
                        animation: pulse 2s infinite;">
                🚫
            </div>
            
            <h1 style="font-size: 3.5rem; 
                       font-weight: 900; 
                       margin-bottom: 1rem;
                       text-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                EXAM TERMINATED
            </h1>
            
            <div style="background: rgba(0,0,0,0.3); 
                        padding: 2rem; 
                        border-radius: 1rem; 
                        margin: 2rem;
                        max-width: 600px;">
                <p style="font-size: 1.5rem; 
                         margin-bottom: 1rem;
                         font-weight: 600;">
                    ${reason}
                </p>
                
                <div style="border-top: 2px solid rgba(255,255,255,0.3); 
                           padding-top: 1.5rem; 
                           margin-top: 1.5rem;">
                    <p style="font-size: 1.2rem; margin: 0.5rem 0;">
                        <strong>Student:</strong> ${studentName}
                    </p>
                    <p style="font-size: 1rem; opacity: 0.9; margin: 0.5rem 0;">
                        <strong>Violations:</strong> ${violations}/${SECURITY_CONFIG.MAX_VIOLATIONS}
                    </p>
                    <p style="font-size: 0.9rem; opacity: 0.8; margin: 0.5rem 0;">
                        <strong>Time:</strong> ${new Date().toLocaleString()}
                    </p>
                </div>
            </div>
            
            <p style="font-size: 1.1rem; 
                     opacity: 0.9; 
                     margin-top: 2rem;
                     font-weight: 500;">
                ⚠️ Contact your instructor immediately
            </p>
            
            <p style="font-size: 0.85rem; 
                     opacity: 0.6; 
                     margin-top: 1rem;">
                This incident has been logged
            </p>
        </div>
    `;

    // منع أي تفاعل
    document.body.style.pointerEvents = 'none';

    // إعادة التوجيه بعد 8 ثواني
    setTimeout(() => {
        if (confirm('Exam terminated. Click OK to return to main menu.')) {
            location.reload();
        }
    }, 8000);
}

// ═══════════════════════════════════════════════════════════
// 🧹 تنظيف عند الخروج
// ═══════════════════════════════════════════════════════════

function cleanupSecurity() {
    // إزالة الـ Watermark
    const watermark = document.getElementById('security-watermark');
    if (watermark) watermark.remove();

    // إزالة الـ Styles
    const styles = document.getElementById('security-styles');
    if (styles) styles.remove();

    // ✅ إضافة: تنظيف مراقبة الاتصال
    if (typeof connectionCheckInterval !== 'undefined' && connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
        connectionCheckInterval = null;
    }
    if (typeof onlineCheckHandler !== 'undefined' && onlineCheckHandler) {
        window.removeEventListener('online', onlineCheckHandler);
        onlineCheckHandler = null;
    }

    // إعادة تعيين المتغيرات
    violations = 0;
    tabSwitchCount = 0;

    // إزالة class
    document.body.classList.remove('exam-active');

    // الخروج من Fullscreen
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}
// ═══════════════════════════════════════════════════════════
// 📤 تصدير الوظائف
// ═══════════════════════════════════════════════════════════

console.log('✅ Security System Loaded Successfully');