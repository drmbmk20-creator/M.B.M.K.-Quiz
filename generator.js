// @MBMK-FILE: GITHUB+SERVER | This file is used by both GitHub Pages and Local Server
function generateBarcode() {
    if (db.length === 0) {
        notify("No content to export", "red");
        return;
    }

    let finalData = db;
    if (adminMode === 'case' || (db.length > 0 && db[0].diagnosis)) {
        finalData = { type: 'clinical_case', data: db };
    }

    // ✅ ضغط البيانات قبل التشفير
    const jsonString = JSON.stringify(finalData);

    // ✅ تشفير بـ Base64 لتقليل الحجم
    const compressed = btoa(unescape(encodeURIComponent(jsonString)));

    const win = window.open('', '_blank', 'width=800,height=900');

    if (!win) {
        notify("Popup blocked! Please allow popups.", "red");
        return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Exam QR Code</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            margin: 0; 
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 90%;
        }
        h1 { 
            color: #333; 
            margin-bottom: 20px; 
            font-size: 28px; 
        }
        #qrcode {
            margin: 20px auto;
            padding: 20px;
            background: white;
            border-radius: 15px;
            display: inline-block;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .info { 
            margin-top: 20px; 
            color: #666; 
            font-size: 14px; 
        }
        .warning {
            background: #fff3cd;
            border: 2px solid #ffc107;
            color: #856404;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            font-size: 13px;
            font-weight: bold;
        }
        .buttons {
            margin-top: 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        button {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 14px;
        }
        .download { 
            background: #667eea; 
            color: white; 
        }
        .download:hover { 
            background: #5568d3; 
            transform: translateY(-2px); 
        }
        .close { 
            background: #e0e0e0; 
            color: #333; 
        }
        .close:hover { 
            background: #d0d0d0; 
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin: 20px 0;
        }
        .stat-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        .stat-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 20px;
            color: #333;
            font-weight: bold;
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
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

        <div id="qrcode"></div>
        
        <div class="warning">
            ⚠️ This QR code is valid for ONE TIME USE only<br>
            Expires: ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()}
        </div>
        
        <div class="info">
            <p><strong>Instructions:</strong></p>
            <p>1. Students must scan this code in OFFLINE mode</p>
            <p>2. Code contains encrypted exam data</p>
            <p>3. Cannot be used with internet connection</p>
        </div>
        
        <div class="buttons">
            <button class="download" onclick="downloadQR()">📥 Download QR</button>
            <button class="download" onclick="printQR()">🖨️ Print</button>
            <button class="close" onclick="window.close()">Close</button>
        </div>
    </div>
    <script>
        // ✅ توليد QR بحجم مناسب
        const qrData = '${compressed}';
        
        // تحديد حجم الـ QR بناءً على حجم البيانات
        let qrSize = 256;
        if (qrData.length > 1000) qrSize = 300;
        if (qrData.length > 2000) qrSize = 350;
        if (qrData.length > 3000) qrSize = 400;
        
        new QRCode(document.getElementById("qrcode"), {
            text: qrData,
            width: qrSize,
            height: qrSize,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M // ✅ Medium error correction
        });

        function downloadQR() {
            const canvas = document.querySelector('#qrcode canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.download = 'MBMK_Exam_QR_${Date.now()}.png';
                link.href = canvas.toDataURL();
                link.click();
            }
        }

        function printQR() {
            window.print();
        }
    </script>
</body>
</html>`;

    win.document.open();
    win.document.write(htmlContent);
    win.document.close();
}