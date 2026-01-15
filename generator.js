function generateBarcode() {
    if (db.length === 0) {
        notify("No content to export", "red");
        return;
    }

    // تحذير لو البيانات كثيرة
    if (db.length > 50) {
        const confirm = window.confirm(
            `⚠️ Warning: ${db.length} questions may create a large QR code.\n\n` +
            `For better scanning:\n` +
            `• Keep exams under 30 questions\n` +
            `• Or use Import/Export JSON instead\n\n` +
            `Continue anyway?`
        );
        if (!confirm) return;
    }

    let finalData = db;
    if (adminMode === 'case' || (db.length > 0 && db[0].diagnosis)) {
        finalData = { type: 'clinical_case', data: db };
    }

    const jsonString = JSON.stringify(finalData);
    
    // ضغط البيانات
    const compressed = btoa(unescape(encodeURIComponent(jsonString)));
    
    console.log(`📊 QR Data Size: ${(compressed.length / 1024).toFixed(2)} KB`);
    
    const win = window.open('', '_blank', 'width=800,height=900');
    
    if (!win) {
        notify("Popup blocked! Please allow popups.", "red");
        return;
    }

    // تحديد حجم الـ QR بناءً على حجم البيانات
    let qrSize = 256;
    if (compressed.length > 1000) qrSize = 300;
    if (compressed.length > 2000) qrSize = 350;
    if (compressed.length > 3000) qrSize = 400;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Exam QR Code</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 600px;
            width: 100%;
        }
        h1 { 
            color: #333; 
            margin-bottom: 30px; 
            font-size: 32px;
            font-weight: 800;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-box {
            background: #f8f9fa;
            padding: 20px 15px;
            border-radius: 12px;
            border-left: 4px solid #667eea;
        }
        .stat-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .stat-value {
            font-size: 24px;
            color: #333;
            font-weight: 800;
        }
        #qrcode-container {
            background: white;
            padding: 30px;
            border-radius: 16px;
            display: inline-block;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            margin: 20px 0;
        }
        #qrcode {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: ${qrSize}px;
        }
        .loading {
            color: #667eea;
            font-size: 16px;
            font-weight: 600;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .warning {
            background: #fff3cd;
            border: 2px solid #ffc107;
            color: #856404;
            padding: 18px;
            border-radius: 12px;
            margin: 25px 0;
            font-size: 14px;
            font-weight: 600;
            line-height: 1.6;
        }
        .info { 
            margin: 25px 0;
            color: #666; 
            font-size: 14px;
            line-height: 1.8;
        }
        .info strong {
            color: #333;
            display: block;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .buttons {
            margin-top: 30px;
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }
        button {
            padding: 14px 28px;
            border: none;
            border-radius: 10px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .download { 
            background: #667eea; 
            color: white;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .download:hover { 
            background: #5568d3; 
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
        }
        .download:active {
            transform: translateY(0);
        }
        .close { 
            background: #e9ecef; 
            color: #495057; 
        }
        .close:hover { 
            background: #dee2e6; 
        }
        @media print {
            body { background: white; }
            .buttons { display: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Exam QR Code</h1>
        
        <div class="stats">
            <div class="stat-box">
                <div class="stat-label">Type</div>
                <div class="stat-value">${adminMode === 'case' ? 'Clinical' : 'MCQ'}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Questions</div>
                <div class="stat-value">${db.length}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Data Size</div>
                <div class="stat-value">${(compressed.length / 1024).toFixed(1)} KB</div>
            </div>
        </div>

        <div id="qrcode-container">
            <div id="qrcode">
                <div class="loading">⏳ Generating QR Code...</div>
            </div>
        </div>
        
        <div class="warning">
            ⚠️ This QR code is valid for ONE TIME USE only<br>
            Expires: ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}
        </div>
        
        <div class="info">
            <strong>📋 Instructions:</strong>
            <div style="text-align: left; margin: 0 auto; max-width: 400px;">
                1. Students must scan this code in <strong>OFFLINE mode</strong><br>
                2. Code contains encrypted exam data<br>
                3. Cannot be used with internet connection<br>
                4. Scan directly from screen (don't screenshot)
            </div>
        </div>
        
        <div class="buttons">
            <button class="download" onclick="downloadQR()">
                <span>📥</span> Download QR
            </button>
            <button class="download" onclick="window.print()">
                <span>🖨️</span> Print
            </button>
            <button class="close" onclick="window.close()">Close</button>
        </div>
    </div>

    <!-- ✅ تحميل المكتبة من CDN موثوق -->
    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
    
    <script>
        // ✅ انتظر تحميل المكتبة
        window.addEventListener('load', function() {
            setTimeout(function() {
                try {
                    const qrData = '${compressed}';
                    const qrDiv = document.getElementById('qrcode');
                    
                    // مسح رسالة التحميل
                    qrDiv.innerHTML = '';
                    
                    // توليد الـ QR Code
                    const qrcode = new QRCode(qrDiv, {
                        text: qrData,
                        width: ${qrSize},
                        height: ${qrSize},
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.M
                    });
                    
                    console.log('✅ QR Code generated successfully');
                    
                } catch (error) {
                    console.error('❌ QR Generation Error:', error);
                    document.getElementById('qrcode').innerHTML = 
                        '<div style="color: #dc3545; font-weight: 600;">❌ Failed to generate QR Code<br><small>Check console for details</small></div>';
                }
            }, 500); // ✅ انتظر 500ms للتأكد من تحميل المكتبة
        });

        function downloadQR() {
            try {
                const canvas = document.querySelector('#qrcode canvas');
                if (!canvas) {
                    alert('❌ QR Code not ready yet. Please wait a moment.');
                    return;
                }
                
                const link = document.createElement('a');
                const timestamp = new Date().toISOString().split('T')[0];
                link.download = 'MBMK_Exam_${adminMode}_' + timestamp + '.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
                
                console.log('✅ QR Code downloaded');
            } catch (error) {
                console.error('❌ Download Error:', error);
                alert('Failed to download QR Code');
            }
        }
    </script>
</body>
</html>`;

    win.document.open();
    win.document.write(htmlContent);
    win.document.close();
}
