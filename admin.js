// --- AUTHENTICATION CHECK ---
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
        window.location.href = 'login.html';
    }
    loadPackages();
});

document.getElementById('logout-button').addEventListener('click', () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    window.location.href = 'login.html';
});


// --- DOM CONTAINERS ---
const mainPackagesContainer = document.getElementById('main-packages-container');
const callPackagesContainer = document.getElementById('call-packages-container');
const textPackagesContainer = document.getElementById('text-packages-container');
const addOnPackagesContainer = document.getElementById('addon-packages-container');
const form = document.getElementById('packages-form');

// --- UTILITY FUNCTIONS ---
const createId = () => 'pkg-' + Date.now() + Math.random().toString(16).slice(2);

const createFormGroup = (pkg, type, index) => {
    const div = document.createElement('div');
    div.className = 'form-group relative';
    div.dataset.id = pkg.id;
    div.dataset.type = type;
    div.dataset.index = index;

    let fields = '';
    for (const key in pkg) {
        if (key === 'id') continue;
        const value = pkg[key] || '';
        const isTextarea = key === 'description' || key === 'note';
        const labelText = key.charAt(0).toUpperCase() + key.slice(1);

        if (isTextarea) {
            fields += `
                <div class="mb-3">
                    <label for="${pkg.id}-${key}">${labelText}</label>
                    <textarea id="${pkg.id}-${key}" name="${key}" data-key="${key}" rows="3">${value.replace(/\\n/g, '\n')}</textarea>
                </div>`;
        } else {
            fields += `
                <div class="mb-3">
                    <label for="${pkg.id}-${key}">${labelText}</label>
                    <input type="text" id="${pkg.id}-${key}" name="${key}" value="${value}" data-key="${key}">
                </div>`;
        }
    }

    div.innerHTML = `
        <h4 class="font-bold text-lg text-white">${pkg.name || 'แพ็กเกจใหม่'}</h4>
        ${fields}
        <button type="button" class="btn btn-danger absolute top-4 right-4" onclick="removePackage(this)">ลบ</button>
    `;
    return div;
};

const createGroupedForm = (groupData, type) => {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.dataset.type = type;

    div.innerHTML = `
        <div class="mb-3">
            <label>Title</label>
            <input type="text" name="title" value="${groupData.title}" data-key="title">
        </div>
        <div class="mb-3">
            <label>Description</label>
            <textarea name="description" rows="2" data-key="description">${groupData.description}</textarea>
        </div>
        <div class="border-t border-gray-600 pt-4 mt-4" id="${type}-items-container">
            <h5 class="font-semibold mb-2">รายการย่อย:</h5>
        </div>
        <button type="button" class="btn btn-add mt-2" onclick="addPackageItem('${type}')">+ เพิ่มรายการย่อย</button>
    `;

    groupData.items.forEach((item, index) => {
        const itemDiv = createFormGroup(item, `${type}.items`, index);
        div.querySelector(`#${type}-items-container`).appendChild(itemDiv);
    });

    return div;
}

// --- LOAD & RENDER FUNCTIONS ---
function loadPackages() {
    mainPackagesContainer.innerHTML = '';
    packageData.mainPackages.forEach((pkg, i) => mainPackagesContainer.appendChild(createFormGroup(pkg, 'mainPackages', i)));

    callPackagesContainer.innerHTML = '';
    callPackagesContainer.appendChild(createGroupedForm(packageData.callPackages, 'callPackages'));
    
    textPackagesContainer.innerHTML = '';
    textPackagesContainer.appendChild(createGroupedForm(packageData.textPackages, 'textPackages'));

    addOnPackagesContainer.innerHTML = '';
    packageData.addOnPackages.forEach((pkg, i) => addOnPackagesContainer.appendChild(createFormGroup(pkg, 'addOnPackages', i)));
}

// --- DYNAMIC FORM ACTIONS ---
function addPackage(type) {
    const newPackage = { id: createId(), name: 'แพ็กเกจใหม่', price: '', description: '' };
    const container = document.getElementById(`${type.replace(/\[\d+\]/g, '')}-container`);
    const newIndex = container.children.length;
    container.appendChild(createFormGroup(newPackage, type, newIndex));
}

function addPackageItem(type) {
    const newItem = { id: createId(), name: 'รายการใหม่', price: ''};
    const container = document.getElementById(`${type}-items-container`);
    const newIndex = container.children.length - 1; // Adjust for h5
    container.appendChild(createFormGroup(newItem, `${type}.items`, newIndex));
}


function removePackage(button) {
    const formGroup = button.closest('.form-group');
    Swal.fire({
        title: 'ต้องการลบใช่หรือไม่?',
        text: "คุณจะไม่สามารถกู้คืนข้อมูลนี้ได้!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            formGroup.remove();
            Swal.fire(
                'ลบแล้ว!',
                'แพ็กเกจของคุณถูกลบเรียบร้อยแล้ว.',
                'success'
            )
        }
    })
}

// --- FORM SUBMISSION & DATA HANDLING ---
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newPackageData = {
        mainPackages: [],
        callPackages: { items: [] },
        textPackages: { items: [] },
        addOnPackages: []
    };

    // Helper to process form groups
    const processGroup = (container, targetArray) => {
        container.querySelectorAll(':scope > .form-group').forEach(group => {
            const pkg = { id: group.dataset.id };
            group.querySelectorAll('input, textarea').forEach(input => {
                pkg[input.dataset.key] = input.value.replace(/\n/g, '\\n');
            });
            targetArray.push(pkg);
        });
    };

    const processNestedGroup = (container, targetObject, type) => {
        const titleInput = container.querySelector(`[data-type="${type}"] input[data-key="title"]`);
        const descInput = container.querySelector(`[data-type="${type}"] textarea[data-key="description"]`);
        targetObject.title = titleInput.value;
        targetObject.description = descInput.value;
        targetObject.items = [];
        
        container.querySelectorAll(`:scope [id="${type}-items-container"] .form-group`).forEach(group => {
            const item = { id: group.dataset.id };
            group.querySelectorAll('input, textarea').forEach(input => {
                 item[input.dataset.key] = input.value.replace(/\n/g, '\\n');
            });
            targetObject.items.push(item);
        });
    }

    // Process all package types
    processGroup(mainPackagesContainer, newPackageData.mainPackages);
    processGroup(addOnPackagesContainer, newPackageData.addOnPackages);
    processNestedGroup(callPackagesContainer, newPackageData.callPackages, 'callPackages');
    processNestedGroup(textPackagesContainer, newPackageData.textPackages, 'textPackages');

    // Generate output code
    const outputString = `const packageData = ${JSON.stringify(newPackageData, null, 4)};`;

    // Show modal with the output
    document.getElementById('output-code').value = outputString;
    document.getElementById('output-modal').classList.remove('hidden');
    document.getElementById('output-modal').classList.add('flex');
});


// --- MODAL ACTIONS ---
document.getElementById('close-modal-button').addEventListener('click', () => {
    document.getElementById('output-modal').classList.add('hidden');
    document.getElementById('output-modal').classList.remove('flex');
});

document.getElementById('copy-button').addEventListener('click', () => {
    const outputCode = document.getElementById('output-code');
    outputCode.select();
    document.execCommand('copy');
    Swal.fire({
        icon: 'success',
        title: 'คัดลอกสำเร็จ!',
        text: 'นำโค้ดไปวางในไฟล์ packages.js ได้เลย',
        timer: 2000,
        showConfirmButton: false
    });
});
