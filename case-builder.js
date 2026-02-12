// @MBMK-FILE: GITHUB-ONLY | This file is used by GitHub Pages only, NOT used by Local Server
// Clinical Case Builder - Vanilla JavaScript Module
// Designed to work inside index.html as a view

// Lab Master Database with normal ranges
const Lab_Master = {
    "Hb": { name: "Hemoglobin", min: 13.5, max: 17.5, unit: "g/dL" },
    "WBC": { name: "White Blood Cells", min: 4000, max: 11000, unit: "/mm3" },
    "PLT": { name: "Platelets", min: 150000, max: 450000, unit: "/mm3" },
    "ESR": { name: "Erythrocyte Sedimentation Rate", min: 0, max: 20, unit: "mm/hr" },
    "PT": { name: "Prothrombin Time", min: 11, max: 13.5, unit: "sec" },
    "PTT": { name: "Partial Thromboplastin Time", min: 25, max: 35, unit: "sec" },
    "INR": { name: "International Normalized Ratio", min: 0.8, max: 1.2, unit: "" },
    "D-Dimer": { name: "D-Dimer", min: 0, max: 500, unit: "ng/mL" },
    "S.Creatinine": { name: "Serum Creatinine", min: 0.7, max: 1.3, unit: "mg/dL" },
    "S.Urea": { name: "Blood Urea", min: 7, max: 20, unit: "mg/dL" },
    "S.Sodium": { name: "Sodium (Na+)", min: 135, max: 145, unit: "mmol/L" },
    "S.Potassium": { name: "Potassium (K+)", min: 3.5, max: 5.1, unit: "mmol/L" },
    "S.Calcium": { name: "Total Calcium", min: 8.5, max: 10.5, unit: "mg/dL" },
    "S.Phosphate": { name: "Phosphate", min: 2.5, max: 4.5, unit: "mg/dL" },
    "RBS": { name: "Random Blood Sugar", min: 70, max: 140, unit: "mg/dL" },
    "HbA1c": { name: "Glycated Hemoglobin", min: 4.0, max: 5.6, unit: "%" },
    "S.Cholesterol": { name: "Total Cholesterol", min: 125, max: 200, unit: "mg/dL" },
    "TG": { name: "Triglycerides", min: 40, max: 150, unit: "mg/dL" },
    "Troponin": { name: "Troponin I", min: 0.0, max: 0.04, unit: "ng/mL" },
    "CK-MB": { name: "Creatine Kinase-MB", min: 0, max: 5, unit: "ng/mL" },
    "CRP": { name: "C-Reactive Protein", min: 0, max: 10, unit: "mg/L" },
    "Procalcitonin": { name: "Procalcitonin", min: 0.0, max: 0.5, unit: "ng/mL" },
    "S.Bilirubin": { name: "Total Bilirubin", min: 0.1, max: 1.2, unit: "mg/dL" },
    "ALT": { name: "Alanine Aminotransferase", min: 7, max: 55, unit: "U/L" },
    "AST": { name: "Aspartate Aminotransferase", min: 8, max: 48, unit: "U/L" },
    "ALP": { name: "Alkaline Phosphatase", min: 44, max: 147, unit: "U/L" },
    "Albumin": { name: "Serum Albumin", min: 3.5, max: 5.0, unit: "g/dL" },
    "TSH": { name: "Thyroid Stimulating Hormone", min: 0.4, max: 4.0, unit: "mIU/L" },
    "Free_T4": { name: "Free Thyroxine", min: 0.8, max: 1.8, unit: "ng/dL" },
    "Amylase": { name: "Serum Amylase", min: 30, max: 110, unit: "U/L" },
    "pH": { name: "Arterial pH", min: 7.35, max: 7.45, unit: "" },
    "PaCO2": { name: "Partial Pressure of CO2", min: 35, max: 45, unit: "mmHg" },
    "HCO3": { name: "Bicarbonate", min: 22, max: 28, unit: "mEq/L" },
    "Lactate": { name: "Serum Lactate", min: 0.5, max: 2.2, unit: "mmol/L" }
};

// Normal Physical Exam Texts
const normalExamTexts = {
    general: "Alert, conscious, oriented to time, place and person, not in distress",
    vitals: "BP 120/80 mmHg, HR 75 bpm, RR 16/min, Temp 37°C, O2 Sat 98% on room air",
    head_neck: "Normocephalic, atraumatic, pupils equal and reactive to light, no lymphadenopathy",
    cvs: "S1S2 heard, regular rate and rhythm, no murmurs, rubs or gallops",
    respiratory: "Clear bilateral air entry, no wheezes, crackles or rhonchi",
    abdomen: "Soft, non-tender, non-distended, bowel sounds present, no organomegaly",
    musculoskeletal: "Normal bulk and tone, full range of motion, no deformities",
    neurological: "GCS 15/15, cranial nerves II-XII intact, motor power 5/5 all limbs, reflexes 2+ symmetric",
    skin: "Warm, dry, no rashes, cyanosis, or edema"
};

// Case Builder State
let caseBuilderData = {
    caseTitle: "",
    history: "",
    physicalExam: {
        general: "",
        vitals: "",
        head_neck: "",
        cvs: "",
        respiratory: "",
        abdomen: "",
        musculoskeletal: "",
        neurological: "",
        skin: ""
    },
    labOverrides: []
};

// Get normal exam text for a system
function getNormalExamText(system) {
    return normalExamTexts[system] || "";
}

// Get lab info string
function getLabInfo(testName) {
    const lab = Lab_Master[testName];
    if (lab) {
        return `${lab.name} | Normal: ${lab.min}-${lab.max} ${lab.unit}`;
    }
    return "";
}

// Generate random normal value for a lab test
function getRandomNormalValue(testName) {
    const lab = Lab_Master[testName];
    if (!lab) return "";
    const range = lab.max - lab.min;
    const randomValue = lab.min + (Math.random() * range);
    return testName === "INR" || testName === "HbA1c" || testName === "pH"
        ? randomValue.toFixed(2)
        : testName === "Troponin" || testName === "Procalcitonin" || testName === "Lactate"
            ? randomValue.toFixed(2)
            : Math.round(randomValue);
}

// Check if a lab value is abnormal
function isAbnormal(testName, value) {
    const lab = Lab_Master[testName];
    if (!lab) return false;
    const numValue = parseFloat(value);
    return numValue < lab.min || numValue > lab.max;
}

// Show Case Builder View
function showCaseBuilder() {
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('caseBuilderView').classList.remove('hidden');
    renderCaseBuilder();
}

// Hide Case Builder View
function hideCaseBuilder() {
    document.getElementById('caseBuilderView').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
}

// Render Case Builder UI
function renderCaseBuilder() {
    const container = document.getElementById('caseBuilderContent');

    // Generate lab options
    let labOptions = '';
    Object.keys(Lab_Master).forEach(key => {
        labOptions += `<option value="${key}">${key} - ${Lab_Master[key].name}</option>`;
    });

    // Generate lab overrides HTML
    let labOverridesHTML = '';
    caseBuilderData.labOverrides.forEach((lab, index) => {
        labOverridesHTML += `
            <div class="bg-white/80 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                <div class="flex flex-col md:flex-row gap-3 items-center">
                    <select onchange="updateCaseBuilderLab(${index}, 'testName', this.value)"
                        class="flex-[2] p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none">
                        ${Object.keys(Lab_Master).map(key =>
            `<option value="${key}" ${lab.testName === key ? 'selected' : ''}>${key} - ${Lab_Master[key].name}</option>`
        ).join('')}
                    </select>
                    <input 
                        type="text"
                        placeholder="Abnormal Value"
                        value="${lab.value}"
                        onchange="updateCaseBuilderLab(${index}, 'value', this.value)"
                        class="flex-1 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                    />
                    <button onclick="removeCaseBuilderLab(${index})"
                        class="px-4 py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all font-black text-xs">
                        Delete
                    </button>
                </div>
                <div class="text-[11px] text-slate-400 mt-2 font-bold">
                    ${getLabInfo(lab.testName)}
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Case Title -->
            <div class="glass-card rounded-[2rem] p-6">
                <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                    Case Title (For Reference)
                </label>
                <input
                    type="text"
                    id="cbCaseTitle"
                    placeholder="e.g., Acute Appendicitis"
                    value="${caseBuilderData.caseTitle}"
                    onchange="caseBuilderData.caseTitle = this.value"
                    class="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none focus:border-cyan-400 transition-colors"
                />
            </div>

            <!-- History Section -->
            <div class="glass-card rounded-[2rem] p-6">
                <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                    Patient History (Shown to Student)
                </label>
                <textarea
                    id="cbHistory"
                    rows="6"
                    placeholder="Write the clinical history here..."
                    onchange="caseBuilderData.history = this.value"
                    class="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none resize-none leading-relaxed focus:border-cyan-400 transition-colors"
                >${caseBuilderData.history}</textarea>
            </div>

            <!-- Physical Exam Section -->
            <div class="glass-card rounded-[2rem] overflow-hidden">
                <div class="p-6 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all flex justify-between items-center"
                    onclick="toggleCBExamSection()">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-black text-slate-800 dark:text-white">Physical Examination</h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400 font-bold">Override normal findings</p>
                        </div>
                    </div>
                    <span id="cbExamArrow" class="text-2xl text-indigo-500 transition-transform">▼</span>
                </div>

                <div id="cbExamContent" class="hidden p-6 pt-0 border-t border-slate-200/50 dark:border-slate-700/50">
                    <p class="text-xs text-slate-400 mb-6 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                        * Leave fields empty for automatic "normal" findings.
                    </p>

                    <div class="grid md:grid-cols-2 gap-4">
                        ${[
            { key: 'general', label: 'General Appearance', placeholder: 'e.g., Alert, oriented, in mild distress' },
            { key: 'vitals', label: 'Vital Signs', placeholder: 'e.g., BP 160/95, HR 110, RR 22' },
            { key: 'head_neck', label: 'Head & Neck', placeholder: 'e.g., Pale conjunctiva' },
            { key: 'cvs', label: 'Cardiovascular (CVS)', placeholder: 'e.g., S1S2 +, murmur' },
            { key: 'respiratory', label: 'Respiratory', placeholder: 'e.g., Decreased air entry' },
            { key: 'abdomen', label: 'Abdominal', placeholder: 'e.g., Tender RLQ, guarding' },
            { key: 'musculoskeletal', label: 'Musculoskeletal', placeholder: 'e.g., Swollen knee' },
            { key: 'neurological', label: 'Neurological', placeholder: 'e.g., GCS 14/15, weakness' },
            { key: 'skin', label: 'Skin & Extremities', placeholder: 'e.g., Jaundiced, rash' }
        ].map(item => `
                            <div>
                                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">${item.label}</label>
                                <input
                                    type="text"
                                    placeholder="${item.placeholder}"
                                    value="${caseBuilderData.physicalExam[item.key]}"
                                    onchange="caseBuilderData.physicalExam['${item.key}'] = this.value"
                                    class="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm focus:border-cyan-400 transition-colors"
                                />
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Lab Overrides Section -->
            <div class="glass-card rounded-[2rem] overflow-hidden">
                <div class="p-6 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all flex justify-between items-center"
                    onclick="toggleCBLabSection()">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 16m14.8-.7l-.8 2.8c-.175.612-.69 1.079-1.322 1.2l-1.178.235a9.023 9.023 0 01-5 0l-1.178-.235c-.633-.12-1.147-.588-1.322-1.2l-.8-2.8" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-black text-slate-800 dark:text-white">Laboratory Tests</h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400 font-bold">Add abnormal labs only</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="px-3 py-1 bg-orange-500 text-white text-[10px] font-black rounded-full">
                            ${caseBuilderData.labOverrides.length} Labs
                        </span>
                        <span id="cbLabArrow" class="text-2xl text-orange-500 transition-transform rotate-180">▼</span>
                    </div>
                </div>

                <div id="cbLabContent" class="p-6 pt-0 border-t border-slate-200/50 dark:border-slate-700/50">
                    <p class="text-xs text-slate-400 mb-6 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                        * Only add abnormal labs. All other labs will appear normal automatically in PDF.
                    </p>

                    <div id="cbLabList" class="space-y-4">
                        ${labOverridesHTML}
                    </div>

                    <button onclick="addCaseBuilderLab()"
                        class="mt-4 w-full py-4 bg-orange-500/10 text-orange-500 rounded-2xl hover:bg-orange-500 hover:text-white transition-all font-black text-sm flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Abnormal Lab
                    </button>
                </div>
            </div>

            <!-- Export Buttons -->
            <div class="flex flex-col md:flex-row gap-4">
                <button onclick="exportCaseJSON()"
                    class="flex-1 py-5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-black rounded-[1.5rem] shadow-xl hover:shadow-cyan-500/20 active:scale-[0.98] transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    📦 Export JSON for Website
                </button>
                <button onclick="exportCasePDF()"
                    class="flex-1 py-5 bg-gradient-to-r from-red-500 to-pink-500 text-white font-black rounded-[1.5rem] shadow-xl hover:shadow-red-500/20 active:scale-[0.98] transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    📄 Export PDF for Review
                </button>
            </div>
        </div>
    `;
}

// Toggle Exam Section
function toggleCBExamSection() {
    const content = document.getElementById('cbExamContent');
    const arrow = document.getElementById('cbExamArrow');
    content.classList.toggle('hidden');
    arrow.classList.toggle('rotate-180');
}

// Toggle Lab Section
function toggleCBLabSection() {
    const content = document.getElementById('cbLabContent');
    const arrow = document.getElementById('cbLabArrow');
    content.classList.toggle('hidden');
    arrow.classList.toggle('rotate-180');
}

// Add Lab Override
function addCaseBuilderLab() {
    caseBuilderData.labOverrides.push({ testName: "Hb", value: "" });
    renderCaseBuilder();
}

// Update Lab Override
function updateCaseBuilderLab(index, field, value) {
    caseBuilderData.labOverrides[index][field] = value;
    if (field === 'testName') {
        renderCaseBuilder(); // Re-render to update lab info
    }
}

// Remove Lab Override
function removeCaseBuilderLab(index) {
    caseBuilderData.labOverrides.splice(index, 1);
    renderCaseBuilder();
}

// Export Case as JSON
function exportCaseJSON() {
    const jsonOutput = {
        type: "interactive_diagnostic",
        data: {
            caseTitle: caseBuilderData.caseTitle || "Untitled Case",
            history: caseBuilderData.history || "",
            physicalExam: {
                general: caseBuilderData.physicalExam.general || getNormalExamText('general'),
                vitals: caseBuilderData.physicalExam.vitals || getNormalExamText('vitals'),
                head_neck: caseBuilderData.physicalExam.head_neck || getNormalExamText('head_neck'),
                cvs: caseBuilderData.physicalExam.cvs || getNormalExamText('cvs'),
                respiratory: caseBuilderData.physicalExam.respiratory || getNormalExamText('respiratory'),
                abdomen: caseBuilderData.physicalExam.abdomen || getNormalExamText('abdomen'),
                musculoskeletal: caseBuilderData.physicalExam.musculoskeletal || getNormalExamText('musculoskeletal'),
                neurological: caseBuilderData.physicalExam.neurological || getNormalExamText('neurological'),
                skin: caseBuilderData.physicalExam.skin || getNormalExamText('skin')
            },
            labOverrides: caseBuilderData.labOverrides
        }
    };

    const blob = new Blob([JSON.stringify(jsonOutput, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseBuilderData.caseTitle || 'case'}.json`;
    a.click();
    URL.revokeObjectURL(url);

    notify("JSON exported successfully!", "teal");
}

// Export Case as PDF (requires jsPDF library)
function exportCasePDF() {
    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
        // Load jsPDF dynamically
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script1.onload = () => {
            const script2 = document.createElement('script');
            script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
            script2.onload = () => generateCasePDF();
            document.head.appendChild(script2);
        };
        document.head.appendChild(script1);
        notify("Loading PDF library...", "cyan");
    } else {
        generateCasePDF();
    }
}

function generateCasePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = 20;

    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text("CLINICAL CASE REPORT", 105, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Case: ${caseBuilderData.caseTitle || "Untitled Case"}`, 20, yPos);
    yPos += 7;
    doc.setFont(undefined, 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`, 20, yPos);
    yPos += 15;

    doc.setFont(undefined, 'bold');
    doc.text("PATIENT HISTORY", 20, yPos);
    yPos += 7;
    doc.setFont(undefined, 'normal');
    const historyLines = doc.splitTextToSize(caseBuilderData.history || "No history recorded.", 170);
    doc.text(historyLines, 20, yPos);
    yPos += historyLines.length * 7 + 10;

    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }
    doc.setFont(undefined, 'bold');
    doc.text("PHYSICAL EXAMINATION", 20, yPos);
    yPos += 7;
    doc.setFont(undefined, 'normal');

    const examLabels = {
        general: "General Appearance",
        vitals: "Vital Signs",
        head_neck: "Head & Neck",
        cvs: "Cardiovascular System",
        respiratory: "Respiratory System",
        abdomen: "Abdominal System",
        musculoskeletal: "Musculoskeletal",
        neurological: "Neurological System",
        skin: "Skin & Extremities"
    };

    Object.keys(examLabels).forEach(key => {
        const value = caseBuilderData.physicalExam[key] || getNormalExamText(key);

        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        doc.setFont(undefined, 'bold');
        doc.text(`${examLabels[key]}:`, 25, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        const examLines = doc.splitTextToSize(value, 165);
        doc.text(examLines, 25, yPos);
        yPos += examLines.length * 6 + 5;
    });

    doc.addPage();
    yPos = 20;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text("LABORATORY INVESTIGATIONS", 105, yPos, { align: 'center' });
    yPos += 10;

    const labOverrideMap = {};
    caseBuilderData.labOverrides.forEach(lab => {
        labOverrideMap[lab.testName] = lab.value;
    });

    const tableData = [];
    Object.keys(Lab_Master).forEach((testName) => {
        const labInfo = Lab_Master[testName];
        const value = labOverrideMap[testName] || getRandomNormalValue(testName);
        const normalRange = `${labInfo.min}-${labInfo.max}`;

        tableData.push([
            testName,
            labInfo.name,
            `${value} ${labInfo.unit}`,
            `${normalRange} ${labInfo.unit}`
        ]);
    });

    doc.autoTable({
        startY: yPos,
        head: [['Test', 'Name', 'Value', 'Normal Range']],
        body: tableData,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 2,
            halign: 'left'
        },
        headStyles: {
            fillColor: [52, 152, 219],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 70 },
            2: { cellWidth: 35 },
            3: { cellWidth: 50 }
        },
        didParseCell: function (data) {
            if (data.column.index === 2 && data.section === 'body') {
                const testName = tableData[data.row.index][0];
                const value = labOverrideMap[testName];
                if (value && isAbnormal(testName, value)) {
                    data.cell.styles.textColor = [231, 76, 60];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        }
    });

    doc.save(`${caseBuilderData.caseTitle || "case"}.pdf`);
    notify("PDF exported successfully!", "teal");
}
