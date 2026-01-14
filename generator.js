function generateBarcode() {
    if (db.length === 0) {
        notify("No content to export", "red");
        return;
    }

    let finalData = db;
    if (adminMode === 'case' || (db.length > 0 && db[0].diagnosis)) {
        finalData = { type: 'clinical_case', data: db };
    }

    const jsonString = JSON.stringify(finalData);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(jsonString)}`;
    
    const win = window.open('', '_blank');
    
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
    <style>
        body { 
            margin: 0; 
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: Arial, sans-serif;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
        }
        h1 { 
            color: #333; 
            margin-bottom: 20px; 
            font-size: 28px; 
        }
        img { 
            border: 10px solid #f0f0f0; 
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .info { 
            margin-top: 20px; 
            color: #666; 
            font-size: 14px; 
        }
        .buttons {
            margin-top: 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        button {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
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
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Exam QR Code</h1>
        <img src="${qrUrl}" alt="QR Code" id="qrImage">
        <div class="info">
            <p><strong>Type:</strong> ${adminMode === 'case' ? 'Clinical Case' : 'MCQ Exam'}</p>
            <p><strong>Questions:</strong> ${db.length}</p>
            <p>Students can scan this code to load the exam</p>
        </div>
        <div class="buttons">
            <button class="download" onclick="downloadQR()">Download QR</button>
            <button class="close" onclick="window.close()">Close</button>
        </div>
    </div>
    <script>
        function downloadQR() {
            const link = document.createElement('a');
            link.href = document.getElementById('qrImage').src;
            link.download = 'exam_qr_code.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    <\/script>
</body>
</html>`;

    win.document.open();
    win.document.write(htmlContent);
    win.document.close();
}