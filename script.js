// ============ CALCULATOR FUNCTIONS ============
let displayValue = '';
let storedPin = localStorage.getItem('vaultPin') || '';
let isVaultUnlocked = false;

function appendValue(value) {
    displayValue += value;
    updateDisplay();
    checkSecretPin();
}

function updateDisplay() {
    document.getElementById('calcDisplay').value = displayValue || '0';
}

function clearDisplay() {
    displayValue = '';
    updateDisplay();
}

function backspace() {
    displayValue = displayValue.slice(0, -1);
    updateDisplay();
}

function calculate() {
    try {
        // Check if entered PIN matches
        if (storedPin && displayValue === storedPin) {
            openVault();
            clearDisplay();
            return;
        }
        
        // Normal calculation
        let expression = displayValue.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        let result = eval(expression);
        displayValue = Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, '');
        updateDisplay();
    } catch (error) {
        document.getElementById('calcDisplay').value = 'Error';
        displayValue = '';
    }
}

// ============ SECRET PIN DETECTION ============
function checkSecretPin() {
    if (storedPin && displayValue === storedPin) {
        setTimeout(() => {
            openVault();
            clearDisplay();
        }, 300);
    }
}

// ============ VAULT FUNCTIONS ============
function openVault() {
    document.getElementById('calculator').style.display = 'none';
    document.getElementById('vault').style.display = 'block';
    
    if (storedPin) {
        document.getElementById('pinSetup').style.display = 'none';
        document.getElementById('pinLogin').style.display = 'block';
        document.getElementById('vaultContent').style.display = 'none';
    } else {
        document.getElementById('pinSetup').style.display = 'block';
        document.getElementById('pinLogin').style.display = 'none';
        document.getElementById('vaultContent').style.display = 'none';
    }
}

function closeVault() {
    document.getElementById('vault').style.display = 'none';
    document.getElementById('calculator').style.display = 'block';
    isVaultUnlocked = false;
}

function setupPin() {
    const newPin = document.getElementById('newPin').value;
    const confirmPin = document.getElementById('confirmPin').value;
    
    if (newPin.length !== 4) {
        alert('PIN must be 4 digits!');
        return;
    }
    
    if (newPin !== confirmPin) {
        alert('PINs do not match!');
        return;
    }
    
    storedPin = newPin;
    localStorage.setItem('vaultPin', storedPin);
    
    document.getElementById('pinSetup').style.display = 'none';
    document.getElementById('pinLogin').style.display = 'block';
    document.getElementById('vaultContent').style.display = 'none';
    document.getElementById('newPin').value = '';
    document.getElementById('confirmPin').value = '';
    
    alert('PIN set successfully!');
}

function verifyPin() {
    const enteredPin = document.getElementById('loginPin').value;
    
    if (enteredPin === storedPin) {
        isVaultUnlocked = true;
        document.getElementById('pinLogin').style.display = 'none';
        document.getElementById('vaultContent').style.display = 'block';
        document.getElementById('loginPin').value = '';
        loadFiles();
    } else {
        alert('Wrong PIN!');
    }
}

function logout() {
    isVaultUnlocked = false;
    document.getElementById('vaultContent').style.display = 'none';
    document.getElementById('pinLogin').style.display = 'block';
}

function changePin() {
    const newPin = prompt('Enter new 4-digit PIN:');
    if (newPin && newPin.length === 4 && !isNaN(newPin)) {
        storedPin = newPin;
        localStorage.setItem('vaultPin', storedPin);
        alert('PIN changed successfully!');
    } else {
        alert('Invalid PIN! Must be 4 digits.');
    }
}

// ============ FILE MANAGEMENT ============
let hiddenFiles = JSON.parse(localStorage.getItem('hiddenFiles') || '[]');

function uploadFiles() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (files.length === 0) return;
    
    let processed = 0;
    
    for (let file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                hiddenFiles.push({
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result,
                    date: new Date().toLocaleString()
                });
                processed++;
                
                if (processed === files.length) {
                    saveFiles();
                }
            } catch (error) {
                console.error('File too large:', error);
                alert('File too large to store: ' + file.name);
            }
        };
        reader.readAsDataURL(file);
    }
    
    fileInput.value = '';
}

function saveFiles() {
    try {
        localStorage.setItem('hiddenFiles', JSON.stringify(hiddenFiles));
        loadFiles();
        alert('Files saved successfully!');
    } catch (error) {
        alert('Storage full! Delete some files.');
        hiddenFiles = JSON.parse(localStorage.getItem('hiddenFiles') || '[]');
        loadFiles();
    }
}

function loadFiles() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    
    if (hiddenFiles.length === 0) {
        fileList.innerHTML = '<p style="color:#888;text-align:center;">No hidden files</p>';
        return;
    }
    
    hiddenFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span>📁 ${file.name}</span>
            <div>
                <button onclick="downloadFile(${index})">⬇</button>
                <button onclick="deleteFile(${index})">🗑</button>
            </div>
        `;
        fileList.appendChild(fileItem);
    });
}

function downloadFile(index) {
    const file = hiddenFiles[index];
    if (!file) return;
    
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function deleteFile(index) {
    if (confirm('Delete this file?')) {
        hiddenFiles.splice(index, 1);
        localStorage.setItem('hiddenFiles', JSON.stringify(hiddenFiles));
        loadFiles();
    }
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', function() {
    updateDisplay();
    document.getElementById('calculator').style.display = 'block';
    document.getElementById('vault').style.display = 'none';
    
    // File input listener
    document.getElementById('fileInput').addEventListener('change', uploadFiles);
    
    // Prevent zoom on double tap
    document.addEventListener('dblclick', function(e) {
        e.preventDefault();
    }, { passive: false });
});

// Prevent back button from closing app unexpectedly
window.addEventListener('popstate', function(event) {
    if (isVaultUnlocked) {
        logout();
    }
});
